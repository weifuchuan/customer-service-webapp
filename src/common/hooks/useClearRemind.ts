import { AccountBaseInfo, ImClient, IRemindPushPayload } from "../im";
import { useEffect } from "react";

export default function useClearRemind(
  store: { currentContact?: AccountBaseInfo },
  imClient: ImClient
) {
  useEffect(() => {
    (async () => {
      if (store.currentContact) {
        let room = imClient.otherIdToRoom.get(store.currentContact.id);
        if (!room) {
          room = await imClient.fetchRoomInfo(1, store.currentContact!.id);
        }
        imClient.clearRemind(room.roomKey);
      }
    })();
    const f = (payload: IRemindPushPayload) => {
      if (
        store.currentContact &&
        ((store.currentContact.id === payload.to &&
          imClient.me!.id === payload.from) ||
          (store.currentContact.id === payload.from &&
            imClient.me!.id === payload.to))
      )
        imClient.clearRemind(payload.roomKey);
    };
    imClient.bus.addListener("remind", f);
    return () => {
      imClient.bus.removeListener("remind", f);
    };
  }, [store.currentContact, imClient]);
}
