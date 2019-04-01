import Avatar from '@/common/components/Avatar';
import ChatInput from '@/common/components/ChatInput';
import MessageList from '@/common/components/MessageList';
import {
  AccountBaseInfo,
  IMessageDetailModel,
  IRemindPushPayload
} from '@/common/im';
import colors from '@/common/styles/colors';
import { runInAction } from 'mobx';
import { observer, useObservable } from 'mobx-react-lite';
import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useBus, useStore, useImClient } from './store';
import useClearRemind from '@/common/hooks/useClearRemind';
import selectFiles from '@/common/kit/functions/selectFiles';
import message from '@/common/kit/message';

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

let example = [
  {
    from: '1',
    to: '1008601',
    content: `<span class="ctt">我妈来日本15天。我已经要疯了。虽然明天她就走了。但是我真的忍不住了。今天发[火焰]了。<br><br>自从她来日本后。我每天都被她逼着10点睡。早上7点起。8点多就吵着要出门玩，买东西。<br>可是他娘的，日本这儿店都他么10点。有的10点半才开门。<br>日本旅游景点有啥？<br>东京不就浅草寺，晴空树，上野公园，银座新宿...<a href="/comment/Hn7xJ06hL?ckAll=1">全文</a></span>`,
    msgKey: '1',
    sendAt: Date.now() - 1000 * 60 * 60
  },
  {
    from: '1',
    to: '1008601',
    content: `<div><a class="nk" href="https://weibo.cn/baicaiyouxuan">天天白菜优选</a><img src="https://h5.sinaimg.cn/upload/2016/05/26/319/donate_btn_s.png" alt="M"><span class="ctt">:适合有关节炎的老人<img alt="[good]" src="//h5.sinaimg.cn/m/emoticon/icon/others/h_good-55854d01bb.png" style="width:1em; height:1em;"></span> <br><br>【汤臣倍健旗下】KEYLID 健力多 R氨糖软骨素钙片 40片*3瓶 89包U（159-70券），10倍浓缩野生骨碎补，某东自营要285大洋<img alt="[doge]" src="//h5.sinaimg.cn/m/emoticon/icon/others/d_doge-d903433c82.png" style="width:1em; height:1em;"><a href="https://weibo.cn/pages/100808topic?extparam=%E6%AF%8F%E6%97%A5%E7%99%BD%E8%8F%9C%E4%BC%98%E9%80%89&amp;from=feed">#每日白菜优选#</a> <br><br>小编有话说：氨糖软骨素钙片是由氨基葡萄糖、硫酸软骨素、黑蚂蚁短肽、植物钙、红曲米为主要成分，具有修复骨关节软骨，改善关...<a href="/comment/Hn8yDrYxa?ckAll=1">全文</a>&nbsp;<br><a href="https://weibo.cn/attitude/Hn8yDrYxa/add?uid=6444281385&amp;rl=0&amp;gid=10001&amp;st=f6cd05">赞[1]</a>&nbsp;<a href="https://weibo.cn/repost/Hn8yDrYxa?uid=5876524590&amp;rl=0&amp;gid=10001">转发[0]</a>&nbsp;<a href="https://weibo.cn/comment/Hn8yDrYxa?uid=5876524590&amp;rl=0&amp;gid=10001#cmtfrm" class="cc">评论[2]</a>&nbsp;<a href="https://weibo.cn/fav/addFav/Hn8yDrYxa?rl=0&amp;st=f6cd05">收藏</a><!---->&nbsp;<span class="ct">4分钟前&nbsp;来自微博 weibo.com</span></div>`,
    msgKey: '2',
    sendAt: Date.now() - 1000 * 60 * 59.5
  },
  {
    from: '1008601',
    to: '1',
    content: `<span class="ctt">:【口蘑的话】采口蘑也有专门技术，采取迟早，对于品质好坏大有关系。菌伞要圆，纹路要深，四围草色滋绿，才是上等口蘑。最大的口蘑，在采收下来、未晒干之前，伞帽圆径有七八寸，重达一斤左右，拿来炖鸡不但鲜腴无比，对于肺病也最为滋补。我们定兴乡绅鹿莫五把这晒干的成品，行话叫‘云片’，拿来炖羊...<a href="/comment/Hn8xUfFi4?ckAll=1">全文</a></span>`,
    msgKey: '3',
    sendAt: Date.now() - 1000 * 60 * 59
  },
  {
    from: '1',
    to: '1008601',
    content: `<span class="ctt">:网图，第一台通用计算机ENIAC上，一个字节的内存有这么大 </span>`,
    msgKey: '4',
    sendAt: Date.now() - 1000 * 60 * 50
  },
  {
    from: '1008601',
    to: '1',
    content: `<span class="ctt">我妈来日本15天。我已经要疯了。虽然明天她就走了。但是我真的忍不住了。今天发[火焰]了。<br><br>自从她来日本后。我每天都被她逼着10点睡。早上7点起。8点多就吵着要出门玩，买东西。<br>可是他娘的，日本这儿店都他么10点。有的10点半才开门。<br>日本旅游景点有啥？<br>东京不就浅草寺，晴空树，上野公园，银座新宿...<a href="/comment/Hn7xJ06hL?ckAll=1">全文</a></span>`,
    msgKey: '5',
    sendAt: Date.now() - 1000 * 60 * 40
  },
  {
    from: '1',
    to: '1008601',
    content: `<div><a class="nk" href="https://weibo.cn/baicaiyouxuan">天天白菜优选</a><img src="https://h5.sinaimg.cn/upload/2016/05/26/319/donate_btn_s.png" alt="M"><span class="ctt">:适合有关节炎的老人<img alt="[good]" src="//h5.sinaimg.cn/m/emoticon/icon/others/h_good-55854d01bb.png" style="width:1em; height:1em;"></span> <br><br>【汤臣倍健旗下】KEYLID 健力多 R氨糖软骨素钙片 40片*3瓶 89包U（159-70券），10倍浓缩野生骨碎补，某东自营要285大洋<img alt="[doge]" src="//h5.sinaimg.cn/m/emoticon/icon/others/d_doge-d903433c82.png" style="width:1em; height:1em;"><a href="https://weibo.cn/pages/100808topic?extparam=%E6%AF%8F%E6%97%A5%E7%99%BD%E8%8F%9C%E4%BC%98%E9%80%89&amp;from=feed">#每日白菜优选#</a> <br><br>小编有话说：氨糖软骨素钙片是由氨基葡萄糖、硫酸软骨素、黑蚂蚁短肽、植物钙、红曲米为主要成分，具有修复骨关节软骨，改善关...<a href="/comment/Hn8yDrYxa?ckAll=1">全文</a>&nbsp;<br><a href="https://weibo.cn/attitude/Hn8yDrYxa/add?uid=6444281385&amp;rl=0&amp;gid=10001&amp;st=f6cd05">赞[1]</a>&nbsp;<a href="https://weibo.cn/repost/Hn8yDrYxa?uid=5876524590&amp;rl=0&amp;gid=10001">转发[0]</a>&nbsp;<a href="https://weibo.cn/comment/Hn8yDrYxa?uid=5876524590&amp;rl=0&amp;gid=10001#cmtfrm" class="cc">评论[2]</a>&nbsp;<a href="https://weibo.cn/fav/addFav/Hn8yDrYxa?rl=0&amp;st=f6cd05">收藏</a><!---->&nbsp;<span class="ct">4分钟前&nbsp;来自微博 weibo.com</span></div>`,
    msgKey: '6',
    sendAt: Date.now() - 1000 * 60 * 39
  },
  {
    from: '1008601',
    to: '1',
    content: `<span class="ctt">:【口蘑的话】采口蘑也有专门技术，采取迟早，对于品质好坏大有关系。菌伞要圆，纹路要深，四围草色滋绿，才是上等口蘑。最大的口蘑，在采收下来、未晒干之前，伞帽圆径有七八寸，重达一斤左右，拿来炖鸡不但鲜腴无比，对于肺病也最为滋补。我们定兴乡绅鹿莫五把这晒干的成品，行话叫‘云片’，拿来炖羊...<a href="/comment/Hn8xUfFi4?ckAll=1">全文</a></span>`,
    msgKey: '7',
    sendAt: Date.now() - 1000 * 60 * 38
  },
  {
    from: '1',
    to: '1008601',
    content: `<span class="ctt">:网图，第一台通用计算机ENIAC上，一个字节的内存有这么大 </span>`,
    msgKey: '8',
    sendAt: Date.now() - 1000 * 60 * 37.9
  },
  {
    from: '1',
    to: '1008601',
    content: `<span class="ctt">我妈来日本15天。我已经要疯了。虽然明天她就走了。但是我真的忍不住了。今天发[火焰]了。<br><br>自从她来日本后。我每天都被她逼着10点睡。早上7点起。8点多就吵着要出门玩，买东西。<br>可是他娘的，日本这儿店都他么10点。有的10点半才开门。<br>日本旅游景点有啥？<br>东京不就浅草寺，晴空树，上野公园，银座新宿...<a href="/comment/Hn7xJ06hL?ckAll=1">全文</a></span>`,
    msgKey: '9',
    sendAt: Date.now() - 1000 * 60 * 37.8
  },
  {
    from: '1',
    to: '1008601',
    content: `<div><a class="nk" href="https://weibo.cn/baicaiyouxuan">天天白菜优选</a><img src="https://h5.sinaimg.cn/upload/2016/05/26/319/donate_btn_s.png" alt="M"><span class="ctt">:适合有关节炎的老人<img alt="[good]" src="//h5.sinaimg.cn/m/emoticon/icon/others/h_good-55854d01bb.png" style="width:1em; height:1em;"></span> <br><br>【汤臣倍健旗下】KEYLID 健力多 R氨糖软骨素钙片 40片*3瓶 89包U（159-70券），10倍浓缩野生骨碎补，某东自营要285大洋<img alt="[doge]" src="//h5.sinaimg.cn/m/emoticon/icon/others/d_doge-d903433c82.png" style="width:1em; height:1em;"><a href="https://weibo.cn/pages/100808topic?extparam=%E6%AF%8F%E6%97%A5%E7%99%BD%E8%8F%9C%E4%BC%98%E9%80%89&amp;from=feed">#每日白菜优选#</a> <br><br>小编有话说：氨糖软骨素钙片是由氨基葡萄糖、硫酸软骨素、黑蚂蚁短肽、植物钙、红曲米为主要成分，具有修复骨关节软骨，改善关...<a href="/comment/Hn8yDrYxa?ckAll=1">全文</a>&nbsp;<br><a href="https://weibo.cn/attitude/Hn8yDrYxa/add?uid=6444281385&amp;rl=0&amp;gid=10001&amp;st=f6cd05">赞[1]</a>&nbsp;<a href="https://weibo.cn/repost/Hn8yDrYxa?uid=5876524590&amp;rl=0&amp;gid=10001">转发[0]</a>&nbsp;<a href="https://weibo.cn/comment/Hn8yDrYxa?uid=5876524590&amp;rl=0&amp;gid=10001#cmtfrm" class="cc">评论[2]</a>&nbsp;<a href="https://weibo.cn/fav/addFav/Hn8yDrYxa?rl=0&amp;st=f6cd05">收藏</a><!---->&nbsp;<span class="ct">4分钟前&nbsp;来自微博 weibo.com</span></div>`,
    msgKey: '10',
    sendAt: Date.now() - 1000 * 60 * 36
  },
  {
    from: '1008601',
    to: '1',
    content: `<span class="ctt">:【口蘑的话】采口蘑也有专门技术，采取迟早，对于品质好坏大有关系。菌伞要圆，纹路要深，四围草色滋绿，才是上等口蘑。最大的口蘑，在采收下来、未晒干之前，伞帽圆径有七八寸，重达一斤左右，拿来炖鸡不但鲜腴无比，对于肺病也最为滋补。我们定兴乡绅鹿莫五把这晒干的成品，行话叫‘云片’，拿来炖羊...<a href="/comment/Hn8xUfFi4?ckAll=1">全文</a></span>`,
    msgKey: '11',
    sendAt: Date.now() - 1000 * 60 * 35
  },
  {
    from: '1',
    to: '1008601',
    content: `<span class="ctt">:网图，第一台通用计算机ENIAC上，一个字节的内存有这么大 </span>`,
    msgKey: '12',
    sendAt: Date.now() - 1000 * 60 * 34
  },
  {
    from: '1008601',
    to: '1',
    content: `<span class="ctt">我妈来日本15天。我已经要疯了。虽然明天她就走了。但是我真的忍不住了。今天发[火焰]了。<br><br>自从她来日本后。我每天都被她逼着10点睡。早上7点起。8点多就吵着要出门玩，买东西。<br>可是他娘的，日本这儿店都他么10点。有的10点半才开门。<br>日本旅游景点有啥？<br>东京不就浅草寺，晴空树，上野公园，银座新宿...<a href="/comment/Hn7xJ06hL?ckAll=1">全文</a></span>`,
    msgKey: '13',
    sendAt: Date.now() - 1000 * 60 * 33
  },
  {
    from: '1',
    to: '1008601',
    content: `<div><a class="nk" href="https://weibo.cn/baicaiyouxuan">天天白菜优选</a><img src="https://h5.sinaimg.cn/upload/2016/05/26/319/donate_btn_s.png" alt="M"><span class="ctt">:适合有关节炎的老人<img alt="[good]" src="//h5.sinaimg.cn/m/emoticon/icon/others/h_good-55854d01bb.png" style="width:1em; height:1em;"></span> <br><br>【汤臣倍健旗下】KEYLID 健力多 R氨糖软骨素钙片 40片*3瓶 89包U（159-70券），10倍浓缩野生骨碎补，某东自营要285大洋<img alt="[doge]" src="//h5.sinaimg.cn/m/emoticon/icon/others/d_doge-d903433c82.png" style="width:1em; height:1em;"><a href="https://weibo.cn/pages/100808topic?extparam=%E6%AF%8F%E6%97%A5%E7%99%BD%E8%8F%9C%E4%BC%98%E9%80%89&amp;from=feed">#每日白菜优选#</a> <br><br>小编有话说：氨糖软骨素钙片是由氨基葡萄糖、硫酸软骨素、黑蚂蚁短肽、植物钙、红曲米为主要成分，具有修复骨关节软骨，改善关...<a href="/comment/Hn8yDrYxa?ckAll=1">全文</a>&nbsp;<br><a href="https://weibo.cn/attitude/Hn8yDrYxa/add?uid=6444281385&amp;rl=0&amp;gid=10001&amp;st=f6cd05">赞[1]</a>&nbsp;<a href="https://weibo.cn/repost/Hn8yDrYxa?uid=5876524590&amp;rl=0&amp;gid=10001">转发[0]</a>&nbsp;<a href="https://weibo.cn/comment/Hn8yDrYxa?uid=5876524590&amp;rl=0&amp;gid=10001#cmtfrm" class="cc">评论[2]</a>&nbsp;<a href="https://weibo.cn/fav/addFav/Hn8yDrYxa?rl=0&amp;st=f6cd05">收藏</a><!---->&nbsp;<span class="ct">4分钟前&nbsp;来自微博 weibo.com</span></div>`,
    msgKey: '14',
    sendAt: Date.now() - 1000 * 60 * 32.9
  },
  {
    from: '1008601',
    to: '1',
    content: `<span class="ctt">:【口蘑的话】采口蘑也有专门技术，采取迟早，对于品质好坏大有关系。菌伞要圆，纹路要深，四围草色滋绿，才是上等口蘑。最大的口蘑，在采收下来、未晒干之前，伞帽圆径有七八寸，重达一斤左右，拿来炖鸡不但鲜腴无比，对于肺病也最为滋补。我们定兴乡绅鹿莫五把这晒干的成品，行话叫‘云片’，拿来炖羊...<a href="/comment/Hn8xUfFi4?ckAll=1">全文</a></span>`,
    msgKey: '15',
    sendAt: Date.now() - 1000 * 60 * 32.8
  }
];
