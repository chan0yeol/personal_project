const fs   = require('fs')
const path = require('path')
const glob = require('fast-glob')
const { extractChunks } = require('./chunker')
const { embed }         = require('./embedder')
const db                = require('./db')

const SOURCE_DIRS = (process.env.SOURCE_PATH || '/source').split(',').map(p => p.trim())

const INCLUDE_PATTERNS = ['**/*.js']
const EXCLUDE_PATTERNS = [
  '**/*.min.js',
  '**/demo/**',
  '**/guide/**',
  '**/test/**',
  '**/theme/**',
  '**/vendorCustom/**',
  '**/fineUploader/**',
]

let indexMeta = { chunks: 0, files: 0, lastIndexed: null }

async function runIndex() {
  const allChunks = []

  for (const sourceDir of SOURCE_DIRS) {
    console.log(`[indexer] 소스 경로: ${sourceDir}`)
    const files = await glob(INCLUDE_PATTERNS, {
      cwd: sourceDir, absolute: true, ignore: EXCLUDE_PATTERNS,
    })
    console.log(`[indexer] ${files.length}개 파일 발견`)

    const projectMatch = sourceDir.match(/[\\/](?:99\.project|projects)[\\/]([^\\/]+)/i)
    const projectName  = projectMatch ? projectMatch[1] : path.basename(sourceDir)

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf8')
        const chunks  = extractChunks(content, filePath, sourceDir)
        chunks.forEach(c => allChunks.push({
          ...c,
          id:          `${sourceDir}:${c.id}`,
          sourcePath:  sourceDir,
          projectName,
        }))
      } catch (e) {
        console.warn(`[indexer] 파일 읽기 실패: ${filePath} — ${e.message}`)
      }
    }
  }

  console.log(`[indexer] 총 ${allChunks.length}개 청크 추출, 임베딩 시작...`)

  // 기존 데이터 초기화
  console.log('[indexer] DB 연결 중...')
  await db.query('TRUNCATE TABLE rag_chunks')
  console.log('[indexer] DB 초기화 완료, 임베딩 삽입 시작')

  let done = 0
  for (const chunk of allChunks) {
    try {
      const vector = await embed(`${chunk.fnName} ${chunk.code.slice(0, 300)}`)
      await db.query(
        `INSERT INTO rag_chunks
           (id, file, fn_name, code, start_line, project_name, source_path, embedding)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::vector)
         ON CONFLICT (id) DO UPDATE SET
           file=EXCLUDED.file, fn_name=EXCLUDED.fn_name, code=EXCLUDED.code,
           start_line=EXCLUDED.start_line, embedding=EXCLUDED.embedding,
           indexed_at=NOW()`,
        [
          chunk.id, chunk.file, chunk.fnName, chunk.code,
          chunk.startLine, chunk.projectName, chunk.sourcePath,
          JSON.stringify(vector),
        ]
      )
      done++
      if (done % 50 === 0) console.log(`[indexer] ${done}/${allChunks.length} 완료`)
    } catch (e) {
      console.warn(`[indexer] 청크 임베딩 실패: ${chunk.id} — ${e.message}`)
    }
  }

  indexMeta = {
    chunks:      done,
    files:       new Set(allChunks.map(c => c.file)).size,
    lastIndexed: new Date().toISOString(),
  }
  console.log(`[indexer] 완료 — ${done}개 청크 / ${indexMeta.files}개 파일`)
}

function getMeta() { return indexMeta }

module.exports = { runIndex, getMeta }
