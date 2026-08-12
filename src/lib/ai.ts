import type { AppSettings, Message, PersonaMode } from '../types';
import { analyzeStyleFromImages, generateReply, toFriendlyErrorMessage, type ImageInput } from './claude';
import {
  analyzeStyleFromImagesGemini,
  generateReplyGemini,
  toFriendlyGeminiErrorMessage,
} from './gemini';

export type { ImageInput };

export function analyzeStyleFromImagesWith(settings: AppSettings, images: ImageInput[]): Promise<string> {
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
  return provider === 'gemini' ? toFriendlyGeminiErrorMessage(error) : toFriendlyErrorMessage(error);
}

export function hasApiKey(settings: AppSettings): boolean {
  return settings.provider === 'gemini' ? !!settings.geminiApiKey.trim() : !!settings.claudeApiKey.trim();
}
