const KEYS = {
  contacts: 'unsent:contacts',
  messages: 'unsent:messages',
  memos: 'unsent:memos',
} as const;

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('unsent:storage', { detail: key }));
}

export const db = {
  keys: KEYS,
  read,
  write,
};
