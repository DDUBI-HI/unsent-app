import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useMessages } from '../lib/hooks';
import { dateLabel, timeShort } from '../lib/format';
import type { ContactOutletContext } from './ContactDetail';
import type { Message } from '../types';

function groupByDay(messages: Message[]) {
  const groups: { day: string; items: Message[] }[] = [];
  for (const m of messages) {
    const day = new Date(m.createdAt).toDateString();
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.day === day) {
      lastGroup.items.push(m);
    } else {
      groups.push({ day, items: [m] });
    }
  }
  return groups;
}

export default function ChatView() {
  const { contact } = useOutletContext<ContactOutletContext>();
  const { messages, add } = useMessages(contact.id);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    add({
      id: uuid(),
      contactId: contact.id,
      text: trimmed,
      sender: 'me',
      createdAt: Date.now(),
    });
    setText('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const groups = groupByDay(messages);

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-neutral-100 dark:bg-neutral-950">
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center text-neutral-400">
            <span className="text-3xl">💬</span>
            <p className="text-sm">
              {contact.name}에게 하고 싶었던 말을 적어보세요.
              <br />
              답장은 오지 않지만, 여기 남아있어요.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.day}>
              <div className="my-3 flex justify-center">
                <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                  {dateLabel(group.items[0].createdAt).split(' ')[0]}
                </span>
              </div>
              {group.items.map((m) => (
                <div key={m.id} className="mb-2 flex items-end justify-end gap-1.5">
                  <span className="shrink-0 text-[11px] text-neutral-400">{timeShort(m.createdAt)}</span>
                  <div className="max-w-[75%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-yellow-300 px-3.5 py-2 text-sm text-neutral-900 dark:bg-yellow-400">
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지 보내기"
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-2xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="shrink-0 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-30 dark:bg-neutral-100 dark:text-neutral-900"
        >
          전송
        </button>
      </div>
    </div>
  );
}
