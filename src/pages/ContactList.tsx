import { Link } from 'react-router-dom';
import { useContacts, useMessages } from '../lib/hooks';
import { RELATIONSHIP_META } from '../lib/relationship';
import { timeAgo } from '../lib/format';
import type { Contact } from '../types';

function Avatar({ contact }: { contact: Contact }) {
  return (
    <div
      className="flex h-13 w-13 shrink-0 items-center justify-center rounded-full text-2xl"
      style={{ backgroundColor: contact.color + '33' }}
    >
      {contact.emoji}
    </div>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  const { messages } = useMessages(contact.id);
  const last = messages[messages.length - 1];
  const meta = RELATIONSHIP_META[contact.relationship];

  return (
    <Link
      to={`/c/${contact.id}`}
      className="flex items-center gap-3 px-4 py-3 active:bg-neutral-100 dark:active:bg-neutral-800"
    >
      <Avatar contact={contact} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate font-medium text-neutral-900 dark:text-neutral-100">{contact.name}</span>
          <span className="shrink-0 text-xs text-neutral-400">{meta.label}</span>
        </div>
        <p className="truncate text-sm text-neutral-500 dark:text-neutral-400">
          {last ? last.text : '아직 보낸 말이 없어요'}
        </p>
      </div>
      {last && (
        <span className="shrink-0 text-xs text-neutral-400">{timeAgo(last.createdAt)}</span>
      )}
    </Link>
  );
}

export default function ContactList() {
  const { items: contacts } = useContacts();
  const sorted = [...contacts].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">보내지 못한 말</h1>
        <Link
          to="/new"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-lg text-white dark:bg-neutral-100 dark:text-neutral-900"
          aria-label="새 대화상대 추가"
        >
          +
        </Link>
      </header>

      {sorted.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <span className="text-4xl">🕊️</span>
          <p className="text-neutral-500 dark:text-neutral-400">
            하고 싶었던 말, 여기서 계속 이어가 보세요.
          </p>
          <Link
            to="/new"
            className="mt-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
          >
            대화상대 추가하기
          </Link>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-neutral-100 overflow-y-auto dark:divide-neutral-800">
          {sorted.map((c) => (
            <ContactRow key={c.id} contact={c} />
          ))}
        </div>
      )}
    </div>
  );
}
