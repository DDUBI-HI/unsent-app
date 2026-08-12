import type { AppSettings, Message, PersonaMode } from '../types';
import { analyzeStyleFromImages, generateReply, toFriendlyErrorMessage, type ImageInput } from './claude';
import {
  analyzeStyleFromImagesGemini,
  generateReplyGemini,
  toFriendlyGeminiErrorMessage,
} from './gemini';
import {
  analyzeStyleFromImagesShared,
  generateReplyShared,
  toFriendlySharedErrorMessage,
} from './shared';

export type { ImageInput };

export function analyzeStyleFromImagesWith(settings: AppSettings, images: ImageInput[]): Promise<string> {
  if (settings.provider === 'shared') {
    return analyzeStyleFromImagesShared(settings.sharedPasscode, images);
  }
  if (settings.provider === 'gemini') {
    return analyzeStyleFromImagesGemini(settings.geminiApiKey, settings.geminiModel, images);
  }
  return analyzeStyleFromImages(settings.claudeApiKey, settings.claudeModel, images);
}

export interface ReplyRequest {
  settings: AppSettings;
  contactName: string;
  personaMode: PersonaMode;
  styleNotes: string;
  recentMessages: Message[];
  situation: string;
}

export function generateReplyWith(req: ReplyRequest): Promise<string> {
  if (req.settings.provider === 'shared') {
    return generateReplyShared({
      passcode: req.settings.sharedPasscode,
      contactName: req.contactName,
      personaMode: req.personaMode,
      styleNotes: req.styleNotes,
      recentMessages: req.recentMessages,
      situation: req.situation,
    });
  }
  if (req.settings.provider === 'gemini') {
    return generateReplyGemini({
      apiKey: req.settings.geminiApiKey,
      model: req.settings.geminiModel,
      contactName: req.contactName,
      personaMode: req.personaMode,
      styleNotes: req.styleNotes,
      recentMessages: req.recentMessages,
      situation: req.situation,
    });
  }
  return generateReply({
    apiKey: req.settings.claudeApiKey,
    model: req.settings.claudeModel,
    contactName: req.contactName,
    personaMode: req.personaMode,
    styleNotes: req.styleNotes,
    recentMessages: req.recentMessages,
    situation: req.situation,
  });
}

export function toFriendlyAiErrorMessage(provider: AppSettings['provider'], error: unknown): string {
  if (provider === 'shared') return toFriendlySharedErrorMessage(error);
  if (provider === 'gemini') return toFriendlyGeminiErrorMessage(error);
  return toFriendlyErrorMessage(error);
}

export function hasApiKey(settings: AppSettings): boolean {
  if (settings.provider === 'shared') return !!settings.sharedPasscode.trim();
  if (settings.provider === 'gemini') return !!settings.geminiApiKey.trim();
  return !!settings.claudeApiKey.trim();
}
