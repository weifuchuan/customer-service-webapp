import React, { useRef, useState, useCallback, lazy, Suspense } from 'react';
import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import 'emoji-mart/css/emoji-mart.css';
import { EmojiData, BaseEmoji } from 'emoji-mart';
import { IconButton, PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { TextField, ITextField } from 'office-ui-fabric-react/lib/TextField';
import { Callout } from 'office-ui-fabric-react/lib/Callout'; 
import useObject from '@/common/hooks/useObject';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

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
    content: ''
  });

  const usedEmojiMap = useObject(new Map<string, string>());

  const emojiRef = useRef<HTMLDivElement>(null);
  const contentEditorRef = useRef<ITextField>(null);

  const addEmoji = useCallback(
    (emoji: EmojiData) => {
      usedEmojiMap.set((emoji as BaseEmoji).native, emoji.colons!);
      const start = contentEditorRef.current!.selectionStart || 0;
      const end = contentEditorRef.current!.selectionEnd || 0;
      let content = contentEditorRef.current!.value || '';
      content =
        content.substring(0, start) +
        (emoji as BaseEmoji).native +
        content.substring(end);
      setState({ ...state, openEmojiPicker: false, content });
      contentEditorRef.current!.focus()
    },
    [ state, setState ]
  );

  const send = useCallback(
    async () => {
      let content = contentEditorRef.current!.value;
      if (content && content.trim()) {
        if (content) {
          usedEmojiMap.forEach((v, k) => {
            content!.replace(new RegExp(k, 'g'), v);
          });
        }
        if (await onSend(content)) {
          setState({ ...state, content: '' });
        }
      } else {
        setState({ ...state, content: '' });
      }
    },
    [ onSend ]
  );

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
        <TextField
          rows={3}
          resizable={false}
          multiline
          autoFocus
          borderless
          placeholder="在此输入消息…"
          componentRef={contentEditorRef}
          value={state.content}
          onChange={(e: any) => setState({ ...state, content: e.target.value })}
        />
      </div>
      <div>
        <PrimaryButton text="发送" onClick={send} allowDisabledFocus={true} />
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

export default observer(ChatInput);
