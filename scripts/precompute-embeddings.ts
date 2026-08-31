/**
 * Run once to pre-compute embeddings for all corpus chunks.
 * Usage: npm run embed
 * Output: data/embeddings.json
 */
import { embedMany } from 'ai';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createOpenAI } from '@ai-sdk/openai';
import chunks from '../data/mahabharata_chunks.json';

// Load .env.local manually (tsx doesn't auto-load it)
try {
  const envFile = readFileSync(join(process.cwd(), '.env.local'), 'utf-8');
  for (const line of envFile.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key?.trim() && !key.startsWith('#')) {
      process.env[key.trim()] ??= rest.join('=').trim();
    }
  }
} catch {}


const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function main() {
  console.log(`Embedding ${chunks.length} chunks...`);

  const texts = chunks.map(
    (c) => `${c.topic}. ${c.text} Themes: ${c.themes.join(', ')}`
  );

  const { embeddings } = await embedMany({
    model: openrouter.textEmbeddingModel('openai/text-embedding-3-small'),
    values: texts,
  });

  const output = chunks.map((chunk, i) => ({
    id: chunk.id,
    embedding: embeddings[i],
  }));

  const outPath = join(process.cwd(), 'data', 'embeddings.json');
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Saved ${output.length} embeddings to data/embeddings.json`);
}

main().catch(console.error);
