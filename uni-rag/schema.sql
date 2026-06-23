-- uni-rag pgvector 스키마
-- PostgreSQL에 pgvector 설치 필요: CREATE EXTENSION IF NOT EXISTS vector;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_chunks (
  id           TEXT PRIMARY KEY,
  file         TEXT NOT NULL,
  fn_name      TEXT NOT NULL,
  code         TEXT NOT NULL,
  start_line   INTEGER,
  project_name TEXT,
  source_path  TEXT,
  embedding    vector(1024),        -- mxbai-embed-large 1024차원
  indexed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 코사인 유사도 HNSW 인덱스 (pgvector >= 0.5.0)
CREATE INDEX IF NOT EXISTS idx_rag_embedding
  ON rag_chunks USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_rag_file ON rag_chunks (file);
CREATE INDEX IF NOT EXISTS idx_rag_project ON rag_chunks (project_name);




