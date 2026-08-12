export type RelationshipType = 'breakup' | 'crush' | 'other';

export type PersonaMode = 'loving' | 'cold' | 'learned';

export interface Contact {
  id: string;
  name: string;
  relationship: RelationshipType;
  emoji: string;
  color: string;
  createdAt: number;
  personaMode: PersonaMode;
  styleNotes: string;
}

export interface Message {
  id: string;
  contactId: string;
  text: string;
  sender: 'me' | 'them';
  createdAt: number;
}

export interface Memo {
  id: string;
  contactId: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export type AiProvider = 'claude' | 'gemini' | 'shared';

export interface AppSettings {
  provider: AiProvider;
  claudeApiKey: string;
  claudeModel: string;
  geminiApiKey: string;
  geminiModel: string;
  sharedPasscode: string;
}

