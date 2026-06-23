/**
 * 1회성 마이그레이션: 기존 JSON 파일 → PostgreSQL
 * 실행: node migrate.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./db');

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DEFAULT_CRON_SETTINGS = [
  { id: "sync",           label: "10분 동기화",        schedule: "*/10 * * * *",     enabled: true, noTimezone: true },
  { id: "vacationWeekly", label: "이번주 휴가 (월)",    schedule: "0 9 * * 1",        enabled: true },
  { id: "vacationDaily",  label: "오늘 휴가 (화-금)",   schedule: "0 9 * * 2-5",      enabled: true },
  { id: "roomDaily",      label: "오늘 회의실",          schedule: "0 9 * * 1-5",      enabled: true },
  { id: "commute",        label: "출근 알림",            schedule: "3,4,5 9 * * 1-5", enabled: true },
  { id: "monthlyCommute", label: "월말 출근 리포트 (월)", schedule: "0 9 * * 1",       enabled: true },
  { id: "sessionKeep",    label: "세션 유지 (30분)",     schedule: "*/30 * * * *",     enabled: true, noTimezone: true },
  { id: "logReset",       label: "로그 초기화 (월)",     schedule: "0 0 * * 1",        enabled: true },
];

function readJson(filename) {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) { console.log(`[스킵] ${filename} 없음`); return null; }
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

async function migrateMembers() {
  const members = readJson('members.json');
  if (!members?.length) return;
  for (const m of members) {
    await db.query(
      `INSERT INTO users (us_id, us_name, dept_id, dept_name, slack_id, is_leader, notify_commute, notify_vacation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (us_id) DO UPDATE SET
         slack_id         = EXCLUDED.slack_id,
         is_leader        = EXCLUDED.is_leader,
         notify_commute   = EXCLUDED.notify_commute,
         notify_vacation  = EXCLUDED.notify_vacation,
         updated_at       = NOW()`,
      [
        m.slackId,          // us_id로 slack ID 사용 (us_id가 없으므로 임시)
        m.name,
        m.deptId || '',
        m.teamName || '',
        m.slackId || null,
        m.isLeader === true,
        m.notify?.commute !== false,
        m.notify?.vacation !== false,
      ]
    );
  }
  console.log(`[완료] members.json → users 테이블 (${members.length}명)`);
}

async function migrateTeams() {
  const teams = readJson('teams.json');
  if (!teams?.length) return;
  await db.query('DELETE FROM teams');
  for (const t of teams) {
    await db.query(
      `INSERT INTO teams (dept_id, team_names, webhook_url, channel_id, notify_settings, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        t.deptId || '',
        t.teams,
        t.webhook,
        t.channel_id || '',
        JSON.stringify(t.notify || {}),
        t.enabled !== false,
      ]
    );
  }
  console.log(`[완료] teams.json → teams 테이블 (${teams.length}팀)`);
}

async function migrateSettings() {
  const settings = readJson('settings.json');
  const crons = settings?.crons ?? DEFAULT_CRON_SETTINGS;

  for (const def of DEFAULT_CRON_SETTINGS) {
    const saved = crons.find(c => c.id === def.id) ?? def;
    await db.query(
      `INSERT INTO cron_settings (task_id, label, schedule, is_enabled, no_timezone)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (task_id) DO UPDATE SET
         schedule    = EXCLUDED.schedule,
         is_enabled  = EXCLUDED.is_enabled,
         no_timezone = EXCLUDED.no_timezone`,
      [def.id, def.label, saved.schedule ?? def.schedule, saved.enabled ?? def.enabled, saved.noTimezone ?? def.noTimezone ?? false]
    );
  }

  if (settings?.slackBotToken) {
    await db.query(
      `INSERT INTO app_settings (key, value) VALUES ('slackBotToken', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [settings.slackBotToken]
    );
  }
  console.log(`[완료] settings.json → cron_settings / app_settings`);
}

async function migrateSnapshot() {
  const snap = readJson('snapshot.json');
  if (!snap) return;
  await db.query(
    `INSERT INTO snapshots (id, vacation_data, room_data, updated_at)
     VALUES ('main', $1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET
       vacation_data = EXCLUDED.vacation_data,
       room_data     = EXCLUDED.room_data,
       updated_at    = EXCLUDED.updated_at`,
    [
      JSON.stringify(snap.vacation ?? {}),
      JSON.stringify(snap.room ?? {}),
      snap.updatedAt ?? new Date().toISOString(),
    ]
  );
  console.log(`[완료] snapshot.json → snapshots 테이블`);
}

async function main() {
  console.log('마이그레이션 시작...');
  await migrateMembers();
  await migrateTeams();
  await migrateSettings();
  await migrateSnapshot();
  console.log('마이그레이션 완료');
  await db.pool.end();
}

main().catch(err => { console.error('마이그레이션 실패:', err.message); process.exit(1); });
