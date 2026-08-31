import { streamText } from 'ai';
import { retrieve } from '@/lib/retriever';
import { chatModel } from '@/lib/openrouter';

export async function POST(req: Request) {
  try {
    const { query }: { query: string } = await req.json();

    if (!query?.trim()) {
      return Response.json({ error: 'Query is required' }, { status: 400 });
    }

    const passages = await retrieve(query, 5);

    // If top passage similarity is too low, the query is off-topic
    const MIN_SCORE = 0.25;
    if (passages[0].score < MIN_SCORE) {
      const encoder = new TextEncoder();
      const msg = 'This system only answers questions about leadership, strategy, ethics, and governance as taught in the Mahābhārata. Please ask a relevant question — for example: "How should a leader handle anger?" or "What are the four instruments of statecraft?"';
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
    }));

    const { textStream } = streamText({
      model: chatModel,
      system: `You are a leadership and strategy advisor grounded in the Mahābhārata.
Answer the user's question using ONLY the provided source passages.
Always cite your sources using [Source N] notation.
After your answer, list the exact sources used.
Do not invent or extend beyond what the passages say.`,
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
        // First line: sources metadata
        controller.enqueue(encoder.encode(`__SOURCES__${JSON.stringify(sources)}\n`));
        // Stream LLM text chunks
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
