import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../lib/hooks';
import type { AiProvider } from '../types';

const CLAUDE_MODELS = [
  { value: 'claude-opus-5', label: 'Claude Opus 5 (가장 똑똑함, 비용 높음)' },
  { value: 'claude-sonnet-5', label: 'Claude Sonnet 5 (균형)' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (저렴하고 빠름)' },
];

const GEMINI_MODELS = [
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (가장 똑똑함)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (저렴하고 빠름, 추천)' },
];

const PROVIDERS: { value: AiProvider; label: string }[] = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'gemini', label: 'Gemini (Google)' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { settings, update } = useSettings();
  const [provider, setProvider] = useState<AiProvider>(settings.provider);
  const [claudeApiKey, setClaudeApiKey] = useState(settings.claudeApiKey);
  const [claudeModel, setClaudeModel] = useState(settings.claudeModel);
  const [geminiApiKey, setGeminiApiKey] = useState(settings.geminiApiKey);
  const [geminiModel, setGeminiModel] = useState(settings.geminiModel);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    update({
      provider,
      claudeApiKey: claudeApiKey.trim(),
      claudeModel,
      geminiApiKey: geminiApiKey.trim(),
      geminiModel,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center gap-3 border-b border-neutral-200 px-4 py-4 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-xl text-neutral-500"
          aria-label="뒤로가기"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">설정</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 py-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            AI 답장에 쓸 모델
          </label>
          <div className="flex gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setProvider(p.value)}
                className={`flex-1 rounded-xl border px-3 py-3 text-sm ${
                  provider === p.value
                    ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                    : 'border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {provider === 'claude' ? (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Anthropic API 키
              </label>
              <input
                type="password"
                value={claudeApiKey}
                onChange={(e) => setClaudeApiKey(e.target.value)}
                placeholder="sk-ant-..."
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
              />
              <p className="mt-2 text-xs text-neutral-400">
                이 키는 이 브라우저에만 저장되고, 다른 사람에게 전송되지 않아요.{' '}
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  API 키 발급받기
                </a>
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Claude 모델
              </label>
              <div className="flex flex-col gap-2">
                {CLAUDE_MODELS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setClaudeModel(opt.value)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm ${
                      claudeModel === opt.value
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                        : 'border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Gemini API 키
              </label>
              <input
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-base outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
              />
              <p className="mt-2 text-xs text-neutral-400">
                이 키는 이 브라우저에만 저장되고, 다른 사람에게 전송되지 않아요.{' '}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  API 키 발급받기
                </a>
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Gemini 모델
              </label>
              <div className="flex flex-col gap-2">
                {GEMINI_MODELS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setGeminiModel(opt.value)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm ${
                      geminiModel === opt.value
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                        : 'border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handleSave}
          className="mt-auto rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          {saved ? '저장됨' : '저장'}
        </button>
      </div>
    </div>
  );
}
