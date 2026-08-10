import { useCallback, useEffect, useState } from 'react';
import { db } from './storage';
import type { Contact, Memo, Message } from '../types';

function useCollection<T extends { id: string }>(key: string) {
  const [items, setItems] = useState<T[]>(() => db.read<T>(key));

  useEffect(() => {
    const refresh = () => setItems(db.read<T>(key));
    const onCustom = (e: Event) => {
      if ((e as CustomEvent).detail === key) refresh();
    };
    window.addEventListener('unsent:storage', onCustom);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('unsent:storage', onCustom);
      window.removeEventListener('storage', refresh);
    };
  }, [key]);

  const add = useCallback(
    (item: T) => {
      const next = [...db.read<T>(key), item];
      db.write(key, next);
    },
    [key],
  );

  const update = useCallback(
    (id: string, patch: Partial<T>) => {
      const next = db.read<T>(key).map((it) => (it.id === id ? { ...it, ...patch } : it));
      db.write(key, next);
    },
    [key],
  );

  const remove = useCallback(
    (id: string) => {
      const next = db.read<T>(key).filter((it) => it.id !== id);
      db.write(key, next);
    },
    [key],
  );

  const removeWhere = useCallback(
    (predicate: (item: T) => boolean) => {
      const next = db.read<T>(key).filter((it) => !predicate(it));
      db.write(key, next);
    },
    [key],
  );

  return { items, add, update, remove, removeWhere };
}

export function useContacts() {
  return useCollection<Contact>(db.keys.contacts);
}

export function useMessages(contactId: string) {
  const { items, add, remove, removeWhere } = useCollection<Message>(db.keys.messages);
  return {
    messages: items.filter((m) => m.contactId === contactId).sort((a, b) => a.createdAt - b.createdAt),
    add,
    remove,
    removeAllForContact: () => removeWhere((m) => m.contactId === contactId),
  };
}

export function useMemos(contactId: string) {
  const { items, add, update, remove, removeWhere } = useCollection<Memo>(db.keys.memos);
  return {
    memos: items.filter((m) => m.contactId === contactId).sort((a, b) => b.createdAt - a.createdAt),
    add,
    update,
    remove,
    removeAllForContact: () => removeWhere((m) => m.contactId === contactId),
  };
}
