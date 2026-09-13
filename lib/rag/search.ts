import * as fs from "fs";
import * as path from "path";
import { getSupabaseClient } from "../db/client";
import { generateGeminiEmbedding } from "./embeddings";
import type { KnowledgeDocumentChunk } from "./ingest";

export interface SearchResultChunk {
  id: string;
  title: string;
  content: string;
  similarity: number;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  limit?: number;
  similarityThreshold?: number;
}

/**
 * Computes cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Searches the operational knowledge base using Gemini embeddings.
 * Queries Supabase pgvector `match_documents` RPC with fallback to local indexed embeddings.
 * Enforces a 3-second timeout on the Supabase RPC to prevent indefinite hangs.
 */
export async function searchKnowledgeBase(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResultChunk[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const limit = options.limit ?? 4;
  const threshold = options.similarityThreshold ?? 0.35;

  // 1. Generate query embedding with Gemini
  const queryEmbedding = await generateGeminiEmbedding(cleanQuery);

  // 2. Try Supabase pgvector RPC with a 3-second timeout
  const sb = getSupabaseClient();
  if (sb) {
    try {
      type SupabaseRpcReturn = {
        data: Array<{
          id?: string;
          title: string;
          content: string;
          similarity: number;
          metadata?: { source?: string; [key: string]: unknown };
        }> | null;
        error: { message: string } | null;
      };

      const rpcCall = async (): Promise<SupabaseRpcReturn> => {
        const res = await sb.rpc("match_documents", {
          query_embedding: queryEmbedding,
          match_threshold: threshold,
          match_count: limit,
        });
        return {
          data: res.data as SupabaseRpcReturn["data"],
          error: res.error ? { message: res.error.message } : null,
        };
      };

      const timeoutPromise = new Promise<SupabaseRpcReturn>((_, reject) =>
        setTimeout(() => reject(new Error("Supabase RPC timeout")), 3000)
      );

      const { data, error } = await Promise.race([rpcCall(), timeoutPromise]);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((item) => ({
          id: item.id || `doc-${Math.random().toString(36).slice(2, 8)}`,
          title: item.title,
          content: item.content,
          similarity: Math.round(Number(item.similarity) * 1000) / 1000,
          source: item.metadata?.source || "knowledge-base",
          metadata: item.metadata,
        }));
      }
    } catch {
      // Fallback cleanly to local cached embeddings
    }
  }

  // 3. Fallback: Search in-memory/disk cached embeddings
  const cachePath = path.resolve(process.cwd(), "data/knowledge-indexed.json");
  if (fs.existsSync(cachePath)) {
    try {
      const rawData = fs.readFileSync(cachePath, "utf8");
      const chunks: KnowledgeDocumentChunk[] = JSON.parse(rawData);

      const scored = chunks
        .filter((c) => Array.isArray(c.embedding) && c.embedding.length > 0)
        .map((c, idx) => {
          const sim = cosineSimilarity(queryEmbedding, c.embedding!);
          return {
            id: `cached-${idx + 1}`,
            title: c.title,
            content: c.content,
            similarity: Math.round(sim * 1000) / 1000,
            source: c.metadata.source,
            metadata: c.metadata,
          };
        })
        .filter((c) => c.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      return scored;
    } catch (e) {
      console.warn("[RAG] Failed to search cached embeddings:", e);
    }
  }

  return [];
}
