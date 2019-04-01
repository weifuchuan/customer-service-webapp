import Avatar from "@/common/components/Avatar";
import Badge from "@/common/components/Badge";
import Scrollable from "@/common/components/Scrollable";
import { AccountBaseInfo, IOnlineOfflinePushPayload } from "@/common/im";
import message from "@/common/kit/message";
import { GetProps } from "@/common/kit/types";
import colors from "@/common/styles/colors";
import { autorun } from "mobx";
import { observer, useObservable } from "mobx-react-lite";
import React, { useEffect } from "react";
import styled, { StyledComponent } from "styled-components";
import { useImClient } from "./store";
import useOnlineOfflineMsg from "@/common/hooks/useOnlineOfflineMsg";

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
    const imClient = useImClient();

    useOnlineOfflineMsg(imClient);

    return (
      <Scrollable height={"100%"} width={"100%"}>
        {accountList.length === 0 ? (
          <_Empty>
            <span>无</span>
          </_Empty>
        ) : null}
        {accountList.map(account => {
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
    const imClient = useImClient();

    // const state = useObservable({
    //   remindCount: 0
    // });

    const room = imClient.otherIdToRoom.get(account.id);

    const remindCount = room
      ? imClient.roomKeyToRoom.has(room.roomKey)
        ? room.remindCount
        : 0
      : 0;

    useEffect(() => {
      if (!imClient.otherIdToRoom.has(account.id)) {
        imClient.fetchRoomInfo(1, account.id);
      }
    }, [account.id]);

    //
    // useEffect(
    //   () => {
    //     const close = autorun(async () => {
    //       if (imClient.otherIdToRoom.has(account.id)) {
    //         const roomKey = imClient.otherIdToRoom.get(account.id)!.roomKey;
    //         if (imClient.roomKeyToRoom.has(roomKey)) {
    //           state.remindCount =
    //             imClient.roomKeyToRoom.get(roomKey)!.remindCount || 0;
    //         } else {
    //           await imClient.fetchRoomInfo(1, account.id);
    //         }
    //       } else {
    //         await imClient.fetchRoomInfo(1, account.id);
    //       }
    //     });
    //
    //     return close;
    //   },
    //   [ account ]
    // );

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
            {account.isOnline ? "" : "（离线）"}
          </span>
        </div>
        {selected ? null : <Badge count={remindCount} />}
      </_ContactItem>
    );
  }
);

const _ContactItem: StyledComponent<
  "div",
  any,
  { selected: boolean },
  never
> = styled.div`
  background-color: ${(props: GetProps<typeof _ContactItem>) =>
    props.selected ? colors.PaleTurquoise : colors.White};
  padding: 1rem;
  display: flex;
  cursor: pointer;

  align-items: center;

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
