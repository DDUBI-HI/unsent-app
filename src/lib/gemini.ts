import type { Message, PersonaMode } from '../types';
import type { ImageInput } from './claude';

export class GeminiConfigError extends Error {}

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

async function callGemini(
  apiKey: string,
  model: string,
  parts: GeminiPart[],
  systemInstruction?: string,
): Promise<string> {
  if (!apiKey.trim()) {
    throw new GeminiConfigError('Gemini API 키가 설정되어 있지 않아요.');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    const message = errBody?.error?.message ?? `HTTP ${res.status}`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.find((p: GeminiPart) => p.text)?.text;
  if (!text) {
    const finishReason = data?.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY' || finishReason === 'PROHIBITED_CONTENT') {
      throw new Error('AI가 안전 정책상 이 요청에 응답할 수 없다고 판단했어요.');
    }
  }
  return (text ?? '').trim();
}

export async function analyzeStyleFromImagesGemini(
  apiKey: string,
  model: string,
  images: ImageInput[],
): Promise<string> {
  const parts: GeminiPart[] = [
    ...images.map((img) => ({ inline_data: { mime_type: img.mediaType, data: img.data } })),
    {
      text: '이 카카오톡 대화 캡처 이미지들에서, 나(왼쪽/초록 or 노랑 말풍선)의 상대방(오른쪽이 아닌 쪽, 즉 상대방 말풍선)이 쓴 말투의 특징을 분석해줘. 어투(반말/존댓말), 자주 쓰는 말버릇이나 이모티콘, 문장을 끝맺는 방식, 성격이 드러나는 부분을 5~8개의 짧은 불릿으로 정리해줘. 설명 없이 불릿만 출력해.',
    },
  ];
  return callGemini(apiKey, model, parts);
}

const PERSONA_INSTRUCTIONS: Record<PersonaMode, string> = {
  loving:
    '당신은 다정하고 애정 넘치는 연인처럼 반응합니다. 따뜻하고 배려 깊은 말투로, 상대를 아끼는 마음이 느껴지게 답장하세요.',
  cold: '당신은 상대방에게 정을 뗄 수 있도록 일부러 무심하고 쌀쌀맞게 반응합니다. 짧고 건조하게, 관심 없는 듯한 말투로 답장하세요. 다만 욕설이나 인신공격은 하지 마세요.',
  learned:
    '아래 제공된 말투 특징을 최대한 반영해서, 그 사람이 실제로 쓸 법한 말투 그대로 답장하세요.',
};

export interface ReplyParams {
  apiKey: string;
  model: string;
  contactName: string;
  personaMode: PersonaMode;
  styleNotes: string;
  recentMessages: Message[];
  situation: string;
}

export async function generateReplyGemini(params: ReplyParams): Promise<string> {
  let system = `당신은 지금부터 '${params.contactName}'이라는 사람이 되어, 아래 대화 상대(나)가 보낸 메시지에 카카오톡으로 답장합니다.\n${PERSONA_INSTRUCTIONS[params.personaMode]}`;
  if (params.personaMode === 'learned' && params.styleNotes.trim()) {
    system += `\n\n[말투 특징]\n${params.styleNotes.trim()}`;
  }
  system +=
    '\n\n답장은 실제 카카오톡 메시지처럼 짧고 자연스럽게, 1~3문장 이내로만 작성하세요. 설명이나 따옴표 없이 메시지 본문만 출력하세요.';

  const history = params.recentMessages
    .slice(-10)
    .map((m) => `${m.sender === 'me' ? '나' : params.contactName}: ${m.text}`)
    .join('\n');

  const userText = [
    history ? `[최근 대화]\n${history}` : null,
    `[상황] ${params.situation.trim()}`,
    `위 상황에서 ${params.contactName}이 어떻게 답장할지 한 번만 작성해줘.`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return callGemini(params.apiKey, params.model, [{ text: userText }], system);
}

export function toFriendlyGeminiErrorMessage(error: unknown): string {
  if (error instanceof GeminiConfigError) return error.message;
  const status = (error as { status?: number } | undefined)?.status;
  if (status === 400 || status === 401 || status === 403) {
    return 'API 키가 올바르지 않거나 권한이 없어요. 설정에서 다시 확인해주세요.';
  }
  if (status === 429) {
    return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
  }
  if (error instanceof Error) return error.message;
  return 'AI 답장을 받아오지 못했어요.';
}
