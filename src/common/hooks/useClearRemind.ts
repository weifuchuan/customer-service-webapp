import { AccountBaseInfo, ImClient } from '../im';
import { useEffect } from 'react';

export default function useClearRemind(
  store: { currentContact?: AccountBaseInfo },
  imClient: ImClient
) {
  useEffect(
    () => {
      (async () => {
        if (store.currentContact) {
          let room = imClient.otherIdToRoom.get(store.currentContact.id);
          if (!room) {
            room = await imClient.fetchRoomInfo(1, store.currentContact!.id);
          }
          imClient.clearRemind(room.roomKey);
        }
      })();
    },
    [ store.currentContact, imClient ]
  );
}
