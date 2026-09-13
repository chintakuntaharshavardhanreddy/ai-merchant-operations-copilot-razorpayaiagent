-- AI Merchant Operations Copilot: RAG Knowledge Base Schema
-- Run this in the Supabase SQL Editor to enable pgvector and create the documents table.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Documents table for semantic knowledge chunks
-- Uses 3072 dimensions matching the Google Gemini embedding model (gemini-embedding-001)
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(3072) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
-- Allow public read for semantic vector similarity search via anon key
CREATE POLICY "Allow public read documents" ON documents FOR SELECT USING (true);
-- Ingestion/modification is restricted to privileged server-side operations (service_role)

-- 4. Match Documents Similarity Search Function
-- Calculates cosine similarity (1 - cosine distance)
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(3072),
  match_threshold FLOAT DEFAULT 0.3,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.content,
    (1 - (documents.embedding <=> query_embedding))::FLOAT AS similarity,
    documents.metadata
  FROM documents
  WHERE (1 - (documents.embedding <=> query_embedding)) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
