import { useEffect, useRef, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useMessages, useSettings } from '../lib/hooks';
import { dateLabel, timeShort } from '../lib/format';
import { generateReplyWith, hasApiKey, toFriendlyAiErrorMessage } from '../lib/ai';
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

function AiReplyModal({
  contactName,
  onClose,
  onSubmit,
}: {
  contactName: string;
  onClose: () => void;
  onSubmit: (situation: string) => void;
}) {
  const [situation, setSituation] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl dark:bg-neutral-800">
        <h3 className="mb-1 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {contactName}의 답장 요청하기
        </h3>
        <p className="mb-3 text-xs text-neutral-400">
          지금까지 상황이나 바라는 상황을 100자 이내로 적어주세요.
        </p>
        <textarea
          autoFocus
          value={situation}
          onChange={(e) => setSituation(e.target.value.slice(0, 100))}
          placeholder="예: 3일째 연락이 없었는데 내가 먼저 사과 문자를 보낸 상황"
          rows={3}
          maxLength={100}
          className="w-full resize-none rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <div className="mt-1 text-right text-xs text-neutral-400">{situation.length}/100</div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onSubmit(situation)}
            disabled={!situation.trim()}
            className="flex-1 rounded-full bg-neutral-900 py-2.5 text-sm font-medium text-white disabled:opacity-30 dark:bg-neutral-100 dark:text-neutral-900"
          >
            답장 받기
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChatView() {
  const { contact } = useOutletContext<ContactOutletContext>();
  const { messages, add } = useMessages(contact.id);
  const { settings } = useSettings();
  const [text, setText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState('');
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

  async function handleAiReply(situation: string) {
    setModalOpen(false);
    setError('');
    setRequesting(true);
    try {
      const replyText = await generateReplyWith({
        settings,
        contactName: contact.name,
        personaMode: contact.personaMode,
        styleNotes: contact.styleNotes,
        recentMessages: messages,
        situation,
      });
      if (replyText) {
        add({
          id: uuid(),
          contactId: contact.id,
          text: replyText,
          sender: 'them',
          createdAt: Date.now(),
        });
      }
    } catch (e) {
      setError(toFriendlyAiErrorMessage(settings.provider, e));
    } finally {
      setRequesting(false);
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
              {group.items.map((m) =>
                m.sender === 'me' ? (
                  <div key={m.id} className="mb-2 flex items-end justify-end gap-1.5">
                    <span className="shrink-0 text-[11px] text-neutral-400">{timeShort(m.createdAt)}</span>
                    <div className="max-w-[75%] whitespace-pre-wrap break-words rounded-2xl rounded-br-sm bg-yellow-300 px-3.5 py-2 text-sm text-neutral-900 dark:bg-yellow-400">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="mb-2 flex items-end justify-start gap-1.5">
                    <div className="max-w-[75%] whitespace-pre-wrap break-words rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm text-neutral-900 shadow-sm dark:bg-neutral-800 dark:text-neutral-100">
                      {m.text}
                    </div>
                    <span className="shrink-0 text-[11px] text-neutral-400">{timeShort(m.createdAt)}</span>
                  </div>
                ),
              )}
            </div>
          ))
        )}
        {requesting && (
          <div className="mb-2 flex items-end justify-start gap-1.5">
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-white px-3.5 py-2 text-sm text-neutral-400 shadow-sm dark:bg-neutral-800">
              답장 작성 중...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="border-t border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
          {!hasApiKey(settings) && (
            <>
              {' '}
              <Link to="/settings" className="underline">
                설정으로 이동
              </Link>
            </>
          )}
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-neutral-200 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={requesting}
          className="shrink-0 rounded-full border border-neutral-300 px-3 py-2.5 text-sm disabled:opacity-30 dark:border-neutral-700"
          title={`${contact.name}의 AI 답장 받기`}
        >
          🤖
        </button>
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

      {modalOpen && (
        <AiReplyModal
          contactName={contact.name}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAiReply}
        />
      )}
    </div>
  );
}
