import { streamText } from 'ai';
import { chatModel } from '@/lib/openrouter';
import { CHARACTERS_MAP } from '@/lib/characters';

interface SynthesizeBody {
  topic: string;
  char1: string;
  answer1: string;
  char2: string;
  answer2: string;
}

export async function POST(req: Request) {
  let body: Partial<SynthesizeBody>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request. Please try again.' }, { status: 400 });
  }

  const { topic, char1, answer1, char2, answer2 } = body;
  if (!topic?.trim() || !char1 || !char2 || !answer1?.trim() || !answer2?.trim()) {
    return Response.json({ error: 'Both debaters must answer before a synthesis can be drawn.' }, { status: 400 });
  }

  try {
    const c1 = CHARACTERS_MAP[char1];
    const c2 = CHARACTERS_MAP[char2];

    const { textStream } = streamText({
      model: chatModel,
      system: `You are a Dharmic scholar synthesizing two opposing perspectives from the Mahābhārata.
Given two great figures' views on the same leadership question, you will:
1. Name the core philosophical tension between them (one sharp sentence)
2. Identify the dharmic common ground — what both implicitly agree on
3. Deliver a unified synthesis: the highest wisdom that transcends both positions
Write in elevated, scholarly prose worthy of the sacred text. Be profound but concise — no more than three paragraphs total.`,
      messages: [
        {
          role: 'user',
          content: `Topic: "${topic}"

${c1?.name ?? char1}'s perspective (${c1?.philosophy ?? ''}):
${answer1}

---

${c2?.name ?? char2}'s perspective (${c2?.philosophy ?? ''}):
${answer2}

---

Provide the Dharmic Synthesis.`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[/api/synthesize]', message);
    return Response.json(
      { error: 'The synthesis could not be drawn. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
