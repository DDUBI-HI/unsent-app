import Anthropic from '@anthropic-ai/sdk';
import type { Message, PersonaMode } from '../types';

export class ClaudeConfigError extends Error {}

function getClient(apiKey: string) {
  if (!apiKey.trim()) {
    throw new ClaudeConfigError('API 키가 설정되어 있지 않아요.');
  }
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

export function toFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) {
    return 'API 키가 올바르지 않아요. 설정에서 다시 확인해주세요.';
  }
  if (error instanceof Anthropic.PermissionDeniedError) {
    return '이 API 키로는 해당 모델을 사용할 수 없어요.';
  }
  if (error instanceof Anthropic.RateLimitError) {
    return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return '네트워크 연결을 확인해주세요.';
  }
  if (error instanceof Anthropic.APIError) {
    return `AI 요청 중 오류가 발생했어요. (${error.status ?? '알 수 없음'})`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'AI 답장을 받아오지 못했어요.';
}

export interface ImageInput {
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  data: string;
}

export async function analyzeStyleFromImages(
  apiKey: string,
  model: string,
  images: ImageInput[],
): Promise<string> {
  const client = getClient(apiKey);

  const response = await client.messages.create({
    model,
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: [
          ...images.map((img) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: img.mediaType, data: img.data },
          })),
          {
            type: 'text' as const,
            text: '이 카카오톡 대화 캡처 이미지들에서, 나(왼쪽/초록 or 노랑 말풍선)의 상대방(오른쪽이 아닌 쪽, 즉 상대방 말풍선)이 쓴 말투의 특징을 분석해줘. 어투(반말/존댓말), 자주 쓰는 말버릇이나 이모티콘, 문장을 끝맺는 방식, 성격이 드러나는 부분을 5~8개의 짧은 불릿으로 정리해줘. 설명 없이 불릿만 출력해.',
          },
        ],
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('AI가 이 요청을 처리할 수 없다고 응답했어요.');
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';
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

export async function generateReply(params: ReplyParams): Promise<string> {
  const client = getClient(params.apiKey);

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

  const response = await client.messages.create({
    model: params.model,
    max_tokens: 300,
    output_config: { effort: 'low' },
    system,
    messages: [{ role: 'user', content: userText }],
  });

  if (response.stop_reason === 'refusal') {
    throw new Error('AI가 이 요청을 처리할 수 없다고 응답했어요.');
  }

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';
}
