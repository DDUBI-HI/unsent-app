export type RelationshipType = 'breakup' | 'crush' | 'other';

export interface Contact {
  id: string;
  name: string;
  relationship: RelationshipType;
  emoji: string;
  color: string;
  createdAt: number;
}

export interface Message {
  id: string;
  contactId: string;
  text: string;
  sender: 'me';
  createdAt: number;
}

export interface Memo {
  id: string;
  contactId: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}
