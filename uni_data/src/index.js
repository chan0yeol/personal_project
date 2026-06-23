require('dotenv').config();
const express    = require('express');
const cron       = require('node-cron');
const swaggerUi  = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const { syncAll, keepSessions, fetchCommuteRange, upsertCommuteRecords, fetchHolidays, upsertHolidays } = require('./collect');
const { runHrBatch } = require('./hr');
const api = require('./api');

const app  = express();
const PORT = process.env.PORT || 4100;

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'uni_data API',
}));
app.use('/api', api);

// ── 크론 ──────────────────────────────────────────────────────
// 10분마다: 휴가/회의실/출퇴근 동기화 (UTC 기준)
cron.schedule('*/10 * * * *', () => {
  syncAll().catch(e => console.error('[크론] syncAll 실패:', e.message));
});

// 매일 01:00 KST: 인사정보 배치
cron.schedule('0 1 * * *', () => {
  runHrBatch().catch(e => console.error('[크론] HR배치 실패:', e.message));
}, { timezone: 'Asia/Seoul' });

// 30분마다: 세션 유지 (UTC 기준)
cron.schedule('*/30 * * * *', () => {
  keepSessions().catch(() => {});
});

// 매년 1월 1일 01:30 KST: 신년 공휴일 자동 수집
cron.schedule('30 1 1 1 *', async () => {
  const year = new Date().getFullYear();
  try {
    const list = await fetchHolidays(year);
    await upsertHolidays(list);
    console.log(`[공휴일] ${year}년 ${list.length}건 수집 완료`);
  } catch (e) { console.error('[공휴일] 수집 실패:', e.message); }
}, { timezone: 'Asia/Seoul' });

// 매일 02:00 KST: 이번 달 출퇴근 전체 백필 (누락 방지)
cron.schedule('0 2 * * *', async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const firstOfMonth = `${today.slice(0, 7)}-01`;
    console.log(`[백필] 출퇴근 월간 백필 시작 (${firstOfMonth}~${today})`);
    const list = await fetchCommuteRange(firstOfMonth, today, '00');
    await upsertCommuteRecords(list);
    console.log(`[백필] 출퇴근 ${list.length}건 완료`);
  } catch (e) { console.error('[백필] 출퇴근 백필 실패:', e.message); }
}, { timezone: 'Asia/Seoul' });

// ── 수동 트리거 API ───────────────────────────────────────────
app.post('/api/sync', async (req, res) => {
  res.json({ ok: true, message: '동기화 시작' });
  syncAll().catch(e => console.error('[수동 sync] 실패:', e.message));
});

app.post('/api/hr-batch', async (req, res) => {
  res.json({ ok: true, message: 'HR 배치 시작' });
  runHrBatch().catch(e => console.error('[수동 HR배치] 실패:', e.message));
});

app.post('/api/sync-holidays', async (req, res) => {
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
  res.json({ ok: true, message: `${year}년 공휴일 수집 시작` });
  fetchHolidays(year)
    .then(list => upsertHolidays(list))
    .then(() => console.log(`[공휴일] ${year}년 수집 완료`))
    .catch(e  => console.error('[공휴일] 수집 실패:', e.message));
});

app.post('/api/backfill-commute', async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = `${today.slice(0, 7)}-01`;
  res.json({ ok: true, message: `출퇴근 백필 시작 (${firstOfMonth}~${today})` });
  fetchCommuteRange(firstOfMonth, today, '00')
    .then(list => upsertCommuteRecords(list))
    .then(() => console.log(`[백필] 출퇴근 완료`))
    .catch(e  => console.error('[백필] 출퇴근 실패:', e.message));
});

// ── 시작 ──────────────────────────────────────────────────────
async function init() {
  console.log(`[시작] uni-data 서버 초기화 중...`);

  // 서버 먼저 실행 후 동기화를 백그라운드로
  app.listen(PORT, () => {
    console.log(`[시작] 서버 실행 중 (port: ${PORT})`);
    syncAll().catch(e => console.error('[시작] 초기 동기화 실패:', e.message));
  });
}

init().catch(e => { console.error('[시작] 초기화 실패:', e.stack); process.exit(1); });
