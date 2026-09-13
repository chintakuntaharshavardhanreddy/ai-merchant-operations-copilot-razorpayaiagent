import * as fs from "fs";
import * as path from "path";
import { getServerSupabaseClient } from "../db/client";
import { generateGeminiEmbeddings } from "./embeddings";

export interface KnowledgeDocumentChunk {
  id?: string;
  title: string;
  content: string;
  embedding?: number[];
  metadata: {
    source: string;
    section: string;
    chunk: number;
    totalChunks?: number;
  };
}

export interface IngestionResult {
  documentsProcessed: number;
  chunksIngested: number;
  storedInSupabase: boolean;
  errors: string[];
}

/**
 * Extracts top title (# Header) from markdown text.
 */
function extractDocumentTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

/**
 * Chunks a markdown document by headers (##, ###) while preserving context.
 */
function chunkMarkdown(
  markdown: string,
  filename: string
): Omit<KnowledgeDocumentChunk, "embedding">[] {
  const docTitle = extractDocumentTitle(
    markdown,
    filename.replace(/\.md$/, "").replace(/-/g, " ")
  );

  // Split by markdown level 2 or 3 headers: '## ' or '### '
  const lines = markdown.split("\n");
  const sections: { title: string; content: string[] }[] = [];
  let currentSectionTitle = docTitle;
  let currentLines: string[] = [];

  for (const line of lines) {
    const isH2 = line.startsWith("## ");
    const isH3 = line.startsWith("### ");

    if (isH2 || isH3) {
      if (currentLines.length > 0) {
        sections.push({
          title: currentSectionTitle,
          content: [...currentLines],
        });
        currentLines = [];
      }
      currentSectionTitle = line.replace(/^#{2,3}\s+/, "").trim();
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({
      title: currentSectionTitle,
      content: currentLines,
    });
  }

  const chunks: Omit<KnowledgeDocumentChunk, "embedding">[] = [];
  let chunkIndex = 0;

  for (const sec of sections) {
    const sectionText = sec.content.join("\n").trim();
    if (!sectionText) continue;

    const fullChunkText = `${docTitle} — ${sec.title}\n\n${sectionText}`;

    chunks.push({
      title: `${docTitle} — ${sec.title}`,
      content: fullChunkText,
      metadata: {
        source: filename,
        section: sec.title,
        chunk: ++chunkIndex,
      },
    });
  }

  // Set totalChunks in metadata
  for (const chunk of chunks) {
    chunk.metadata.totalChunks = chunks.length;
  }

  return chunks;
}

/**
 * Ingests all markdown files from data/knowledge/ into Supabase and local cache.
 */
export async function ingestKnowledgeBase(options?: {
  reset?: boolean;
}): Promise<IngestionResult> {
  const knowledgeDir = path.resolve(process.cwd(), "data/knowledge");
  const cachePath = path.resolve(process.cwd(), "data/knowledge-indexed.json");

  if (!fs.existsSync(knowledgeDir)) {
    throw new Error(`Knowledge directory not found: ${knowledgeDir}`);
  }

  const files = fs
    .readdirSync(knowledgeDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".markdown"));

  const allRawChunks: Omit<KnowledgeDocumentChunk, "embedding">[] = [];

  for (const file of files) {
    const filePath = path.join(knowledgeDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    const fileChunks = chunkMarkdown(content, file);
    allRawChunks.push(...fileChunks);
  }

  if (allRawChunks.length === 0) {
    return {
      documentsProcessed: 0,
      chunksIngested: 0,
      storedInSupabase: false,
      errors: ["No markdown chunks parsed from knowledge base."],
    };
  }

  // Generate embeddings in batches of 10
  const chunkContents = allRawChunks.map((c) => c.content);
  const embeddings: number[][] = [];
  const batchSize = 10;

  for (let i = 0; i < chunkContents.length; i += batchSize) {
    const batch = chunkContents.slice(i, i + batchSize);
    const batchEmbeddings = await generateGeminiEmbeddings(batch);
    embeddings.push(...batchEmbeddings);
  }

  const finalChunks: KnowledgeDocumentChunk[] = allRawChunks.map(
    (chunk, idx) => ({
      ...chunk,
      embedding: embeddings[idx],
    })
  );

  // Write local indexed backup for fast fallback/testing
  fs.writeFileSync(cachePath, JSON.stringify(finalChunks, null, 2), "utf8");

  // Upsert into Supabase pgvector if table exists
  let storedInSupabase = false;
  const errors: string[] = [];
  const sb = getServerSupabaseClient();

  if (sb) {
    try {
      if (options?.reset) {
        await sb.from("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }

      const rowsToInsert = finalChunks.map((c) => ({
        title: c.title,
        content: c.content,
        embedding: c.embedding,
        metadata: c.metadata,
      }));

      // Insert in batches of 10
      for (let i = 0; i < rowsToInsert.length; i += 10) {
        const batch = rowsToInsert.slice(i, i + 10);
        const { error } = await sb.from("documents").insert(batch);
        if (error) {
          errors.push(`Supabase insert error: ${error.message}`);
          break;
        }
      }

      if (errors.length === 0) {
        storedInSupabase = true;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Supabase connection error: ${msg}`);
    }
  } else {
    errors.push("Supabase client not initialized (missing environment credentials).");
  }

  return {
    documentsProcessed: files.length,
    chunksIngested: finalChunks.length,
    storedInSupabase,
    errors,
  };
}
