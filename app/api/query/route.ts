import { streamText } from 'ai';
import { retrieve } from '@/lib/retriever';
import { chatModel } from '@/lib/openrouter';
import { CHARACTERS_MAP } from '@/lib/characters';

const DEFAULT_SYSTEM = `You are a leadership and strategy advisor grounded in the Mahābhārata.
Answer the user's question using ONLY the provided source passages.
IMPORTANT: If the question is about a person, place, or topic not present in the provided passages — including anyone not from the Mahābhārata — do NOT generate an answer. Instead respond: "This question cannot be answered from the available Mahābhārata sources. Please ask about leadership, strategy, ethics, or dharma as taught in the epic."
Always cite your sources using [Source N] notation.
After your main answer, add a short section titled "⚡ Modern Application:" that connects this ancient wisdom to a specific contemporary leadership or workplace scenario.
Do not invent facts, names, or events beyond what the passages explicitly state.`;

export async function POST(req: Request) {
  try {
    const { query, character }: { query: string; character?: string } = await req.json();

    if (!query?.trim()) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const passages = await retrieve(query, 5);

    const MIN_SCORE = 0.32;
    if (passages[0].score < MIN_SCORE) {
      const encoder = new TextEncoder();
      const msg =
        'This system only answers questions about leadership, strategy, ethics, and governance as taught in the Mahābhārata. Please ask a relevant question — for example: "How should a leader handle anger?" or "What are the four instruments of statecraft?"';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`__SOURCES__[]\n`));
          controller.enqueue(encoder.encode(msg));
          controller.close();
        },
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    const context = passages
      .map(
        (p, i) =>
          `[Source ${i + 1}] ${p.parva}, ${p.adhyaya} — ${p.episode}\nTopic: ${p.topic}\n"${p.text}"`
      )
      .join('\n\n');

    const sources = passages.map((p) => ({
      id: p.id,
      parva: p.parva,
      adhyaya: p.adhyaya,
      episode: p.episode,
      topic: p.topic,
      text: p.text,
      score: p.score,
      url: p.url,
    }));

    const char = character ? CHARACTERS_MAP[character] : null;
    const systemPrompt = char ? char.system : DEFAULT_SYSTEM;

    const { textStream } = streamText({
      model: chatModel,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Question: ${query}\n\nRelevant passages from the Mahābhārata:\n\n${context}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(`__SOURCES__${JSON.stringify(sources)}\n`));
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
    console.error('[/api/query]', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
