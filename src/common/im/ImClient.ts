import { QueueingSubject } from 'queueing-subject';
import { Observable, interval, Subscription, timer } from 'rxjs';
import {
  switchMap,
  share,
  map,
  filter,
  retryWhen,
  delay
} from 'rxjs/operators';
import makeWebSocketObservable, {
  GetWebSocketResponses,
  WebSocketOptions,
  normalClosureMessage
} from 'rxjs-websockets';
import { ImPacket } from './ImPacket';
import { Command } from './enums';
import {
  observable,
  computed,
  action,
  flow,
  runInAction,
  set,
  isObservable,
  isObservableProp
} from 'mobx';
import {
  IPayload,
  ICallRespPayload,
  IRemindPushPayload,
  IOnlineOfflinePushPayload,
  IOnlineNotifySubscribeReqPayload,
  IChatReqPayload,
  IClearRemindReqPayload
} from './payload-model';
import { IMessageDetailModel, IRoomInfoModel } from './model';
import reduceArrayToMap from '../kit/functions/reduceArrayToMap';
import EventEmitter from 'wolfy87-eventemitter';
import patchToModelArray from '../kit/functions/patchToModelArray';
import flatMap from 'lodash/flatMap';
import uniq from 'lodash/uniq';
import differenceWith from 'lodash/differenceWith';
import log from '@/common/kit/functions/log';
import React from 'react';
import isNullOrUndef from '../kit/functions/isNullOrUndef';

const ob = observable;

export type WebSocketPayload = string | ArrayBuffer | Blob;

export interface ImClientConfig {
  url: string;
  role: 'customer' | 'waiter';
}

export class ImClient {
  private static readonly HEARTBEAT_RHYTHM = 3000; // ms

  private socket$: Observable<GetWebSocketResponses<string>>;
  private input$ = new QueueingSubject<ImPacket>();
  private output$: Observable<ImPacket>;
  private subscriptions: Subscription[] = [];

  @observable private _me?: AccountBaseInfo;

  /**
   * public state
   */

  public readonly role: 'customer' | 'waiter';

  public readonly bus: EventEmitter = new EventEmitter();

  /**
   * base state
   */

  @observable readonly accounts: AccountBaseInfo[] = [];
  @observable readonly waiters: AccountBaseInfo[] = [];
  @observable readonly rooms: RoomInfo[] = [];
  @observable
  readonly roomKeyToMessageList: Map<string, IMessageDetailModel[]> = new Map();
  @observable
  readonly roomKeyToLastMsgPage: Map<
    string,
    Page<IMessageDetailModel>
  > = new Map();

  /**
   * computed state
   */

  @computed
  get me() {
    return this._me;
  }

  @computed
  get idToAccount() {
    return reduceArrayToMap(this.accounts, (account) => account.id);
  }

  @computed
  get roomKeyToRoom() {
    return reduceArrayToMap(this.rooms, (room) => room.roomKey);
  }

  @computed
  get otherIdToRoom() {
    return reduceArrayToMap(
      this.rooms.filter(
        (room) => room.type === 1 && room.members && room.members.length > 0
      ),
      (room) => room.members.filter((id) => this._me!.id !== id)[0]
    );
  }

  @computed
  get sortedWaiterListByLastMsgSendAtDesc() {
    return this.waiters
      .map((account) => {
        return {
          ...account,
          lastMsgSendAt: this.otherIdToRoom.has(account.id)
            ? this.otherIdToRoom.get(account.id)!.lastMsg.sendAt
            : 0
        };
      })
      .sort((a, b) => {
        if (a.lastMsgSendAt > b.lastMsgSendAt) return -1;
        else if (a.lastMsgSendAt < b.lastMsgSendAt) return 1;
        return 0;
      });
  }

  @computed
  get sortedAccountListByLastMsgSendAtDesc() {
    return this.accounts
      .map((account) => {
        return {
          ...account,
          lastMsgSendAt: this.otherIdToRoom.has(account.id)
            ? this.otherIdToRoom.get(account.id)!.lastMsg.sendAt
            : 0
        };
      })
      .sort((a, b) => {
        if (a.lastMsgSendAt > b.lastMsgSendAt) return -1;
        else if (a.lastMsgSendAt < b.lastMsgSendAt) return 1;
        return 0;
      });
  }

  constructor(config: ImClientConfig, options?: WebSocketOptions) {
    this.role = config.role;
    this.socket$ = makeWebSocketObservable<string>(config.url, options);
    this.output$ = this.socket$
      .pipe(
        switchMap((get) => {
          return get(
            this.input$.pipe(
              map((packet) => {
                // @ts-ignore
                packet.command = Command[packet.command];
                return JSON.stringify(packet) as WebSocketPayload;
              })
            )
          );
        })
      )
      .pipe(
        map((raw) => {
          let packet: any;
          try {
            packet = JSON.parse(raw);
          } catch (e) {
            packet = eval(`(${raw})`);
          }
          packet.command = Command[packet.command];
          return packet as ImPacket;
        })
      )
      .pipe(map((v) => ob(v)))
      // Maybe not good enough?
      // .pipe(
      //   retryWhen((errors) =>
      //     errors
      //       .pipe(
      //         map((error) => {
      //           console.warn('emit error, retry when delay 500: ', error);
      //           return error;
      //         })
      //       )
      //       .pipe(delay(500))
      //   )
      // )
      .pipe(share());

    const _subscribe = this.output$.subscribe;
    this.output$.subscribe = (...args: any[]) => {
      const sup = _subscribe.bind(this.output$)(...args);
      this.subscriptions.push(sup);
      return sup;
    };

    ImClient.observableship(this.accounts);
    ImClient.observableship(this.waiters);
    ImClient.observableship(this.rooms);
  }

  startPromise?: Promise<void>;

  async start() {
    this.startPromise = (async () => {
      this.output$.subscribe(
        (message) => {},
        (error: Error) => {
          const { message } = error;
          if (message === normalClosureMessage) {
            console.log('server closed the websocket connection normally');
          } else {
            console.log('No normal error, reconnect after 500ms. ');
            if (!__DEV__) {
              this.stop();
              setTimeout(() => this.start(), 500);
            }
          }
        },
        () => {
          console.log('the connection was closed in response to the user');
        }
      );
      this.onHeartbeat();
      this.onCall();
      this.onRemindPush();
      this.onOnlineOfflinePush();

      await this.fetchMyAccountBaseInfo();
      await this.fetchJoinedRoomList();
      if (this.role === 'customer') {
        await this.fetchWaiters();
      }
    })();
    await this.startPromise;
  }

  async stop() {
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }

  fork<Payload extends IPayload = IPayload>(
    ...commands: Command[]
  ): Observable<ImPacket<Payload>> {
    return this.output$.pipe(
      filter((packet) => commands.findIndex((c) => c === packet.command) !== -1)
    ) as Observable<ImPacket<Payload>>;
  }

  send<Payload = IPayload>(packet: ImPacket<Payload>) {
    this.input$.next(packet);
  }

  sendChatMsg(to: string, type: 1 | 2, content: string) {
    this.send<IChatReqPayload>({
      command: Command.COMMAND_CHAT_REQ,
      payload: {
        to,
        type,
        content
      }
    });
  }

  private callPromiseMap = new Map<string, (value?: any) => void>();

  async call(action: string, payload: object = {}, timeout?: number) {
    const id = '' + Math.random() + '' + Date.now();
    this.send({
      command: Command.COMMAND_CALL_REQ,
      payload: {
        id,
        action,
        payload: JSON.stringify(payload)
      }
    });
    return new Promise<any>((resolve, reject) => {
      this.callPromiseMap.set(id, resolve);
      timeout &&
        setTimeout(() => {
          reject('timeout');
        }, timeout);
    });
  }

  private onCall() {
    const call$ = this.fork<ICallRespPayload>(Command.COMMAND_CALL_RESP);
    const subscription = call$.subscribe(
      (packet) => {
        const resolve = this.callPromiseMap.get(packet.payload.id);
        if (resolve) {
          resolve(ob(JSON.parse(packet.payload.ret)));
          this.callPromiseMap.delete(packet.payload.id);
        }
      },
      (err) => {
        console.error(err);
        subscription.unsubscribe();
      },
      () => {
        subscription.unsubscribe();
      }
    );
  }

  private onHeartbeat() {
    const subscription = interval(ImClient.HEARTBEAT_RHYTHM).subscribe(() => {
      this.send({
        command: Command.COMMAND_HEARTBEAT_REQ,
        payload: {}
      });
    });
    this.fork(Command.COMMAND_HEARTBEAT_RESP).subscribe(
      () => {},
      (err) => {
        subscription.unsubscribe();
      },
      () => {
        subscription.unsubscribe();
      }
    );
  }

  private onRemindPush() {
    this.fork(Command.COMMAND_REMIND_PUSH)
      .pipe(map((packet) => packet.payload as IRemindPushPayload))
      .subscribe(
        flow(
          function*(
            this: ImClient,
            payload: IRemindPushPayload
          ): IterableIterator<any> {
            // when a remind has pushed,
            // 1. fetch room info if not exists in local
            let room = this.roomKeyToRoom.get(payload.roomKey)!;
            if (!room) {
              room = yield this.fetchRoomInfo(
                1,
                this._me!.id === payload.from ? payload.to : payload.from
              );
            }
            // 2. add remind count for room
            if (this._me!.id !== payload.from) {
              if (!room.remindCount) {
                room.remindCount = 0;
              }
              room.remindCount++;
            }
            // 3. set last msg for room
            room.lastMsg = payload;
            // 4. fetch sender info if not exists in local
            let sender = this.idToAccount.get(payload.from)!;
            if (!sender && this.me!.id !== payload.from) {
              sender = yield this.fetchAccountBaseInfo(payload.from);
              this.subscribeOnlineNotify([ sender.id ]);
            }
            // 5. append msg from this remind to msg list
            if (!this.roomKeyToMessageList.has(room.roomKey)) {
              this.roomKeyToMessageList.set(room.roomKey, ob([]));
            }
            const msgList = this.roomKeyToMessageList.get(room.roomKey)!;
            msgList.push(payload);

            this.bus.emit('remind', payload);
          }.bind(this)
        )
      );
  }

  private onOnlineOfflinePush() {
    this.fork<IOnlineOfflinePushPayload>(
      Command.COMMAND_ONLINE_PUSH,
      Command.COMMAND_OFFLINE_PUSH
    ).subscribe(
      flow(
        function*(
          this: ImClient,
          packet: ImPacket<IOnlineOfflinePushPayload>
        ): IterableIterator<any> {
          let isOnlineOld = false;

          if (this.role === 'customer') {
            let i = this.waiters.findIndex((a) => a.id === packet.payload.id);
            if (i !== -1) {
              isOnlineOld = !!this.waiters[i].isOnline;
              set(
                this.waiters[i],
                'isOnline',
                packet.command === Command.COMMAND_ONLINE_PUSH
              ); 
            } else {
              this.waiters.push({
                ...packet.payload,
                isOnline: packet.command === Command.COMMAND_ONLINE_PUSH
              });
            }
          } else {
            let i = this.accounts.findIndex((a) => a.id === packet.payload.id);
            if (i !== -1) {
              isOnlineOld = !!this.accounts[i].isOnline;
              set(
                this.accounts[i],
                'isOnline',
                packet.command === Command.COMMAND_ONLINE_PUSH
              ); 
            } else {
              this.accounts.push({
                ...packet.payload,
                isOnline: packet.command === Command.COMMAND_ONLINE_PUSH
              });
            }
          }
          if (packet.command === Command.COMMAND_ONLINE_PUSH) {
            !isOnlineOld && this.bus.emit('online', packet.payload);
          } else {
            isOnlineOld && this.bus.emit('offline', packet.payload);
          }
        }.bind(this)
      )
    );
  }

  async fetchRoomInfo(type: 1 /* 一对一 */ | 2 /* 群聊 */, to: string) {
    const roomInfo: RoomInfo = await this.call('fetchRoomInfo', {
      type,
      to
    });
    this.rooms.push(roomInfo);
    return roomInfo;
  }

  async fetchMyAccountBaseInfo() {
    const account: AccountBaseInfo = await this.call('fetchMyAccountBaseInfo');
    this._me = account;
    return account;
  }

  async fetchAccountBaseInfo(id: string) {
    const ret = await this.call('fetchAccountBaseInfo', { id });
    if (ret && ret.state === 'ok') { 
      const account = ret.account as AccountBaseInfo;
      const i = this.accounts.findIndex((acc) => acc.id === account.id);
      if (i !== -1) {
        this.accounts[i] = account;
      } else {
        this.accounts.push(account);
      }
      return account;
    } else {
      throw 'account not exists';
    }
  }

  async fetchJoinedRoomList() {
    const ret = await this.call('fetchJoinedRoomList');
    const roomList = (ret.roomList as RoomInfo[]).filter(
      (room) => room.members && room.members.length > 0
    );
    await flow(
      function*(this: ImClient): IterableIterator<any> {
        patchToModelArray(roomList, this.rooms, (v) => v.roomKey);
        const allIdList = uniq(
          flatMap(
            roomList.map((room) =>
              room.members.filter((member) => member !== this.me!.id)
            )
          )
        );
        yield this.fetchAccountListBaseInfo(allIdList);
        this.subscribeOnlineNotify(allIdList);
      }.bind(this)
    )();
    return roomList;
  }

  async fetchAccountListBaseInfo(idList: string[]) {
    const ret = await this.call('fetchAccountListBaseInfo', { idList });
    const list = (ret.accountList as AccountBaseInfo[]) || []; 
    runInAction(() => {
      patchToModelArray(list, this.accounts);
    });
    return list;
  }

  subscribeOnlineNotify(who: string[]) {
    this.send<IOnlineNotifySubscribeReqPayload>({
      command: Command.COMMAND_ONLINE_NOTIFY_SUBSCRIBE_REQ,
      payload: {
        who
      }
    });
  }

  // return true -> has more; false -> not more
  async nextMessagePage(roomKey: string): Promise<boolean> {
    const lastPage = this.roomKeyToLastMsgPage.get(roomKey);
    let pageNumber = 1;
    if (lastPage) {
      if (lastPage.lastPage) return false;
      pageNumber = lastPage.pageNumber + 1;
    }
    const page: Page<
      IMessageDetailModel
    > = (await this.call('fetchMessagePage', {
      roomKey,
      pageNumber,
      pageSize: 10
    })).page;
    runInAction(() => {
      this.roomKeyToLastMsgPage.set(roomKey, page);
      if (!this.roomKeyToMessageList.has(roomKey)) {
        this.roomKeyToMessageList.set(roomKey, []);
      }
      const list = this.roomKeyToMessageList.get(roomKey)!;
      differenceWith(
        page.list,
        list,
        (x, y) => x.msgKey === y.msgKey
      ).forEach((msg) => {
        list.unshift(msg);
      });
    });
    if (page.lastPage) return false;
    return true;
  }

  async fetchWaiters() {
    const ret = await this.call('fetchWaiters');
    const waiterList = (ret.waiterList as (AccountBaseInfo)[]) || []; 
    this.waiters.splice(0, this.waiters.length, ...waiterList);
    this.subscribeOnlineNotify(waiterList.map((x) => x.id));
    return waiterList;
  }

  clearRemind(roomKey: string) {
    this.send<IClearRemindReqPayload>({
      command: Command.COMMAND_CLEAR_REMIND_REQ,
      payload: {
        roomKey
      }
    });
    const room = this.roomKeyToRoom.get(roomKey);
    if (room) {
      room.remindCount = 0;
    }
  }

  private static observableship<T>(arr: T[]) {
    const _push = arr.push;
    (arr as any).push = function(...args: T[]) {
      return _push.bind(arr)(...observableArgs<T>(args));
    }.bind(arr);
    const _unshift = arr.unshift;
    (arr as any).unshift = function(...args: T[]) {
      return _unshift.bind(arr)(...observableArgs<T>(args));
    }.bind(arr);
  }
}

export interface AccountBaseInfo {
  id: string;
  nickName: string;
  avatar: string;
  isOnline: boolean;
}

export interface RoomInfo extends IRoomInfoModel {
  members: string[];
  remindCount: number;
  lastMsg: IMessageDetailModel;
}

export interface Page<Model = any> {
  totalRow: number;
  pageNumber: number;
  firstPage: boolean;
  lastPage: boolean;
  totalPage: number;
  pageSize: number;
  list: Model[];
}

function observableArgs<T>(args: T[]) {
  return args.map((arg) => {
    if (typeof arg === 'object') {
      if (isObservable(arg)) {
        for (let key in arg) {
          if (!isObservableProp(arg, key)) {
            set(
              arg,
              key,
              typeof arg[key] === 'object' ? ob(arg[key]) : arg[key]
            );
          }
        }
      } else {
        arg = ob(arg);
      }
    }
    return arg;
  });
}
