require('dotenv').config();
const axios   = require('axios');
const cron    = require('node-cron');
const express = require('express');
const db      = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS — Chrome 익스텐션(HTTPS) → HTTP 서버 허용
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── 유틸 ───────────────────────────────────────────────────────
function log(msg) {
  console.log(`[${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}] ${msg}`);
}

async function sendSlackDM(userId, text) {
  if (!SLACK_BOT_TOKEN) { log(`[DM] SLACK_BOT_TOKEN 없음 - 스킵`); return; }
  try {
    const res = await axios.post(
      'https://slack.com/api/chat.postMessage',
      { channel: userId, text },
      { headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' } }
    );
    if (!res.data.ok) log(`[DM] 발송 실패 (${userId}): ${res.data.error}`);
  } catch (err) { log(`[DM] 오류 (${userId}): ${err.message}`); }
}

// ── 멤버 로드 (Slack API, 구독*팀 필터) ───────────────────────
let membersData = [];

async function loadMembers() {
  if (!SLACK_BOT_TOKEN) { log('[멤버] SLACK_BOT_TOKEN 없음 - 스킵'); return; }
  try {
    const slackUsers = [];
    let cursor;
    do {
      const r = await axios.get('https://slack.com/api/users.list', {
        headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
        params:  { limit: 200, ...(cursor ? { cursor } : {}) },
      });
      if (!r.data.ok) throw new Error(r.data.error);
      r.data.members
        .filter(u => !u.is_bot && !u.deleted && u.id !== 'USLACKBOT')
        .forEach(u => slackUsers.push({
          slackId: u.id,
          name:    u.profile.display_name || u.profile.real_name || u.name,
        }));
      cursor = r.data.response_metadata?.next_cursor;
    } while (cursor);

    const teamRegex = /\(?(구독\d+팀)\)?/;
    membersData = slackUsers
      .map(u => {
        const match = u.name.match(teamRegex);
        if (!match) return null;
        return {
          slackId:  u.slackId,
          name:     u.name.replace(/\s*\(구독\d+팀\)\s*/, '').trim(),
          teamName: match[1],
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.teamName.localeCompare(b.teamName, 'ko'));

    log(`멤버 로드 완료 (${membersData.length}명)`);
  } catch (err) { log(`멤버 로드 오류: ${err.message}`); }
}

// ── API ────────────────────────────────────────────────────────

// 멤버 목록
app.get('/api/members', (_req, res) => res.json(membersData));

// 반영일정 전체 조회
app.get('/api/deploy-schedules', async (_req, res) => {
  try {
    const result = await db.query('SELECT * FROM deploy_schedules ORDER BY deploy_at ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 반영일정 등록
app.post('/api/deploy-schedule', async (req, res) => {
  const { deploy_at, ticket_no, title, hub_name, registrant_name, registrant_slack_id, create_name, notify_times } = req.body;
  if (!deploy_at || !title || !registrant_name || !registrant_slack_id)
    return res.status(400).json({ error: '필드 누락' });
  const times = Array.isArray(notify_times) ? notify_times.map(Number) : [15];
  try {
    const result = await db.query(
      `INSERT INTO deploy_schedules
         (deploy_at, ticket_no, title, hub_name, registrant_name, registrant_slack_id, create_name, notify_times)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [deploy_at, ticket_no || null, title, hub_name || null, registrant_name, registrant_slack_id, create_name || null, times]
    );
    log(`[반영일정] 등록: ${title} (${deploy_at}) - ${registrant_name} / 알림: [${times.join(',')}]분 전`);
    res.json({ ok: true, id: result.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 반영일정 수정
app.put('/api/deploy-schedules/:id', async (req, res) => {
  const { id } = req.params;
  const { deploy_at, ticket_no, title, hub_name, notify_times } = req.body;
  if (!deploy_at || !title) return res.status(400).json({ error: '필드 누락' });
  const fields = ['deploy_at=$1', 'ticket_no=$2', 'title=$3', 'hub_name=$4', 'notified_times=\'{}\''];
  const vals   = [deploy_at, ticket_no || null, title, hub_name || null];
  if (Array.isArray(notify_times)) { fields.push(`notify_times=$${vals.length + 1}`); vals.push(notify_times.map(Number)); }
  vals.push(id);
  try {
    await db.query(`UPDATE deploy_schedules SET ${fields.join(', ')} WHERE id=$${vals.length}`, vals);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 반영일정 삭제
app.delete('/api/deploy-schedules/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM deploy_schedules WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 피드백 DM (U09SJ2F3TL1 = 오찬열)
app.post('/api/feedback', async (req, res) => {
  const { message, from } = req.body;
  if (!message?.trim()) return res.status(400).json({ ok: false, error: 'message required' });
  const text = `*[UniSupport 피드백/문의]*\n*보낸 사람:* ${from || '알 수 없음'}\n\n${message.trim()}`;
  try {
    await sendSlackDM('U09SJ2F3TL1', text);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── 반영일정 알림 크론 (매분 실행) ────────────────────────────
function initDeployCron() {
  cron.schedule('* * * * *', async () => {
    try {
      // notify_times 배열의 각 시간별로 미발송 건 조회
      const rows = await db.query(`
        SELECT ds.id, ds.deploy_at, ds.ticket_no, ds.title, ds.hub_name,
               ds.registrant_name, ds.registrant_slack_id,
               ds.notified_times, t.mins
        FROM deploy_schedules ds
        CROSS JOIN LATERAL unnest(COALESCE(ds.notify_times, '{15}')) AS t(mins)
        WHERE ds.deploy_at > NOW()
          AND NOT (COALESCE(ds.notified_times, '{}') @> ARRAY[t.mins])
          AND ds.deploy_at <= NOW() + t.mins * INTERVAL '1 minute'
          AND ds.deploy_at - t.mins * INTERVAL '1 minute' >= NOW() - INTERVAL '1 minute'
      `);

      for (const r of rows.rows) {
        const deployTime = new Date(r.deploy_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
        await sendSlackDM(
          r.registrant_slack_id,
          `[반영 ${r.mins}분 전 알림]\n접수번호: ${r.ticket_no || '-'}\n고객사: ${r.hub_name || '-'}\n제목: ${r.title}\n반영일시: ${deployTime}` +
          (r.ticket_no ? `\n링크: https://114.unipost.co.kr/home.uni?access=list&srIdx=${r.ticket_no}` : '')
        );
        await db.query(
          `UPDATE deploy_schedules
           SET notified_times = array_append(COALESCE(notified_times, '{}'), $1)
           WHERE id=$2`,
          [r.mins, r.id]
        );
        log(`[반영일정] ${r.mins}분 전 알림 → ${r.registrant_name} (${r.title})`);
      }
    } catch (err) { log(`[크론] 오류: ${err.message}`); }
  }, { timezone: 'Asia/Seoul' });

  log('반영일정 알림 크론 등록 완료 (매분)');
}

// ── 시작 ───────────────────────────────────────────────────────
async function init() {
  log('서버 초기화 중...');
  await loadMembers();
  initDeployCron();
  app.listen(PORT, () => log(`UniSupport 서버 실행 중 (Port: ${PORT})`));
}

init().catch(err => { console.error('초기화 실패:', err.message); process.exit(1); });
