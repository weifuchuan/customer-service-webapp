import Avatar from '@/common/components/Avatar';
import ChatInput from '@/common/components/ChatInput';
import MessageList from '@/common/components/MessageList';
import useClearRemind from '@/common/hooks/useClearRemind';
import { AccountBaseInfo, IMessageDetailModel, IRemindPushPayload } from '@/common/im';
import selectFiles from '@/common/kit/functions/selectFiles';
import message from '@/common/kit/message';
import colors from '@/common/styles/colors';
import { runInAction } from 'mobx';
import { observer, useObservable } from 'mobx-react-lite';
import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useBus, useImClient, useStore } from './store';

const ChatPanel = observer(() => {
  const store = useStore();
  const bus = useBus();
  const imClient = useImClient();

  const send = useCallback(async (content: string) => {
    imClient.sendChatMsg(store.currentContact!.id, 1, content);
    return true;
  }, []);

  const roomKey = store.currentContact
    ? imClient.otherIdToRoom.has(store.currentContact.id)
      ? imClient.otherIdToRoom.get(store.currentContact.id)!.roomKey
      : undefined
    : undefined;

  const messageList: IMessageDetailModel[] =
    store.currentContact && roomKey
      ? imClient.roomKeyToMessageList.has(roomKey)
        ? imClient.roomKeyToMessageList.get(roomKey)!.slice()
        : []
      : [];

  const state = useObservable({
    hasMore: true,
    fetching: false
  });

  const getMore = useCallback(async () => {
    if (store.currentContact && !state.fetching && state.hasMore) {
      state.fetching = true;
      let room = imClient.otherIdToRoom.get(store.currentContact.id);
      if (!room) {
        room = await imClient.fetchRoomInfo(1, store.currentContact!.id);
      }
      const hasMore = await imClient.nextMessagePage(room.roomKey);
      runInAction(() => {
        state.fetching = false;
        state.hasMore = hasMore;
      });
    }
  }, []);

  useClearRemind(store, imClient);

  useEffect(
    () => {
      state.fetching = false;
      state.hasMore = true;
      getMore();
      bus.emit('changeContact');
    },
    [ store.currentContact ]
  );

  const goBottomListener = {
    on: (f: Function) => {
      const listener = (remind: IRemindPushPayload) => { 
        if (remind.roomKey === roomKey) {
          f();
        }
      };
      imClient.bus.addListener('remind', listener);

      const listener2 = () => {
        f();
      };
      bus.addListener('changeContact', listener2);
      return () => {
        bus.removeListener('changeContact', listener2);
        imClient.bus.removeListener('remind', listener);
      };
    }
  };

  const sendImage = useCallback(async () => {
    if (store.config.upload) {
      const files = await selectFiles((input) => {
        input.accept = 'image/*';
        input.multiple = false;
      });
      if (files.length > 0) {
        const url = await store.config.upload(files[0]);
        const html = `
          <div>
            <img src="${url}"/>
          </div>
        `;
        imClient.sendChatMsg(store.currentContact!.id, 1, html);
      }
    } else {
      message.error(
        'The upload image function is not implemented.\nPlease implement it and provided as config. '
      );
    }
  }, []);

  return (
    <_ChatPanel>
      <div>
        <Title />
      </div>
      <div>
        <div>
          <div>
            <MessageList
              me={imClient.me || ({} as AccountBaseInfo)}
              messageList={messageList.slice()}
              other={store.currentContact || ({} as AccountBaseInfo)}
              canRefresh={(dist) => {
                getMore();
              }}
              goBottomListener={goBottomListener}
            />
          </div>
          <div>
            <ChatInput onSend={send} onClickImageBtn={sendImage} />
          </div>
        </div>
      </div>
      {!store.currentContact ? (
        <_UnselectModal>
          <span>请选择客服</span>
        </_UnselectModal>
      ) : null}
    </_ChatPanel>
  );
});

const _ChatPanel = styled.div`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  > div:nth-child(1) {
    height: 60px;
  }
  > div:nth-child(2) {
    flex: 1;
    display: flex;
    > div:nth-child(1) {
      flex: 2;

      display: flex;
      flex-direction: column;

      > div:nth-child(1) {
        flex: 1;
      }
      > div:nth-child(2) {
        /* flex: 1; */
        border-top: solid 1px #dcdcdc;
      }
    }
  }
`;

const _UnselectModal = styled.div`
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.2);

  > span {
    font-size: 2em;
  }
`;

const Title = observer(() => {
  const store = useStore();

  const waiter = store.currentContact
    ? store.currentContact
    : {} as AccountBaseInfo;

  return (
    <_Title>
      <div>
        <Avatar src={waiter.avatar} height={40} width={40} />
      </div>
      <div>
        <span>{waiter.nickName}</span>
      </div>
    </_Title>
  );
});

const _Title = styled.div`
  display: flex;
  /* align-items: center; */
  padding: 1rem;
  background-color: ${colors.WhiteSmoke};
  border-bottom-style: solid;
  border-bottom-width: 1px;
  border-bottom-color: ${colors.Gainsboro};

  > div:nth-child(1) {
  }
  > div:nth-child(2) {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-left: 1rem;

    > span:nth-child(1) {
      font-size: 1rem;
    }
  }
`;

export default ChatPanel;
 