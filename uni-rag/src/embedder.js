const axios = require('axios')

const OLLAMA_URL  = process.env.OLLAMA_URL  || 'http://localhost:11434'
const EMBED_MODEL = process.env.EMBED_MODEL || 'mxbai-embed-large'

function sanitize(text) {
  return text
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .slice(0, 400)
    .trim()
}

async function embed(text) {
  const prompt = sanitize(text)
  try {
    const res = await axios.post(`${OLLAMA_URL}/api/embeddings`, {
      model: EMBED_MODEL,
      prompt,
    })
    return res.data.embedding
  } catch (e) {
    const detail = e.response?.data || e.message
    throw new Error(`Ollama 오류: ${JSON.stringify(detail)}`)
  }
}

module.exports = { embed }
