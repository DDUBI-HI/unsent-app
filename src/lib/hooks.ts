import { useCallback, useEffect, useState } from 'react';
import { db } from './storage';
import type { AppSettings, Contact, Memo, Message } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'claude',
  claudeApiKey: '',
  claudeModel: 'claude-opus-5',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  sharedPasscode: '',
};

function normalizeSettings(raw: AppSettings & { apiKey?: string; model?: string }): AppSettings {
  const merged = { ...DEFAULT_SETTINGS, ...raw };
  if (raw.apiKey && !raw.claudeApiKey) merged.claudeApiKey = raw.apiKey;
  if (raw.model && !raw.claudeModel) merged.claudeModel = raw.model;
  return merged;
}

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
  const result = useCollection<Contact>(db.keys.contacts);
  return {
    ...result,
    items: result.items.map((c) => ({
      ...c,
      personaMode: c.personaMode ?? 'loving',
      styleNotes: c.styleNotes ?? '',
    })),
  };
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

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() =>
    normalizeSettings(db.readObject(db.keys.settings, DEFAULT_SETTINGS)),
  );

  useEffect(() => {
    const refresh = () =>
      setSettings(normalizeSettings(db.readObject(db.keys.settings, DEFAULT_SETTINGS)));
    const onCustom = (e: Event) => {
      if ((e as CustomEvent).detail === db.keys.settings) refresh();
    };
    window.addEventListener('unsent:storage', onCustom);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('unsent:storage', onCustom);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    const next = { ...normalizeSettings(db.readObject(db.keys.settings, DEFAULT_SETTINGS)), ...patch };
    db.writeObject(db.keys.settings, next);
  }, []);

  return { settings, update };
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
