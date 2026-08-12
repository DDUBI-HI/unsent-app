import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useContacts, useMemos, useMessages } from '../lib/hooks';
import ConfirmDialog from '../components/ConfirmDialog';
import { josa } from '../lib/korean';
import type { Contact } from '../types';

export interface ContactOutletContext {
  contact: Contact;
}

export default function ContactDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { items: contacts, remove: removeContact } = useContacts();
  const { removeAllForContact: removeMessages } = useMessages(id);
  const { removeAllForContact: removeMemos } = useMemos(id);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const contact = contacts.find((c) => c.id === id);

  if (!contact) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-neutral-500">대화상대를 찾을 수 없어요.</p>
        <button
          onClick={() => navigate('/')}
          className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          목록으로
        </button>
      </div>
    );
  }

  function handleDeleteConfirmed() {
    if (!contact) return;
    removeMessages();
    removeMemos();
    removeContact(contact.id);
    navigate('/');
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xl text-neutral-500"
            aria-label="뒤로가기"
          >
            ←
          </button>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: contact.color + '33' }}
          >
            {contact.emoji}
          </div>
          <span className="flex-1 truncate font-medium text-neutral-900 dark:text-neutral-100">
            {contact.name}
          </span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="px-2 text-xl text-neutral-500"
              aria-label="더보기"
            >
              ⋮
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-9 z-20 w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-red-500"
                  >
                    대화상대 삭제
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <nav className="flex px-4">
          <NavLink
            to={`/c/${id}`}
            end
            className={({ isActive }) =>
              `flex-1 border-b-2 py-2 text-center text-sm font-medium ${
                isActive
                  ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                  : 'border-transparent text-neutral-400'
              }`
            }
          >
            채팅
          </NavLink>
          <NavLink
            to={`/c/${id}/memo`}
            className={({ isActive }) =>
              `flex-1 border-b-2 py-2 text-center text-sm font-medium ${
                isActive
                  ? 'border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100'
                  : 'border-transparent text-neutral-400'
              }`
            }
          >
            메모
          </NavLink>
        </nav>
      </header>

      <Outlet context={{ contact } satisfies ContactOutletContext} />

      <ConfirmDialog
        open={confirmOpen}
        message={`${contact.name}${josa(contact.name, '과', '와')}의 모든 대화와 메모를 삭제할까요?\n되돌릴 수 없어요.`}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
