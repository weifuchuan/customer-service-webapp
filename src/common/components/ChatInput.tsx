import React, { useRef, useState, useCallback, lazy, Suspense } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import 'emoji-mart/css/emoji-mart.css';
import { EmojiData, BaseEmoji } from 'emoji-mart';
import {
  IconButton,
  PrimaryButton,
  DefaultButton,
  IButtonProps
} from 'office-ui-fabric-react/lib/Button';
import { TextField, ITextField } from 'office-ui-fabric-react/lib/TextField';
import { Callout } from 'office-ui-fabric-react/lib/Callout';
import useObject from '@/common/hooks/useObject';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import { loadTheme } from '@uifabric/styling';

const Picker = lazy(() =>
  import('emoji-mart').then((mod) => ({ default: mod.Picker }))
);

function ChatInput({
  onSend,
  onClickImageBtn
}: {
  onSend: (content: string) => Promise<boolean>;
  onClickImageBtn?: () => void;
}) {
  const [ state, setState ] = useState({
    openEmojiPicker: false,
    content: '',
    sendText: '发送(Enter)' as '发送(Enter)' | '发送(Ctrl+Enter)'
  });

  const sendMode = useObject({
    mode: 'enter' as 'enter' | 'ctrlEnter'
  });

  const usedEmojiMap = useObject(new Map<string, string>());

  const emojiRef = useRef<HTMLDivElement>(null);
  // const contentEditorRef = useRef<ITextField>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const addEmoji = useCallback(
    (emoji: EmojiData) => {
      usedEmojiMap.set((emoji as BaseEmoji).native, emoji.colons!);
      const start = inputRef.current!.selectionStart || 0;
      const end = inputRef.current!.selectionEnd || 0;
      let content = inputRef.current!.value || '';
      content =
        content.substring(0, start) +
        (emoji as BaseEmoji).native +
        content.substring(end);
      setState({ ...state, openEmojiPicker: false, content });
      inputRef.current!.focus();
    },
    [ state, setState ]
  );

  const send = async () => {
    let content = inputRef.current!.value;
    if (content && content.trim()) {
      if (content) {
        usedEmojiMap.forEach((v, k) => {
          content!.replace(new RegExp(k, 'g'), v);
        });
      }
      if (
        await onSend(
          `<div>${content
            .split('\n')
            .map((line) => `<p>${line}</p>`)
            .reduce((prev, curr) => prev + curr, '')}</div>`
        )
      ) {
        setState({ ...state, content: '' });
      }
    } else {
      setState({ ...state, content: '' });
    }
  };

  const onKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      let doSend = false;
      if (event.ctrlKey) {
        if (sendMode.mode === 'ctrlEnter' && !event.shiftKey) {
          doSend = true;
        }
      } else {
        if (sendMode.mode === 'enter' && !event.shiftKey) {
          doSend = true;
        }
      }
      if (doSend) {
        send();
        event.preventDefault();
        event.stopPropagation();
      }
    }
  };

  const changeSendMode = (mode: 'enter' | 'ctrlEnter') => {
    sendMode.mode = mode;
    if (mode === 'enter') setState({ ...state, sendText: '发送(Enter)' });
    else setState({ ...state, sendText: '发送(Ctrl+Enter)' });
  };

  return (
    <_ChatInput>
      <div>
        <div ref={emojiRef}>
          <IconButton
            iconProps={{ iconName: 'Emoji2' }}
            title="表情"
            ariaLabel="表情"
            onClick={() =>
              setState({ ...state, openEmojiPicker: !state.openEmojiPicker })}
          />
        </div>
        <IconButton
          iconProps={{ iconName: 'ImageCrosshair' }}
          title="图片"
          ariaLabel="图片"
          onClick={onClickImageBtn}
        />
      </div>
      <div>
        <_TextArea
          rows={3}
          autoFocus
          value={state.content}
          onChange={(e: any) => setState({ ...state, content: e.target.value })}
          placeholder="在此输入消息…"
          ref={inputRef}
          onKeyDown={onKeyPress}
        />
      </div>
      <div>
        <DefaultButton
          primary
          text={state.sendText}
          onClick={send}
          split={true}
          menuProps={{
            items: [
              {
                key: 'enter',
                text: '发送（Enter）',
                onClick: () => {
                  changeSendMode('enter');
                }
              },
              {
                key: 'ctrl-enter',
                text: '发送（Ctrl+Enter）',
                onClick: () => {
                  changeSendMode('ctrlEnter');
                }
              }
            ]
          }}
        />
      </div>
      <Callout target={emojiRef.current} hidden={!state.openEmojiPicker}>
        <Suspense fallback={<Spinner size={SpinnerSize.xSmall} />}>
          <Picker native={true} onSelect={addEmoji} />
        </Suspense>
      </Callout>
    </_ChatInput>
  );
}

const _ChatInput = styled.div`
  /* padding: 1rem; */
  display: flex;
  flex-direction: column;

  > :nth-child(1) {
    display: flex;
    align-items: center;
  }
  > :nth-child(2) {
  }
  > :nth-child(3) {
    display: flex;
    justify-content: flex-end;
    padding: 0.5rem;
  }
`;

const _TextArea = styled.textarea`
  font-family: "Segoe UI", "Segoe UI Web (West European)", "Segoe UI",
    -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 14px;
  font-weight: 400;
  box-shadow: none;
  margin-top: 0px;
  margin-right: 0px;
  margin-bottom: 0px;
  margin-left: 0px;
  padding-top: 6px;
  padding-right: 12px;
  padding-bottom: 0px;
  padding-left: 12px;
  box-sizing: border-box;
  color: rgb(51, 51, 51);
  width: 100%;
  min-width: 0px;
  text-overflow: ellipsis;
  resize: none;
  min-height: inherit;
  line-height: 17px;
  flex-grow: 1;
  border-radius: 0px;
  border-width: initial;
  border-style: none;
  border-color: initial;
  border-image: initial;
  background: none transparent;
  outline: 0px;
  overflow: auto;
`;

export default observer(ChatInput);
