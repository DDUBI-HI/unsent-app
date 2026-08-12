import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useContacts, useSettings } from '../lib/hooks';
import { analyzeStyleFromImagesWith, hasApiKey, toFriendlyAiErrorMessage, type ImageInput } from '../lib/ai';
import type { ContactOutletContext } from './ContactDetail';
import type { PersonaMode } from '../types';

const MODES: { value: PersonaMode; label: string; emoji: string; desc: string }[] = [
  { value: 'loving', label: '다정한 연인', emoji: '💛', desc: '따뜻하고 애정 어린 말투로 답장' },
  { value: 'cold', label: '쌀쌀맞은 사람', emoji: '🧊', desc: '정 떼기용, 무심하고 건조하게 답장' },
  { value: 'learned', label: '실제 말투 학습', emoji: '📸', desc: '카톡 캡처를 분석해서 그 말투 그대로' },
];

function fileToImageInput(file: File): Promise<ImageInput> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(',')[1] ?? '';
      resolve({ mediaType: (file.type || 'image/jpeg') as ImageInput['mediaType'], data });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function PersonaView() {
  const { contact } = useOutletContext<ContactOutletContext>();
  const { update } = useContacts();
  const { settings } = useSettings();
  const [styleNotes, setStyleNotes] = useState(contact.styleNotes);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  function setMode(mode: PersonaMode) {
    update(contact.id, { personaMode: mode });
  }

  function saveStyleNotes(text: string) {
    setStyleNotes(text);
    update(contact.id, { styleNotes: text });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError('');
    setAnalyzing(true);
    try {
      const images = await Promise.all(Array.from(files).map(fileToImageInput));
      const result = await analyzeStyleFromImagesWith(settings, images);
      saveStyleNotes(result);
    } catch (e) {
      setError(toFriendlyAiErrorMessage(settings.provider, e));
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5">
      {!hasApiKey(settings) && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          AI 기능을 쓰려면 먼저{' '}
          <Link to="/settings" className="underline">
            설정에서 API 키
          </Link>
          를 등록해주세요.
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          어떤 모드로 답장할까요
        </h2>
        <div className="flex flex-col gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                contact.personaMode === m.value
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
                  : 'border-neutral-300 dark:border-neutral-700'
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{m.label}</span>
                <span
                  className={`block text-xs ${
                    contact.personaMode === m.value
                      ? 'text-white/70 dark:text-neutral-900/70'
                      : 'text-neutral-400'
                  }`}
                >
                  {m.desc}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {contact.personaMode === 'learned' && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            카카오톡 캡처로 말투 학습
          </h2>
          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            {analyzing ? '분석 중...' : '캡처 이미지 선택 (여러 장 가능)'}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={analyzing || !hasApiKey(settings)}
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
            />
          </label>

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          <textarea
            value={styleNotes}
            onChange={(e) => setStyleNotes(e.target.value)}
            onBlur={() => saveStyleNotes(styleNotes)}
            placeholder="분석 결과가 여기 나와요. 직접 수정해도 됩니다."
            rows={6}
            className="mt-3 w-full resize-none rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>
      )}
    </div>
  );
}
