import { streamText } from 'ai';
import { retrieve } from '@/lib/retriever';
import { chatModel } from '@/lib/openrouter';
import { CHARACTERS_MAP } from '@/lib/characters';

const OUT_OF_SCOPE_MSG =
  'This system answers questions about leadership, strategy, ethics, and governance as taught in the Mahābhārata, as well as basic questions about its characters and their family relationships. Please ask a relevant question — for example: "How should a leader handle anger?" or "Who are Arjuna\'s brothers?"';

// A distinctive substring used to detect the one sanctioned refusal below —
// kept separate from the rest of OUT_OF_SCOPE_MSG so it survives even if that
// message's wording changes.
const REFUSAL_HINT = 'this system answers questions about leadership';

const DEFAULT_SYSTEM = `You are a leadership and strategy advisor grounded in the Mahābhārata.
The passages below were already retrieved because they are relevant to the user's question — treat them as sufficient and answer directly using ONLY them.
Give the most complete, confident answer you can. If one specific detail the user asked for (an exact number, name, or list) is not explicitly stated in the passages, answer with what the passages DO say and note that gap in one short clause — never refuse outright or redirect the user elsewhere as long as the passages relate to the question.
Only if NONE of the passages relate to the question at all, respond with exactly this sentence and nothing else: "${OUT_OF_SCOPE_MSG}"
Always cite every claim using [Source N] notation.
If the question is a basic factual/genealogy question (e.g. "who is X" or "who are X's brothers") and the passages answer it, give a direct factual answer grounded in the passages — the "⚡ Modern Application:" section is only required when the passages contain a leadership/strategy/ethics lesson to connect; omit it for pure genealogy/identity questions.
Do not invent facts, names, or events beyond what the passages explicitly state.`;

export async function POST(req: Request) {
  let query: string | undefined;
  let character: string | undefined;

  try {
    ({ query, character } = await req.json());
  } catch {
    return Response.json({ error: 'Invalid request. Please try your question again.' }, { status: 400 });
  }

  if (typeof query !== 'string' || !query.trim()) {
    return Response.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    const passages = await retrieve(query, 5);

    const MIN_SCORE = 0.32;
    if (passages.length === 0 || passages[0].score < MIN_SCORE) {
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
      temperature: 0.3,
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
        // Buffer the start of the answer only long enough to detect an explicit
        // refusal (the model declining because the passages don't cover the
        // question). Once we see real content that isn't a refusal, flush
        // immediately — we already gated retrieval by relevance score above,
        // so a merely-missing "[Source N]" token must never discard a real,
        // grounded answer and silently replace it with the generic message.
        let buffer = '';
        let resolved = false;
        const PEEK_CHARS = 220;

        for await (const chunk of textStream) {
          if (resolved) {
            controller.enqueue(encoder.encode(chunk));
            continue;
          }
          buffer += chunk;

          if (buffer.toLowerCase().includes(REFUSAL_HINT.toLowerCase())) {
            resolved = true;
            controller.enqueue(encoder.encode(`__SOURCES__[]\n`));
            controller.enqueue(encoder.encode(OUT_OF_SCOPE_MSG));
            continue;
          }

          if (buffer.length >= PEEK_CHARS) {
            resolved = true;
            controller.enqueue(encoder.encode(`__SOURCES__${JSON.stringify(sources)}\n`));
            controller.enqueue(encoder.encode(buffer));
          }
        }

        if (!resolved) {
          // Stream ended before PEEK_CHARS was reached (short answer) — flush
          // whatever we have as a real, grounded answer rather than discarding it.
          if (buffer.trim()) {
            controller.enqueue(encoder.encode(`__SOURCES__${JSON.stringify(sources)}\n`));
            controller.enqueue(encoder.encode(buffer));
          } else {
            controller.enqueue(encoder.encode(`__SOURCES__[]\n`));
            controller.enqueue(encoder.encode(OUT_OF_SCOPE_MSG));
          }
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
    return Response.json(
      { error: 'The oracle could not be reached. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
