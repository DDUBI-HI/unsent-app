import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { useContacts } from '../lib/hooks';
import { RELATIONSHIP_META, randomColor } from '../lib/relationship';
import { db } from '../lib/storage';
import type { Memo, RelationshipType } from '../types';

export default function NewContact() {
  const navigate = useNavigate();
  const { add } = useContacts();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('breakup');
  const [bio, setBio] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    const id = uuid();
    add({
      id,
      name: trimmed,
      relationship,
      emoji: RELATIONSHIP_META[relationship].emoji,
      color: randomColor(),
      createdAt: Date.now(),
      personaMode: 'loving',
      styleNotes: '',
    });

    const trimmedBio = bio.trim();
    if (trimmedBio) {
      const now = Date.now();
      const memo: Memo = { id: uuid(), contactId: id, text: trimmedBio, createdAt: now, updatedAt: now };
      db.write(db.keys.memos, [...db.read<Memo>(db.keys.memos), memo]);
    }

    navigate(`/c/${id}`);
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xl text-neutral-500"
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">새 대화상대</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            이름 (또는 애칭)
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 민준"
            className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            어떤 사이였나요
          </label>
          <div className="flex gap-2">
            {(Object.keys(RELATIONSHIP_META) as RelationshipType[]).map((key) => {
              const meta = RELATIONSHIP_META[key];
              const active = relationship === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRelationship(key)}
                  className={`flex-1 rounded-xl border px-3 py-3 text-sm ${
                    active
                      ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                      : 'border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
                  }`}
                >
                  <div className="text-lg">{meta.emoji}</div>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            짧은 메모 (선택)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="이 사람에 대해 기억해두고 싶은 것"
            rows={3}
            className="w-full resize-none rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <button
          type="submit"
          disabled={!name.trim()}
          className="mt-auto rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
        >
          시작하기
        </button>
      </form>
    </div>
  );
}
