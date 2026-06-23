const db     = require('./db')
const { embed } = require('./embedder')

async function search(query, topK = 3, snippetOnly = false, threshold = 0.5) {
  const vector = await embed(query)

  const { rows } = await db.query(
    `SELECT
       id, file, fn_name AS "fnName", code,
       start_line AS "startLine", project_name AS "projectName", source_path AS "sourcePath",
       ROUND((1 - (embedding <=> $1::vector))::numeric, 4) AS score
     FROM rag_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [JSON.stringify(vector), topK]
  )

  const filtered = rows.filter(function(r) { return r.score >= threshold })

  if (!snippetOnly) return filtered
  return filtered.map(function(r) {
    return Object.assign({}, r, { code: r.code.slice(0, 150) })
  })
}

module.exports = { search }
