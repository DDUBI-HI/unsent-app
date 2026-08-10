import type { RelationshipType } from '../types';

export const RELATIONSHIP_META: Record<RelationshipType, { label: string; emoji: string }> = {
  breakup: { label: '이별', emoji: '💔' },
  crush: { label: '짝사랑', emoji: '🌙' },
  other: { label: '그 사람', emoji: '✉️' },
};

export const AVATAR_COLORS = [
  '#f97316',
  '#ec4899',
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
  '#eab308',
  '#ef4444',
  '#14b8a6',
];

export function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
