import React, {
  useEffect,
  useRef,
  Fragment,
  useCallback,
  useState
} from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import Scrollable from '@/common/components/Scrollable';
import { AccountBaseInfo, IMessageDetailModel } from '@/common/im';
import Scrollbars, { ScrollbarProps } from 'react-custom-scrollbars';
import Message from '@/common/components/Message';
import {
  formatDate,
  formatHourMinute,
  formatTime
} from '@/common/kit/functions/time';
import uniqWith from 'lodash/uniqWith';
import colors from '@/common/styles/colors';
import useObject from '../hooks/useObject';
import nextTick from '../kit/functions/nextTick';

const MessageList = observer(
  ({
    messageList,
    me,
    other,
    canRefresh,
    maxDistForRefresh,
    goBottomListener
  }: {
    messageList: IMessageDetailModel[];
    me: AccountBaseInfo;
    other: AccountBaseInfo;
    canRefresh?: (dist: number) => void;
    maxDistForRefresh?: number;
    goBottomListener?: {
      on(f: () => void): () => void;
    };
  }) => {
    const scrollbarsRef = useRef<Scrollbars>(null);
    const innerDivRef = useRef<HTMLDivElement>(null);

    maxDistForRefresh = maxDistForRefresh ? maxDistForRefresh : 100;

    const lastLength = useObject({
      v: 0
    });

    useEffect(
      () => {
        if (lastLength.v === 0 && messageList.length > 0)
          scrollbarsRef.current!.scrollToBottom();
        lastLength.v = messageList.length;
      },
      [ messageList.length ]
    );

    useEffect(
      () => {
        const go = () =>
          nextTick(() => scrollbarsRef.current!.scrollToBottom(), 1000 / 60);
        let close: any;
        if (goBottomListener) {
          close = goBottomListener.on(go);
        }
        return () => {
          close && close();
        };
      },
      [ goBottomListener ]
    );

    const times = uniqWith(
      messageList.map((msg, i) => [ formatTime(msg.sendAt), i, msg.sendAt ]),
      (a, b) => a[0] === b[0]
    )
      .map(
        ([ sendAt, i, at ]) =>
          (formatDate(at as number) === formatDate(at as number)
            ? [ formatHourMinute(at as number), i ]
            : [ sendAt, i ]) as [string, number]
      )
      .reduce(
        (map, [ sendAt, i ]) => ((map[i] = sendAt as string), map),
        {} as {
          [key: number]: string;
        }
      );

    const onScroll = useCallback(
      (e: React.UIEvent<any>) => {
        if (!e.target) return;
        const panel: HTMLDivElement = e.target as any;
        const topParent = panel.getBoundingClientRect().top;
        const topSub = innerDivRef.current!.getBoundingClientRect().top;
        const dist = topParent - topSub;
        if (dist < maxDistForRefresh!) {
          canRefresh && canRefresh(dist);
        }
      },
      [ maxDistForRefresh, canRefresh ]
    );

    return (
      <_MessageList>
        <Scrollable
          height={'100%'}
          width={'100%'}
          scrollbarsRef={(instance) => {
            // @ts-ignore
            scrollbarsRef.current = instance;
          }}
          onScroll={onScroll}
        >
          <div ref={innerDivRef}>
            {messageList.map((msg, i) => {
              return (
                <Fragment key={msg.msgKey}>
                  {times[i] ? (
                    <_Time>
                      <span>{times[i]}</span>{' '}
                    </_Time>
                  ) : null}
                  <Message
                    msg={msg}
                    from={msg.from === me.id ? 'me' : 'other'}
                    account={msg.from === me.id ? me : other}
                  />
                </Fragment>
              );
            })}
          </div>
        </Scrollable>
      </_MessageList>
    );
  }
);
const _MessageList = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
`;

const _Time = styled.div`
  width: 100%;
  display: flex;

  > span {
    margin-top: 1rem;
    margin-bottom: 1rem;
    margin-left: auto;
    margin-right: auto;
    font-size: 0.6rem;
    color: ${colors.DarkGray};
  }
`;

export default MessageList;
