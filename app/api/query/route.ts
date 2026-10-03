import { streamText } from 'ai';
import { retrieve } from '@/lib/retriever';
import { chatModel } from '@/lib/openrouter';
import { CHARACTERS_MAP } from '@/lib/characters';

const DEFAULT_SYSTEM = `You are a leadership and strategy advisor grounded in the Mahābhārata.
Answer the user's question using ONLY the provided source passages.
IMPORTANT: If the question is about a person, place, or topic not present in the provided passages — including anyone not from the Mahābhārata — do NOT generate an answer. Instead respond: "This question cannot be answered from the available Mahābhārata sources. Please ask about leadership, strategy, ethics, dharma, or the characters and family relationships of the epic."
Always cite your sources using [Source N] notation.
If the question is a basic factual/genealogy question (e.g. "who is X" or "who are X's brothers") and the passages answer it, give a direct factual answer grounded in the passages — the "⚡ Modern Application:" section is only required when the passages contain a leadership/strategy/ethics lesson to connect; omit it for pure genealogy/identity questions.
Do not invent facts, names, or events beyond what the passages explicitly state.`;

const OUT_OF_SCOPE_MSG =
  'This system answers questions about leadership, strategy, ethics, and governance as taught in the Mahābhārata, as well as basic questions about its characters and their family relationships. Please ask a relevant question — for example: "How should a leader handle anger?" or "Who are Arjuna\'s brothers?"';

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
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`__SOURCES__[]\n`));
          controller.enqueue(encoder.encode(OUT_OF_SCOPE_MSG));
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
        // Buffer output until a real [Source N] citation appears. The model is
        // instructed to answer only from the passages and cite as it goes — if it
        // never cites, it has drifted into unsourced general knowledge rather than
        // refusing, so we discard that text and send the refusal instead.
        let buffer = '';
        let grounded = false;

        for await (const chunk of textStream) {
          if (grounded) {
            controller.enqueue(encoder.encode(chunk));
            continue;
          }
          buffer += chunk;
          if (/\[Source \d+\]/.test(buffer)) {
            grounded = true;
            controller.enqueue(encoder.encode(`__SOURCES__${JSON.stringify(sources)}\n`));
            controller.enqueue(encoder.encode(buffer));
          }
        }

        if (!grounded) {
          controller.enqueue(encoder.encode(`__SOURCES__[]\n`));
          controller.enqueue(encoder.encode(OUT_OF_SCOPE_MSG));
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
