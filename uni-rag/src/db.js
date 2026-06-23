const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
pool.on('error', e => console.error('[DB] pool 오류:', e.message))

module.exports = { query: (text, params) => pool.query(text, params), pool }
