import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useMemos } from '../lib/hooks';
import { dateLabel } from '../lib/format';
import ConfirmDialog from '../components/ConfirmDialog';
import type { ContactOutletContext } from './ContactDetail';
import type { Memo } from '../types';

function MemoCard({ memo, onUpdate, onDelete }: { memo: Memo; onUpdate: (text: string) => void; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memo.text);

  function save() {
    const trimmed = draft.trim();
    if (trimmed) onUpdate(trimmed);
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-neutral-400">{dateLabel(memo.createdAt)}</span>
        <div className="flex gap-2 text-xs text-neutral-400">
          {editing ? (
            <button onClick={save} className="font-medium text-neutral-900 dark:text-neutral-100">
              저장
            </button>
          ) : (
            <button onClick={() => setEditing(true)}>수정</button>
          )}
          <button onClick={onDelete} className="text-red-500">
            삭제
          </button>
        </div>
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-neutral-300 px-2.5 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">{memo.text}</p>
      )}
    </div>
  );
}

export default function MemoView() {
  const { contact } = useOutletContext<ContactOutletContext>();
  const { memos, add, update, remove } = useMemos(contact.id);
  const [draft, setDraft] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const now = Date.now();
    add({ id: uuid(), contactId: contact.id, text: trimmed, createdAt: now, updatedAt: now });
    setDraft('');
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-b border-neutral-200 p-3.5 dark:border-neutral-800">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`${contact.name}에 대해 기억해두고 싶은 것을 적어보세요`}
          rows={3}
          className="w-full resize-none rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!draft.trim()}
          className="mt-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-30 dark:bg-neutral-100 dark:text-neutral-900"
        >
          메모 추가
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-3.5">
        {memos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-neutral-400">
            <span className="text-3xl">📝</span>
            <p className="text-sm">아직 남긴 메모가 없어요.</p>
          </div>
        ) : (
          memos.map((m) => (
            <MemoCard
              key={m.id}
              memo={m}
              onUpdate={(text) => update(m.id, { text, updatedAt: Date.now() })}
              onDelete={() => setPendingDeleteId(m.id)}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        message="이 메모를 삭제할까요?"
        onConfirm={() => {
          if (pendingDeleteId) remove(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
