import { observable, computed } from 'mobx';
import { IRoomInfoModel, IMessageDetailModel } from './model';

export interface AccountBaseInfo {
  id: string;
  nickName: string;
  avatar: string;
  isOnline?: boolean;
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

export class Store {
  @observable me?: AccountBaseInfo;

  @observable readonly accountList: AccountBaseInfo[] = [];

  @computed
  get idToAccount() {
    return this.accountList.reduce((map, account) => {
      map.set(account.id, account);
      return map;
    }, new Map<string, AccountBaseInfo>());
  }

  @observable readonly waiterList: AccountBaseInfo[] = [];

  @observable readonly roomInfoList: RoomInfo[] = [];

  @observable
  readonly roomKeyToMessageList: Map<string, IMessageDetailModel[]> = new Map();

  @computed
  get roomKeyToRoomInfo() {
    return this.roomInfoList.reduce((map, room) => {
      map.set(room.roomKey, room);
      return map;
    }, new Map<string, RoomInfo>());
  }

  @observable
  readonly roomKeyToLastPage: Map<
    string,
    Page<IMessageDetailModel>
  > = new Map();

  // @observable readonly otherIdToRoomKey: Map<string, string> = new Map();

  @computed
  get otherIdToRoomKey() {
    return this.roomInfoList.reduce((map, info) => {
      if (info.type === 1 && info.members)
        info.members.filter((id) => id !== this.me!.id).forEach((id) => {
          map.set(id, info.roomKey);
        });
      return map;
    }, new Map<string, string>());
  }

  @observable readonly idToLastMsgSendAt: Map<string, number> = new Map();

  static ob<T = any>(obj: T): T {
    return observable(obj);
  }
}
