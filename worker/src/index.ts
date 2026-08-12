export interface Env {
  GEMINI_API_KEY: string;
  SHARED_PASSCODE: string;
  ALLOWED_ORIGIN: string;
}

type PersonaMode = 'loving' | 'cold' | 'learned';

interface StyleRequestBody {
  action: 'style';
  passcode: string;
  images: { mediaType: string; data: string }[];
}

interface ReplyRequestBody {
  action: 'reply';
  passcode: string;
  contactName: string;
  personaMode: PersonaMode;
  styleNotes: string;
  recentMessages: { sender: 'me' | 'them'; text: string }[];
  situation: string;
}

type RequestBody = StyleRequestBody | ReplyRequestBody;

const PERSONA_INSTRUCTIONS: Record<PersonaMode, string> = {
  loving:
    '당신은 다정하고 애정 넘치는 연인처럼 반응합니다. 따뜻하고 배려 깊은 말투로, 상대를 아끼는 마음이 느껴지게 답장하세요.',
  cold: '당신은 상대방에게 정을 뗄 수 있도록 일부러 무심하고 쌀쌀맞게 반응합니다. 짧고 건조하게, 관심 없는 듯한 말투로 답장하세요. 다만 욕설이나 인신공격은 하지 마세요.',
  learned:
    '아래 제공된 말투 특징을 최대한 반영해서, 그 사람이 실제로 쓸 법한 말투 그대로 답장하세요.',
};

const MODEL = 'gemini-2.5-flash';

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

async function callGemini(
  apiKey: string,
  parts: ({ text: string } | { inline_data: { mime_type: string; data: string } })[],
  systemInstruction?: string,
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const body: Record<string, unknown> = { contents: [{ role: 'user', parts }] };
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error((errBody as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
  return (text ?? '').trim();
}

function buildReplyPrompt(body: ReplyRequestBody) {
  let system = `당신은 지금부터 '${body.contactName}'이라는 사람이 되어, 아래 대화 상대(나)가 보낸 메시지에 카카오톡으로 답장합니다.\n${PERSONA_INSTRUCTIONS[body.personaMode]}`;
  if (body.personaMode === 'learned' && body.styleNotes.trim()) {
    system += `\n\n[말투 특징]\n${body.styleNotes.trim()}`;
  }
  system +=
    '\n\n답장은 실제 카카오톡 메시지처럼 짧고 자연스럽게, 1~3문장 이내로만 작성하세요. 설명이나 따옴표 없이 메시지 본문만 출력하세요.';

  const history = body.recentMessages
    .slice(-10)
    .map((m) => `${m.sender === 'me' ? '나' : body.contactName}: ${m.text}`)
    .join('\n');

  const userText = [
    history ? `[최근 대화]\n${history}` : null,
    `[상황] ${body.situation.trim()}`,
    `위 상황에서 ${body.contactName}이 어떻게 답장할지 한 번만 작성해줘.`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return { system, userText };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || '*';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: '잘못된 요청이에요.' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (!env.SHARED_PASSCODE || body.passcode !== env.SHARED_PASSCODE) {
      return new Response(JSON.stringify({ error: '비밀번호가 올바르지 않아요.' }), {
        status: 401,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    try {
      let text: string;
      if (body.action === 'style') {
        const parts = [
          ...body.images.map((img) => ({ inline_data: { mime_type: img.mediaType, data: img.data } })),
          {
            text: '이 카카오톡 대화 캡처 이미지들에서, 나(왼쪽/초록 or 노랑 말풍선)의 상대방(오른쪽이 아닌 쪽, 즉 상대방 말풍선)이 쓴 말투의 특징을 분석해줘. 어투(반말/존댓말), 자주 쓰는 말버릇이나 이모티콘, 문장을 끝맺는 방식, 성격이 드러나는 부분을 5~8개의 짧은 불릿으로 정리해줘. 설명 없이 불릿만 출력해.',
          },
        ];
        text = await callGemini(env.GEMINI_API_KEY, parts);
      } else if (body.action === 'reply') {
        const { system, userText } = buildReplyPrompt(body);
        text = await callGemini(env.GEMINI_API_KEY, [{ text: userText }], system);
      } else {
        return new Response(JSON.stringify({ error: '알 수 없는 요청이에요.' }), {
          status: 400,
          headers: { ...headers, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ text }), {
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'AI 요청 중 오류가 발생했어요.';
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }
  },
};
