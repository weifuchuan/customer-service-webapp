import { ImPacket, ImPacketCoder } from './ImPacket';
import {
  webSocket,
  WebSocketSubjectConfig,
  WebSocketSubject
} from 'rxjs/webSocket';
import { WebSocketMessage } from 'rxjs/internal/observable/dom/WebSocketSubject';
import { Command } from './enums';
import { Observable } from 'rxjs/internal/Observable';
import { filter } from 'rxjs/internal/operators/filter';
import { map } from 'rxjs/internal/operators/map';
import {
  IPayload,
  ICallRespPayload,
  ICallReqPayload,
  IChatReqPayload,
  IRemindPushPayload,
  IOnlineNotifySubscribeReqPayload,
  IOnlineOfflinePushPayload,
  IClearRemindReqPayload
} from './payload-model';
import { interval } from 'rxjs/internal/observable/interval';
import { Store, AccountBaseInfo, RoomInfo, Page } from './store';
import { IRoomInfoModel, IMessageDetailModel } from './model';
import { sleep, IRet } from './kit';
import patchToModelArray from '@/common/kit/functions/patchToModelArray';
import clearAndSet from '@/common/kit/functions/clearAndSet';
import EventEmitter from 'wolfy87-eventemitter';
import uniqWith from 'lodash/uniqWith';
import flatMap from 'lodash/flatMap';
import uniq from 'lodash/uniq';
import { toJS, runInAction, action, observable } from 'mobx';
import debounce from 'lodash/debounce';
import differenceWith from 'lodash/differenceWith';

const md5 = require('js-md5');

export class Im {
  private static readonly HEARTBEAT_RHYTHM = 3000; // ms

  private readonly _ws: WebSocketSubject<ImPacket>;
  get ws() {
    return this._ws;
  }

  private config: WebSocketSubjectConfig<ImPacket<IPayload>>;

  public readonly store: Store = new Store();

  public readonly bus: EventEmitter = new EventEmitter();

  public readonly role: 'customer' | 'waiter';

  private _connected = false;
  private _connectError: any;

  get connected() {
    return this._connected;
  }

  get connnectError() {
    return this._connectError;
  }

  constructor(
    url: string,
    role: 'customer' | 'waiter',
    config?: Partial<WebSocketSubjectConfig<ImPacket>>
  ) {
    this.role = role;
    const serializer: (packet: ImPacket) => WebSocketMessage = (packet) => {
      return ImPacketCoder.encodeToString(packet);
    };
    const deserializer: (raw: any) => ImPacket = (raw) => {
      return observable(
        typeof raw === 'string'
          ? ImPacketCoder.decodeFromStringForTio(raw)
          : ImPacketCoder.decodeForTio(raw)
      );
    };
    let _deserializer: ((e: MessageEvent) => ImPacket) | undefined;
    if (deserializer) {
      _deserializer = (e) => {
        return deserializer(e.data);
      };
    }
    const _config = buildConfig<ImPacket>(url, {
      serializer,
      deserializer: _deserializer,
      ...config
    });
    this._ws = webSocket(_config);
    this.config = _config;
    this.start();
  }

  private async start() {
    this._ws.subscribe(
      () => {},
      (err) => {
        this.bus.emit('error', err);
        console.error(err);
        this._connected = false;
        this._connectError = err || 'error';
      },
      () => {}
    );
    this.onCall();
    this.onHeartbeat();
    this.onRemindPush();
    this.onOnlineOfflinePush();

    await this.fetchMyAccountBaseInfo();
    await this.fetchJoinedRoomList();
    
    this._connected = true;
  }

  stop() {
    this._ws.complete();
  }

  send<Payload extends IPayload = IPayload>(packet: ImPacket<Payload>) {
    this._ws.next(packet);
  }

  fork<Payload extends IPayload = IPayload>(
    ...commands: Command[]
  ): Observable<ImPacket<Payload>> {
    return this._ws.pipe(
      filter((packet) => commands.findIndex((c) => c === packet.command) !== -1)
    ) as Observable<ImPacket<Payload>>;
  }

  private callPromiseMap = new Map<string, (value?: any) => void>();

  call(action: string, payload: object = {}, timeout?: number): Promise<any> {
    const id = md5('' + Math.random() + Date.now + new Date().toString());
    this.send<ICallReqPayload>({
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
          resolve(Store.ob(JSON.parse(packet.payload.ret)));
          this.callPromiseMap.delete(packet.payload.id);
        }
      },
      (err) => {
        subscription.unsubscribe();
      },
      () => {
        subscription.unsubscribe();
      }
    );
  }

  private onHeartbeat() {
    const subscription = interval(Im.HEARTBEAT_RHYTHM).subscribe(() => {
      this.send({
        command: Command.COMMAND_HEARTBEAT_REQ,
        payload: {}
      });
    });
    this.fork(Command.COMMAND_HEARTBEAT_RESP).subscribe(
      (packet) => {},
      (err) => {
        subscription.unsubscribe();
        throw err;
      },
      () => {
        subscription.unsubscribe();
      }
    );
  }

  private onRemindPush() {
    this.fork(Command.COMMAND_REMIND_PUSH)
      .pipe(map((packet) => packet.payload as IRemindPushPayload))
      .pipe(map(Store.ob))
      .subscribe(async (payload: IRemindPushPayload) => {
        // if not has room info 
        if (!this.store.roomKeyToRoomInfo.has(payload.roomKey)) {
          const room = await this.fetchRoomInfo(1, payload.to);
          runInAction(() => {
            this.store.otherIdToRoomKey.set(payload.to, room.roomKey);
            this.store.roomKeyToRoomInfo.set(room.roomKey, room);
          });
        }
        runInAction(async () => {
          const room = this.store.roomKeyToRoomInfo.get(payload.roomKey)!;
          room.remindCount++;
          if (!this.store.roomKeyToMessageList.has(payload.roomKey)) {
            this.store.roomKeyToMessageList.set(payload.roomKey, Store.ob([]));
          }
          const list = this.store.roomKeyToMessageList.get(payload.roomKey)!;
          if (
            !this.store.idToAccount.has(payload.from) &&
            this.store.me!.id !== payload.from
          ) {
            await this.fetchAccountBaseInfo(payload.from);
          }
          if (list.findIndex((item) => item.msgKey === payload.msgKey) === -1) {
            list.push(payload);
            this.store.idToLastMsgSendAt.set(payload.to, payload.sendAt);
          }
          this.bus.emit('remind', payload);
        });
      });
  }

  private onOnlineOfflinePush() {
    this.fork<IOnlineOfflinePushPayload>(
      Command.COMMAND_ONLINE_PUSH,
      Command.COMMAND_OFFLINE_PUSH
    )
      .pipe(map(Store.ob))
      .subscribe(
        action((packet: ImPacket<IOnlineOfflinePushPayload>) => {
          let isOnlineOld = false;

          if (this.role === 'customer') {
            let i = this.store.waiterList.findIndex(
              (a) => a.id === packet.payload.id
            );
            if (i !== -1) {
              isOnlineOld = !!this.store.waiterList[i].isOnline;
              this.store.waiterList[i].isOnline =
                packet.command === Command.COMMAND_ONLINE_PUSH;
            } else {
              this.store.waiterList.push({
                ...packet.payload,
                isOnline: packet.command === Command.COMMAND_ONLINE_PUSH
              });
            }
          } else {
            let i = this.store.accountList.findIndex(
              (a) => a.id === packet.payload.id
            );
            if (i !== -1) {
              isOnlineOld = !!this.store.accountList[i].isOnline;
              this.store.accountList[i].isOnline =
                packet.command === Command.COMMAND_ONLINE_PUSH;
            } else {
              this.store.accountList.push({
                ...packet.payload,
                isOnline: packet.command === Command.COMMAND_ONLINE_PUSH
              });
            }
          }
          if (packet.command === Command.COMMAND_ONLINE_PUSH) {
            !isOnlineOld && this.emitOnline(packet);
          } else {
            isOnlineOld && this.emitOffline(packet);
          }
        })
      );
  }

  private emitOnline = debounce(
    (packet: ImPacket<IOnlineOfflinePushPayload>) => {
      this.bus.emit('online', packet.payload);
    },
    100
  );

  private emitOffline = debounce(
    (packet: ImPacket<IOnlineOfflinePushPayload>) => {
      this.bus.emit('offline', packet.payload);
    },
    100
  );

  async fetchJoinedRoomList() {
    const ret = await this.call('fetchJoinedRoomList');
    const roomList = Store.ob(
      (ret.roomList as RoomInfo[]).filter(
        (room) => room.members && room.members.length > 0
      )
    );
    runInAction(async () => {
      patchToModelArray(roomList, this.store.roomInfoList, (v) => v.roomKey);

      roomList.forEach((room) => {
        const otherId = room.members.filter((x) => x !== this.store.me!.id)[0];
        if (room.type === 1)
          this.store.otherIdToRoomKey.set(otherId, room.roomKey);

        this.store.idToLastMsgSendAt.set(
          otherId,
          room.lastMsg && room.lastMsg.sendAt ? room.lastMsg.sendAt : 0
        );
      });

      const temp1 = roomList.map((room) =>
        room.members.filter((member) => member !== this.store.me!.id)
      );
      const temp2 = flatMap(temp1);
      const allIdList = uniq(temp2);
      const accounts = await this.fetchAccountListBaseInfo(allIdList);
      this.subscribeOnlineNotify(accounts.map((account) => account.id));
    });

    return roomList;
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

  async fetchRoomInfo(type: 1 /* 一对一 */ | 2 /* 群聊 */, to: string) {
    const roomInfo: RoomInfo = await this.call('fetchRoomInfo', {
      type,
      to
    });
    runInAction(() => {
      if (roomInfo.roomKey) {
        this.store.otherIdToRoomKey.set(to, roomInfo.roomKey);
        const i = this.store.roomInfoList.findIndex(
          (ri) => ri.roomKey === roomInfo.roomKey
        );
        if (i !== -1) {
          this.store.roomInfoList[i] = roomInfo;
        } else {
          this.store.roomInfoList.push(roomInfo);
        }
      }
    });
    return roomInfo;
  }

  async fetchMyAccountBaseInfo() {
    const account: AccountBaseInfo = await this.call('fetchMyAccountBaseInfo');
    this.store.me = account;
    return account;
  }

  async fetchAccountBaseInfo(id: string) {
    const ret: IRet = await this.call('fetchAccountBaseInfo', { id });
    if (ret && ret.state === 'ok') {
      const account = Store.ob(ret.account as AccountBaseInfo);
      const i = this.store.accountList.findIndex(
        (acc) => acc.id === account.id
      );
      if (i !== -1) {
        this.store.accountList[i] = account;
      } else {
        this.store.accountList.push(account);
      }
      return account;
    } else {
      throw 'account not exists';
    }
  }

  private async fetchWaiters() {
    const ret = await this.call('fetchWaiters');
    const waiterList = ret.waiterList as (AccountBaseInfo)[];
    runInAction(() => {
      clearAndSet(this.store.waiterList, ...waiterList);
      this.subscribeOnlineNotify(waiterList.map((x) => x.id));
    });
    return waiterList;
  }

  async fetchMessagePage(
    roomKey: string,
    pageNumber: number,
    pageSize: number
  ) {
    const ret = await this.call('fetchMessagePage', {
      roomKey,
      pageNumber,
      pageSize
    });
    const page: Page<IMessageDetailModel> = ret.page;
    runInAction(() => {
      this.store.roomKeyToLastPage.set(roomKey, page);
      if (!this.store.roomKeyToMessageList.has(roomKey)) {
        this.store.roomKeyToMessageList.set(roomKey, []);
      }
      const list = this.store.roomKeyToMessageList.get(roomKey)!;
      differenceWith(
        page.list,
        list,
        (x, y) => x.msgKey === y.msgKey
      ).forEach((msg) => {
        list.unshift(msg);
      });
    });
    return page;
  }

  // return true -> has more; false -> not more
  async nextMessagePage(roomKey: string): Promise<boolean> {
    const lastPage = this.store.roomKeyToLastPage.get(roomKey);
    let pageNumber = 1;
    if (lastPage) {
      if (lastPage.lastPage) return false;
      pageNumber = lastPage.pageNumber + 1;
    }
    const page = await this.fetchMessagePage(roomKey, pageNumber, 10);
    if (page.lastPage) return false;
    return true;
  }

  async fetchAccountListBaseInfo(idList: string[]) {
    const ret = await this.call('fetchAccountListBaseInfo', { idList });
    const list = (ret.accountList as AccountBaseInfo[]) || [];
    runInAction(() => {
      patchToModelArray(list, this.store.accountList);
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

  clearRemind(roomKey: string) {
    this.send<IClearRemindReqPayload>({
      command: Command.COMMAND_CLEAR_REMIND_REQ,
      payload: {
        roomKey
      }
    });
    const room = this.store.roomKeyToRoomInfo.get(roomKey);
    if (room) {
      room.remindCount = 0;
    }
  }
}

function buildConfig<T>(
  url: string,
  config?: Partial<WebSocketSubjectConfig<T>>
): WebSocketSubjectConfig<T> {
  return {
    url,
    resultSelector(e) {
      return e.data;
    },
    serializer(packet) {
      return JSON.stringify(packet);
    },
    deserializer(msg) {
      return JSON.parse(msg.data);
    },
    binaryType: 'blob',
    ...config
  };
}

function log(...args: any[]) {
  if (__DEV__) {
    console.log(...args.map((x) => (typeof x === 'object' ? toJS(x) : x)));
  }
}
