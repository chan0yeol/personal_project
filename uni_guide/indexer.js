require('dotenv').config();
const { Pool } = require('pg');
const axios = require('axios');
const { loadAllChunks } = require('./chunker');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBED_MODEL = process.env.EMBED_MODEL || 'mxbai-embed-large';
const PROJECT_NAME = 'uni-guide';

async function embed(text) {
  const prompt = text.replace(/[\x00-\x1F\x7F]/g, ' ').slice(0, 1000).trim();
  const res = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
    model: EMBED_MODEL,
    prompt,
  });
  return res.data.embedding;
}

async function run() {
  const chunks = loadAllChunks();
  console.log(`총 ${chunks.length}개 청크 인덱싱 시작\n`);

  // 기존 uni-guide 데이터 삭제
  await pool.query(`DELETE FROM rag_chunks WHERE project_name = $1`, [PROJECT_NAME]);
  console.log('기존 uni-guide 청크 삭제 완료\n');

  let ok = 0, fail = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    process.stdout.write(`[${i + 1}/${chunks.length}] ${chunk.title.slice(0, 50)} ... `);

    try {
      const embedding = await embed(chunk.content);

      await pool.query(`
        INSERT INTO rag_chunks (id, file, fn_name, code, start_line, project_name, source_path, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          fn_name = EXCLUDED.fn_name,
          code = EXCLUDED.code,
          source_path = EXCLUDED.source_path,
          embedding = EXCLUDED.embedding,
          indexed_at = NOW()
      `, [
        chunk.id,
        chunk.file,
        chunk.title,
        chunk.content,
        0,
        PROJECT_NAME,
        chunk.breadcrumb,
        `[${embedding.join(',')}]`,
      ]);

      console.log('완료');
      ok++;
    } catch (e) {
      console.log(`실패: ${e.message}`);
      fail++;
    }
  }

  console.log(`\n인덱싱 완료 - 성공: ${ok}, 실패: ${fail}`);
  await pool.end();
}

run().catch(e => { console.error(e); process.exit(1); });
