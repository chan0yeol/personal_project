require('dotenv').config()
const express = require('express')
const cors    = require('cors')
const { runIndex, getMeta } = require('./indexer')
const { search }            = require('./searcher')

const app  = express()
const PORT = process.env.PORT || 3100

app.use(cors())
app.use(express.json())

// ── API ──────────────────────────────────────────────

app.post('/search', async (req, res) => {
  const { query, topK = 5, snippetOnly = false } = req.body
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query 필드 필요' })
  }
  try {
    const chunks = await search(query.trim(), Math.min(topK, 20), snippetOnly)
    res.json({ chunks })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.get('/health', (req, res) => {
  res.json({ ok: true, ...getMeta() })
})

app.post('/reindex', async (req, res) => {
  try {
    await runIndex()
    res.json({ ok: true, ...getMeta() })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

// ── 시작 ─────────────────────────────────────────────

async function start() {
  app.listen(PORT, () => console.log(`[uni-rag] http://localhost:${PORT}`))
  try {
    await runIndex()
  } catch (e) {
    console.error(`[startup] 인덱싱 실패:`, e)
  }
}

start()
