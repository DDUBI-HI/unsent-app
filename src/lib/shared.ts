import type { Message, PersonaMode } from '../types';
import type { ImageInput } from './claude';

// 워커 배포 후 여기를 실제 워커 URL로 바꿔주세요.
// 예: https://unsent-app-ai-proxy.<본인-서브도메인>.workers.dev
export const WORKER_URL = 'https://unsent-app-ai-proxy.YOUR-SUBDOMAIN.workers.dev';

export class SharedConfigError extends Error {}

async function callWorker(body: Record<string, unknown>): Promise<string> {
  if (WORKER_URL.includes('YOUR-SUBDOMAIN')) {
    throw new SharedConfigError('아직 공용 서버 주소가 설정되지 않았어요.');
  }

  const res = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.error ?? `HTTP ${res.status}`) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return (data?.text ?? '').trim();
}

export async function analyzeStyleFromImagesShared(
  passcode: string,
  images: ImageInput[],
): Promise<string> {
  return callWorker({
    action: 'style',
    passcode,
    images: images.map((img) => ({ mediaType: img.mediaType, data: img.data })),
  });
}

export interface SharedReplyParams {
  passcode: string;
  contactName: string;
  personaMode: PersonaMode;
  styleNotes: string;
  recentMessages: Message[];
  situation: string;
}

export async function generateReplyShared(params: SharedReplyParams): Promise<string> {
  return callWorker({
    action: 'reply',
    passcode: params.passcode,
    contactName: params.contactName,
    personaMode: params.personaMode,
    styleNotes: params.styleNotes,
    recentMessages: params.recentMessages.slice(-10).map((m) => ({ sender: m.sender, text: m.text })),
    situation: params.situation,
  });
}

export function toFriendlySharedErrorMessage(error: unknown): string {
  if (error instanceof SharedConfigError) return error.message;
  const status = (error as { status?: number } | undefined)?.status;
  if (status === 401) return '비밀번호가 올바르지 않아요.';
  if (error instanceof Error) return error.message;
  return 'AI 답장을 받아오지 못했어요.';
}
