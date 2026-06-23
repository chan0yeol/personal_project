const { Pool, types } = require('pg');

types.setTypeParser(1082, val => val); // DATE → string 그대로 반환 (UTC 변환 방지)

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => console.error('[DB] pool 오류:', err.message));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
