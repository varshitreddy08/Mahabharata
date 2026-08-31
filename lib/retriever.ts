import { cosineSimilarity, embed } from 'ai';
import { readFileSync } from 'fs';
import { join } from 'path';
import { chunks, type Chunk } from './corpus';
import { embeddingModel } from './openrouter';

interface StoredEmbedding {
  id: string;
  embedding: number[];
}

let embeddingsCache: StoredEmbedding[] | null = null;

function loadEmbeddings(): StoredEmbedding[] {
  if (embeddingsCache) return embeddingsCache;
  const filePath = join(process.cwd(), 'data', 'embeddings.json');
  const raw = readFileSync(filePath, 'utf-8');
  embeddingsCache = JSON.parse(raw) as StoredEmbedding[];
  return embeddingsCache;
}

export interface RetrievedChunk extends Chunk {
  score: number;
}

export async function retrieve(query: string, topK = 5): Promise<RetrievedChunk[]> {
  const stored = loadEmbeddings();

  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: query,
  });

  const chunkMap = new Map(chunks.map((c) => [c.id, c]));

  const scored = stored
    .map((s) => ({
      id: s.id,
      score: cosineSimilarity(queryEmbedding, s.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored.map((s) => ({
    ...chunkMap.get(s.id)!,
    score: s.score,
  }));
}
