import chunksRaw from '@/data/mahabharata_chunks.json';

export interface Chunk {
  id: string;
  parva: string;
  adhyaya: string;
  episode: string;
  topic: string;
  text: string;
  themes: string[];
  url: string;
}

export const chunks: Chunk[] = chunksRaw as Chunk[];
