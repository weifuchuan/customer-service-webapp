import Avatar from '@/common/components/Avatar';
import Scrollable from '@/common/components/Scrollable';
import { AccountBaseInfo, IOnlineOfflinePushPayload } from '@/common/im';
import message from '@/common/kit/message';
import { GetProps } from '@/common/kit/types';
import colors from '@/common/styles/colors';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import styled, { StyledComponent } from 'styled-components';
import { useBus, useIm, useStore } from './store';

const ContactList = observer(
  ({
    accountList,
    selected,
    onSelected
  }: {
    accountList: (AccountBaseInfo & { lastMsgSendAt: number })[];
    selected?: AccountBaseInfo;
    onSelected: (account: AccountBaseInfo) => void;
  }) => {
    const im = useIm();

    useEffect(() => { 

      const online = (msg: IOnlineOfflinePushPayload) => {
        message.info(`“${msg.nickName}”已上线。`, 1);
      };

      const offline = (msg: IOnlineOfflinePushPayload) => {
        message.info(`“${msg.nickName}”已下线。`, 1);
      };

      im.bus.addListener('online', online);
      im.bus.addListener('offline', offline);

      return () => {
        im.bus.removeListener('online', online);
        im.bus.removeListener('offline', offline);
      };
    }, []);

    return (
      <Scrollable height={'100%'} width={'100%'}>
        {accountList.length === 0 ? (
          <_Empty>
            <span>无</span>
          </_Empty>
        ) : null}
        {accountList
          .sort((a, b) => {
            if (a.lastMsgSendAt > b.lastMsgSendAt) return -1;
            else if (a.lastMsgSendAt < b.lastMsgSendAt) return 1;
            return 0;
          })
          .map((account) => {
            return (
              <ContactItem
                account={account}
                selected={selected && account.id === selected.id}
                key={account.id}
                onClick={() => {
                  if ((selected && account.id !== selected.id) || !selected)
                    onSelected(account);
                }}
              />
            );
          })}
      </Scrollable>
    );
  }
);

const _Empty = styled.div`
  display: flex;
  justify-content: center;
  color: ${colors.DarkGray};
  margin: 1rem;
`;

const ContactItem = observer(
  ({
    account,
    selected,
    onClick
  }: {
    account: AccountBaseInfo;
    selected?: boolean;
    onClick?: () => void;
  }) => {
    return (
      <_ContactItem selected={!!selected} onClick={onClick}>
        <Avatar
          src={account.avatar}
          width={30}
          height={30}
          offline={!account.isOnline}
        />
        <div>
          <span>{account.nickName}</span>
          <span style={{ color: colors.DarkSlateGray }}>
            {account.isOnline ? '' : '（离线）'}
          </span>
        </div>
      </_ContactItem>
    );
  }
);

const _ContactItem: StyledComponent<
  'div',
  any,
  { selected: boolean },
  never
> = styled.div`
  background-color: ${(props: GetProps<typeof _ContactItem>) =>
    props.selected ? colors.PaleTurquoise : colors.White};
  padding: 1rem;
  display: flex;
  cursor: pointer;

  > :nth-child(2) {
    margin-left: 1rem;
    flex: 1;
    font-size: 1rem;
  }

  &:hover {
    background-color: ${(props: GetProps<typeof _ContactItem>) =>
      props.selected ? colors.PaleTurquoise : colors.Azure};
  }
`;

export default ContactList;
