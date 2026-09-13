import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

/**
 * Gemini Vector Embeddings Generator
 *
 * Uses Google Gemini's native embedding model (gemini-embedding-001)
 * with 3072 output dimensions to generate semantic vector representations
 * of merchant knowledge base documents.
 *
 * Provider: Google Gemini (@ai-sdk/google)
 */

export const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
export const GEMINI_EMBEDDING_DIMENSION = 3072;

function getGoogleProvider() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured in server environment variables."
    );
  }

  return createGoogleGenerativeAI({ apiKey });
}

export interface EmbeddingResult {
  text: string;
  embedding: number[];
}

/**
 * Generates a vector embedding for a single text string using Google Gemini.
 * Enforces a 10-second timeout via AbortController to prevent hanging.
 */
export async function generateGeminiEmbedding(text: string): Promise<number[]> {
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error("Cannot generate embedding for empty text.");
  }

  const google = getGoogleProvider();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel(GEMINI_EMBEDDING_MODEL),
      value: cleanText,
      abortSignal: controller.signal,
    });

    return embedding;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Generates vector embeddings for multiple text chunks in batch.
 * Enforces a 15-second timeout via AbortController to prevent hanging.
 */
export async function generateGeminiEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const cleanTexts = texts.map((t) => t.trim()).filter(Boolean);
  if (cleanTexts.length === 0) {
    return [];
  }

  const google = getGoogleProvider();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const { embeddings } = await embedMany({
      model: google.textEmbeddingModel(GEMINI_EMBEDDING_MODEL),
      values: cleanTexts,
      abortSignal: controller.signal,
    });

    return embeddings;
  } finally {
    clearTimeout(timeoutId);
  }
}
