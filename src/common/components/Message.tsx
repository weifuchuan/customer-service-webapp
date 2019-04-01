import React from 'react';
import styled from 'styled-components';
import { AccountBaseInfo, IMessageDetailModel } from '@/common/im';
import Avatar from '@/common/components/Avatar';
import colors from '@/common/styles/colors';

const Message = ({
  msg,
  from,
  account
}: {
  msg: IMessageDetailModel;
  from: 'me' | 'other';
  account: AccountBaseInfo;
}) => {
  return (
    <_Message from={from}>
      <div>
        <Avatar src={account.avatar} width={30} height={30} />
      </div>
      <Content html={msg.content} from={from} />
    </_Message>
  );
};

const _Message: any = styled.div`
  padding: 1rem;
  display: flex;
  justify-content: ${(props: any) =>
    props.from === 'me' ? 'flex' : 'flex-start'};
  flex-direction: ${(props: any) =>
    props.from === 'me' ? 'row-reverse' : 'row'};
`;

const Content = ({ html, from }: { html: string; from: 'me' | 'other' }) => {
  return (
    <_Content from={from}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </_Content>
  );
};

const _Content: any = styled.div`
  max-width: calc(100% - 50px);
  margin-top: 0;
  margin-bottom: 0;
  margin-left: ${(props: any) => (props.from === 'me' ? '50px' : '1rem')};
  margin-right: ${(props: any) => (props.from === 'me' ? '1rem' : '50px')};
  background-color: ${(props: any) =>
    props.from === 'me' ? '#d0e9ff' : '#f3f3f3'};
  border-bottom-color: ${(props: any) =>
    props.from === 'me' ? '#d0e9ff' : '#f3f3f3'};
  color: #000000;
  font-size: 1rem;
  line-height: 2rem;
  padding: 5px 12px 5px 12px;
  box-sizing: border-box;
  border-radius: 6px;
  position: relative;
  word-break: break-all;

  &::${(props: any) => (props.from === 'me' ? 'after' : 'before')} {
    content: "";
    position: absolute;
    top: 20px;
    ${(props: any) => (props.from === 'me' ? 'right' : 'left')} : -5px;
    width: 10px;
    height: 10px;
    margin-top: -10px;
    background: inherit;
    /*自动继承父元素的背景*/
    transform: rotate(45deg);
  }

  img{
    position: relative;display: block; background-color: #f3f3f3; border-radius: 4px; padding: 10px; float: left; min-width: 100px; min-height: 100px; max-width: 300px; max-height: 300px; cursor: pointer; z-index: 2;
  }
`;

export default Message;
