import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

// Free embedding model via OpenRouter
export const embeddingModel = openrouter.textEmbeddingModel('openai/text-embedding-3-small');

// Fast OpenAI model via OpenRouter
export const chatModel = openrouter('openai/gpt-4o-mini');
