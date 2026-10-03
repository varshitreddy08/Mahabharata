import { chunks } from '@/lib/corpus';

export async function GET() {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const chunk = chunks[dayOfYear % chunks.length];
  return Response.json({
    id: chunk.id,
    parva: chunk.parva,
    adhyaya: chunk.adhyaya,
    episode: chunk.episode,
    topic: chunk.topic,
    text: chunk.text,
    url: chunk.url,
  });
}
