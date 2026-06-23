require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cron = require("node-cron");
const express = require("express");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ========== 설정 ==========
const TEAM_WEBHOOKS = JSON.parse(process.env.TEAM_WEBHOOKS || "[]");
const LOGIN_ID = process.env.LOGIN_ID;
const LOGIN_PW = process.env.LOGIN_PW;
const PORT = process.env.PORT || 3000;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

const PORTAL_BASE = "https://unipost.co.kr";
const UNICLOUD_BASE = "https://leave.unipost.co.kr";
const SESSION_KEEP_URL = `${UNICLOUD_BASE}/unicloud/view/avs-use-month-report`;
const TARGET_URL = `${UNICLOUD_BASE}/unicloud/avs/report/getMonthReportAvsUse`;
const ITEM_IDS = [
  "2673DED180C14058A5492AD0C6593D45", "01A614219FAE435E991B16B84956D5E4",
  "5F451BD3A3A042C889FDCD8334FE5826", "CC63430C4EB746E8BCF2629483F6C646",
  "B4D79AED292B8991E050E7DE961F6DAB", "B4D79AED292D8991E050E7DE961F6DAB",
  "2A65F1A08644427EB79313D8DED9F5DA",
];

const GW_BASE = "https://gw.unipost.co.kr";
const GW_SESSION_URL = `${GW_BASE}/unicloud/view/gw-equip-reservation`;
const GW_TARGET_URL = `${GW_BASE}/unicloud/gw/equipReservation/getFolderReservation`;
const EQUIP_LIST = [ { seq: "7", name: "중회의실(에땅)" }, { seq: "8", name: "대회의실(에땅)" } ];

const SNAPSHOT_PATH = path.join(__dirname, "snapshot.json");
const LOG_PATH = path.join(__dirname, "server.log");
// ==========================

let avsCookie = "";
let gwCookie = "";
let prevVacationSnapshot = { map: {}, sdate: "", edate: "", updatedAt: "" };
let prevRoomSnapshot = { map: {}, sdate: "", edate: "", updatedAt: "" };

const cache = { vacation: {}, room: {} };
const CACHE_TTL = 15 * 60 * 1000; // 10분마다 갱신되므로 15분 설정

// ========== 로그 및 유틸 ==========
function getLogTime() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `[${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}]`;
}

function logger(msg, isError = false) {
  const fullMsg = `${getLogTime()} ${msg}`;
  if (isError) console.error(fullMsg);
  else console.log(fullMsg);
  try { fs.appendFileSync(LOG_PATH, fullMsg + "\n", "utf8"); } catch (e) {}
}

app.use((req, res, next) => {
  logger(`[요청 감시] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

function saveSnapshot() {
  try {
    const data = JSON.stringify({ vacation: prevVacationSnapshot, room: prevRoomSnapshot, updatedAt: new Date().toISOString() }, null, 2);
    fs.writeFileSync(SNAPSHOT_PATH, data, "utf8");
  } catch (err) { logger(`스냅샷 저장 오류: ${err.message}`, true); }
}

function loadSnapshot() {
  try {
    if (fs.existsSync(SNAPSHOT_PATH)) {
      const data = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
      prevVacationSnapshot = data.vacation || { map: {} };
      prevRoomSnapshot = data.room || { map: {} };
      logger(`스냅샷 복구 완료 (마지막 확인: ${prevVacationSnapshot.updatedAt || "없음"})`);
    }
  } catch (err) { logger(`스냅샷 로드 오류: ${err.message}`, true); }
}

async function getSlackUserTeam(user_id) {
  if (!SLACK_BOT_TOKEN) {
    logger("[사용자 감지] SLACK_BOT_TOKEN이 설정되지 않아 팀 감지를 건너뜁니다.");
    return null;
  }
  try {
    const res = await axios.get(`https://slack.com/api/users.info?user=${user_id}`, { headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` } });
    if (!res.data.ok) {
      logger(`[사용자 감지] 슬랙 API 오류: ${res.data.error}`);
      return null;
    }
    const profile = res.data.user.profile;
    const nameStr = profile.display_name || profile.real_name || "";
    const match = nameStr.match(/\(([^)]+)\)/);
    const team = match ? match[1].trim() : null;
    
    if (team) logger(`[사용자 감지] 이름: "${nameStr}", 추출팀: "${team}"`);
    else logger(`[사용자 감지] 이름: "${nameStr}", 팀명 추출 실패 (괄호 없음)`);
    
    return team;
  } catch (err) { logger(`[사용자 감지] 에러: ${err.message}`, true); return null; }
}

function getToday() { return formatDate(new Date()); }
function formatDate(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function parseCookies(h) { return (h ?? []).map(c => c.split(";")[0]).join("; "); }
function mergeCookies(a, b) {
  const map = {};
  [...a.split("; "), ...b.split("; ")].forEach(c => { const i = c.indexOf("="); if (i > 0) map[c.slice(0, i).trim()] = c.slice(i + 1).trim(); });
  return Object.entries(map).map(([k, v]) => `${k}=${v}`).join("; ");
}
function formatTime(s, e) { return s && e ? ` (${s}:00 ~ ${e}:00)` : ""; }

// ========== 로그인 ==========
async function loginPortal() {
  const s1 = await axios.get(`${PORTAL_BASE}/portal/login/portal-login`, { headers: { "User-Agent": "Mozilla/5.0" }, maxRedirects: 0, validateStatus: s => s < 400 });
  let ck = parseCookies(s1.headers["set-cookie"]);
  const p = new URLSearchParams();
  p.append("loginType", "IDPWD"); p.append("loginId", LOGIN_ID); p.append("id", LOGIN_ID); p.append("password", LOGIN_PW); p.append("companyRegNo", "");
  const s2 = await axios.post(`${PORTAL_BASE}/portal/login/ajaxcheck`, p.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Cookie": ck, "Referer": `${PORTAL_BASE}/portal/login/portal-login`, "Origin": PORTAL_BASE, "ajax": "true", "User-Agent": "Mozilla/5.0" },
    maxRedirects: 0, validateStatus: s => s < 400
  });
  const c2 = parseCookies(s2.headers["set-cookie"]); if (c2) ck = mergeCookies(ck, c2);
  if (!s2.data?.response?.success) throw new Error("로그인 실패");
  return ck;
}

async function getSsoSession(ck, portalPath, base) {
  const s3 = await axios.get(`${PORTAL_BASE}${portalPath}`, { headers: { "Cookie": ck, "Referer": `${PORTAL_BASE}/portal/login/portal-login`, "User-Agent": "Mozilla/5.0" }, maxRedirects: 0, validateStatus: s => s < 400 });
  const c3 = parseCookies(s3.headers["set-cookie"]); if (c3) ck = mergeCookies(ck, c3);
  const ssoUrl = s3.headers["location"]; if (!ssoUrl?.includes("sso-in")) throw new Error(`SSO URL 없음: ${ssoUrl}`);
  const s4a = await axios.get(ssoUrl, { headers: { "Cookie": ck, "Referer": PORTAL_BASE, "User-Agent": "Mozilla/5.0" }, maxRedirects: 0, validateStatus: s => s < 400 });
  const c4a = parseCookies(s4a.headers["set-cookie"]); if (c4a) ck = mergeCookies(ck, c4a);
  let nextUrl = s4a.headers["location"]; if (nextUrl && !nextUrl.startsWith("http")) nextUrl = `${base}${nextUrl}`;
  if (nextUrl) {
    const s4b = await axios.get(nextUrl, { headers: { "Cookie": ck, "Referer": ssoUrl, "User-Agent": "Mozilla/5.0" }, maxRedirects: 5, validateStatus: s => s < 400 });
    const c4b = parseCookies(s4b.headers["set-cookie"]); if (c4b) ck = mergeCookies(ck, c4b);
  }
  return ck;
}

async function loginAvs() { logger(`AVS 로그인 시작...`); const ck = await loginPortal(); avsCookie = await getSsoSession(ck, "/portal/avs?path=/unicloud/view/avs-dashboard", UNICLOUD_BASE); logger(`AVS 로그인 완료`); }
async function loginGw() { logger(`GW 로그인 시작...`); const ck = await loginPortal(); gwCookie = await getSsoSession(ck, "/portal/gw?path=/unicloud/view/gw-equip-reservation", GW_BASE); logger(`GW 로그인 완료`); }
async function loginAll() { await loginAvs(); await loginGw(); }

// ========== 데이터 연동 핵심 로직 ==========
async function fetchVacations(sdate, edate, useCache = false) {
  const cacheKey = `${sdate}~${edate}`;
  if (useCache) {
    if (cache.vacation[cacheKey] && (Date.now() - cache.vacation[cacheKey].updatedAt < CACHE_TTL)) return cache.vacation[cacheKey].data;
    if (prevVacationSnapshot.sdate && prevVacationSnapshot.edate && sdate >= prevVacationSnapshot.sdate && edate <= prevVacationSnapshot.edate) {
      return Object.values(prevVacationSnapshot.map || {}).filter(item => (item.useSdate ?? "") <= edate && sdate <= (item.useEdate ?? ""));
    }
  }
  if (!avsCookie) await loginAvs();
  const res = await axios.post(TARGET_URL, { coRegno: "1048621562", sSdate: sdate, sEdate: edate, itemIds: ITEM_IDS, userStatus: "10", procSts: "S" }, {
    headers: { "Content-Type": "application/json", "Cookie": avsCookie, "Origin": UNICLOUD_BASE, "Referer": SESSION_KEEP_URL, "ajax": "true", "x-requested-with": "XMLHttpRequest", "__service_id__": "AVS", "__view_id__": "avs-use-month-report", "__req_co_regno__": "1048621562", "__req_us_id__": LOGIN_ID, "User-Agent": "Mozilla/5.0" },
  });
  if (res.status === 900 || (typeof res.data === "string" && res.data.includes("<!DOCTYPE"))) { await loginAvs(); return fetchVacations(sdate, edate, false); }
  const result = (res.data?.response ?? []).filter(item => (item.useSdate ?? "") <= edate && sdate <= (item.useEdate ?? ""))
    .map(item => ({ usName: item.usName, deptName: item.deptName, timeUnitName: item.timeUnitName, useSdate: item.useSdate, useEdate: item.useEdate, useTimeTypeName: item.useTimeTypeName ?? null, useTimeType: item.useTimeType ?? null, useStime: item.useStime ?? null, useEtime: item.useEtime ?? null }));
  cache.vacation[cacheKey] = { data: result, updatedAt: Date.now() };
  logger(`휴가 데이터 수신 (${sdate}~${edate}, ${result.length}명)`);
  return result;
}

async function fetchRooms(sdate, edate, useCache = false) {
  const cacheKey = `${sdate}~${edate}`;
  if (useCache) {
    if (cache.room[cacheKey] && (Date.now() - cache.room[cacheKey].updatedAt < CACHE_TTL)) return cache.room[cacheKey].data;
    if (prevRoomSnapshot.sdate && prevRoomSnapshot.edate && sdate >= prevRoomSnapshot.sdate && edate <= prevRoomSnapshot.edate) {
      return Object.values(prevRoomSnapshot.map || {}).filter(item => { const d = item.start?.slice(0, 10); return d >= sdate && d <= edate; });
    }
  }
  if (!gwCookie) await loginGw();
  const res = await axios.post(GW_TARGET_URL, { useMyReservation: false, activeStart: sdate, activeEnd: edate, labels: ["1"], equipSeqList: EQUIP_LIST.map(e => e.seq) }, {
    headers: { "Content-Type": "application/json", "Cookie": gwCookie, "Origin": GW_BASE, "Referer": GW_SESSION_URL, "ajax": "true", "x-requested-with": "XMLHttpRequest", "__service_id__": "GW", "__view_id__": "gw-equip-reservation", "__menu_id__": "GW080010", "User-Agent": "Mozilla/5.0" },
  });
  if (res.status === 900 || (typeof res.data === "string" && res.data.includes("<!DOCTYPE"))) { await loginGw(); return fetchRooms(sdate, edate, false); }
  const result = (res.data?.response ?? []).filter(item => (item.start?.slice(0, 10) ?? "") >= sdate && (item.start?.slice(0, 10) ?? "") <= edate);
  cache.room[cacheKey] = { data: result, updatedAt: Date.now() };
  logger(`회의실 데이터 수신 (${sdate}~${edate}, ${result.length}건)`);
  return result;
}

// 10분 주기 동기화 & 변동 감지
async function syncAndCheckChanges(isManual = false) {
  try {
    const mode = isManual ? "수동 업데이트" : "정기 체크(10분)";
    logger(`${mode} 시작...`);
    
    const today = getToday();
    const sixtyDaysLater = formatDate(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));

    // 900 에러 시 재로그인 후 재시도
    let vList, rList;
    try {
      [vList, rList] = await Promise.all([ fetchVacations(today, sixtyDaysLater, false), fetchRooms(today, today, false) ]);
    } catch (e) {
      if (e.response?.status === 900 || e.message?.includes("900")) {
        logger("세션 만료 감지 - 재로그인 후 재시도");
        await loginAll();
        [vList, rList] = await Promise.all([ fetchVacations(today, sixtyDaysLater, false), fetchRooms(today, today, false) ]);
      } else {
        throw e;
      }
    }

    // 1. 휴가 변동 체크
    const vKey = i => `${i.usName}_${i.deptName}_${i.timeUnitName}_${i.useTimeType ?? ""}_${i.useSdate ?? ""}`;
    const vCurrMap = {}; vList.forEach(i => { vCurrMap[vKey(i)] = i; });
    
    if (prevVacationSnapshot.map && Object.keys(prevVacationSnapshot.map).length > 0) {
      const added = vList.filter(i => !prevVacationSnapshot.map[vKey(i)]);
      const removed = Object.values(prevVacationSnapshot.map).filter(i => !vCurrMap[vKey(i)]);
      
      if (added.length || removed.length) {
        logger(`[변동 감지] 휴가 변경 사항이 발견되었습니다. (추가: ${added.length}, 취소: ${removed.length})`);
        const formatItem = (m) => `*${m.usName}* (${m.deptName}) ${m.useSdate} ${m.timeUnitName}${m.useTimeTypeName ? " "+m.useTimeTypeName : ""}${(m.timeUnitName === "시간" && m.useStime) ? ` (${m.useStime}:00~${m.useEtime}:00)` : ""}`;
        
        for (const { teams, webhook } of TEAM_WEBHOOKS) {
          const teamAdded = added.filter(i => teams.includes(i.deptName));
          const teamRemoved = removed.filter(i => teams.includes(i.deptName));
          if (!teamAdded.length && !teamRemoved.length) continue;
          
          const blocks = [ { type: "header", text: { type: "plain_text", text: `휴가 변동사항 알림` } }, { type: "divider" } ];
          if (teamAdded.length) { 
            teamAdded.forEach(m => logger(`  + [추가] ${m.usName}(${m.deptName}) ${m.useSdate}`));
            blocks.push({ type: "section", text: { type: "mrkdwn", text: teamAdded.map(m => `+ ${formatItem(m)} 추가`).join("\n") } }); 
          }
          if (teamRemoved.length) { 
            teamRemoved.forEach(m => logger(`  - [취소] ${m.usName}(${m.deptName}) ${m.useSdate}`));
            blocks.push({ type: "section", text: { type: "mrkdwn", text: teamRemoved.map(m => `- ${formatItem(m)} 취소`).join("\n") } }); 
          }
          blocks.push(buildFooter());
          await axios.post(webhook, { blocks });
        }
      } else { logger(`[변동 감지] 휴가 변동 사항 없음`); }
    }

    // 2. 회의실 변동 체크
    const rCurrMap = {}; rList.forEach(i => { rCurrMap[i.id] = i; });
    if (prevRoomSnapshot.map && Object.keys(prevRoomSnapshot.map).length > 0) {
      const added = rList.filter(i => !prevRoomSnapshot.map[i.id]);
      const removed = Object.values(prevRoomSnapshot.map).filter(i => !rCurrMap[i.id]);
      
      if (added.length || removed.length) {
        logger(`[변동 감지] 회의실 변경 사항이 발견되었습니다. (추가: ${added.length}, 취소: ${removed.length})`);
        for (const { webhook } of TEAM_WEBHOOKS) {
          const blocks = [ { type: "header", text: { type: "plain_text", text: `회의실 예약 변동사항 알림` } }, { type: "divider" } ];
          if (added.length) { 
            added.forEach(m => logger(`  + [추가] ${m.equipName} | ${m.title}`));
            blocks.push({ type: "section", text: { type: "mrkdwn", text: added.map(m => `+ *${m.equipName}* | ${m.title} | ${m.reservatUsName} | ${m.start.slice(11, 16)} 추가`).join("\n") } }); 
          }
          if (removed.length) { 
            removed.forEach(m => logger(`  - [취소] ${m.equipName} | ${m.title}`));
            blocks.push({ type: "section", text: { type: "mrkdwn", text: removed.map(m => `- *${m.equipName}* | ${m.title} | ${m.reservatUsName} | ${m.start.slice(11, 16)} 취소`).join("\n") } }); 
          }
          blocks.push(buildFooter());
          await axios.post(webhook, { blocks });
        }
      } else { logger(`[변동 감지] 회의실 변동 사항 없음`); }
    }

    // 스냅샷 갱신
    const hasVacationChange = vList.some(i => !prevVacationSnapshot.map?.[vKey(i)]) || Object.values(prevVacationSnapshot.map || {}).some(i => !vCurrMap[vKey(i)]);
    const hasRoomChange = rList.some(i => !prevRoomSnapshot.map?.[i.id]) || Object.values(prevRoomSnapshot.map || {}).some(i => !rCurrMap[i.id]);

    prevVacationSnapshot = { map: vCurrMap, sdate: today, edate: sixtyDaysLater, updatedAt: new Date().toISOString() };
    prevRoomSnapshot = { map: rCurrMap, sdate: today, edate: today, updatedAt: new Date().toISOString() };

    // 변동 있을 때만 캐시 초기화
    if (hasVacationChange || isManual) { cache.vacation = {}; logger("휴가 캐시 초기화"); }
    if (hasRoomChange || isManual) { cache.room = {}; logger("회의실 캐시 초기화"); }

    saveSnapshot();
    
    logger(`${mode} 완료`);
    return true;
  } catch (err) { logger(`체크 실패: ${err.message}`, true); return false; }
}

// ========== 메시지 빌더 ==========
function buildFooter() {
  const lastCheck = prevVacationSnapshot.updatedAt ? new Date(prevVacationSnapshot.updatedAt).toLocaleString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true }) : "기록 없음";
  return { type: "context", elements: [ { type: "mrkdwn", text: `마지막 데이터 확인: ${lastCheck} | \`/휴가 업데이트\`로 즉시 갱신` } ] };
}

function buildVacationMessage(date, list, title, showDate = false, groupTeams = null) {
  const headerText = title ?? `${date} 오늘의 휴가자 (총 ${list.length}명)`;
  if (list.length === 0) return { text: headerText, blocks: [ { type: "header", text: { type: "plain_text", text: headerText } }, { type: "section", text: { type: "mrkdwn", text: "휴가자가 없습니다." } }, buildFooter() ] };
  const blocks = [ { type: "header", text: { type: "plain_text", text: headerText } }, { type: "divider" } ];
  const formatItem = (m) => `• *${m.usName}* (${m.deptName}) ${m.useSdate} ${m.timeUnitName}${m.useTimeTypeName ? " "+m.useTimeTypeName : ""}${formatTime(m.useStime, m.useEtime)}`;
  if (groupTeams) {
    for (const group of groupTeams) {
      const gList = list.filter(i => group.teams.includes(i.deptName));
      if (gList.length === 0) continue;
      blocks.push({ type: "section", text: { type: "mrkdwn", text: `*${group.teams.join(", ")}* (총 ${gList.length}명)\n${gList.map(formatItem).join("\n")}` } });
      blocks.push({ type: "divider" });
    }
  } else if (showDate) {
    // 날짜별 그룹핑 로직 등... (생략 및 유지)
    const lines = list.map(formatItem).join("\n");
    blocks.push({ type: "section", text: { type: "mrkdwn", text: lines } });
  } else {
    const lines = list.map(formatItem).join("\n");
    blocks.push({ type: "section", text: { type: "mrkdwn", text: lines } });
  }
  blocks.push(buildFooter());
  return { blocks };
}

function buildRoomMessage(sdate, list, edate = null) {
  const isRange = edate && edate !== sdate; const headerDate = isRange ? `${sdate} ~ ${edate}` : sdate;
  const blocks = [ { type: "header", text: { type: "plain_text", text: `${headerDate} 회의실 예약 현황 (총 ${list.length}건)` } }, { type: "divider" } ];
  if (list.length === 0) blocks.push({ type: "section", text: { type: "mrkdwn", text: "예약이 없습니다." } });
  else {
    const lines = list.sort((a,b) => a.start.localeCompare(b.start)).map(m => `• ${m.start.slice(11, 16)} ~ ${m.end.slice(11, 16)} | *${m.equipName}* | ${m.title} | ${m.reservatUsName}`).join("\n");
    blocks.push({ type: "section", text: { type: "mrkdwn", text: lines } });
  }
  blocks.push(buildFooter());
  return { blocks };
}

// ========== 슬래시 커맨드 ==========
app.post("/slack/command", async (req, res) => {
  logger(`>>> [커맨드 요청 발생]`);
  logger(`[요청 바디] ${JSON.stringify(req.body)}`);

  const { command, text, response_url, channel_id, user_id } = req.body;
  logger(`[해석] ${command} ${text} (채널: ${channel_id}, 사용자: ${user_id})`);

  const keyword = text?.trim().toLowerCase() ?? "";
  if (keyword === "업데이트" || keyword === "갱신" || keyword === "refresh") {
    res.json({ response_type: "ephemeral", text: "실시간 동기화를 시작합니다..." });
    const success = await syncAndCheckChanges(true);
    if (response_url) await axios.post(response_url, { response_type: "ephemeral", text: success ? "최신 데이터로 동기화되었습니다!" : "동기화에 실패했습니다." });
    return;
  }
  const normalizeDate = (d) => /^\d{8}$/.test(d) ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}` : d;
  let sdate, edate, isRange = false;
  if (keyword === "" || keyword === "오늘") { sdate = edate = getToday(); }
  else if (keyword === "내일") { 
    const d = new Date(); d.setDate(d.getDate() + 1); sdate = edate = formatDate(d);
  } else if (keyword === "이번주") { 
    const dates = (()=>{ const d = new Date(); const mon = new Date(d); mon.setDate(d.getDate() - d.getDay() + 1); return Array.from({length:5},(_,i)=>{ const nd = new Date(mon); nd.setDate(mon.getDate()+i); return formatDate(nd); }); })();
    sdate = dates[0]; edate = dates[4]; isRange = true; 
  } else {
    const raw = keyword.replace(/[\[\]()]/g, "").replace(/\//g, "-").replace(/\./g, "-").replace(/\s+/g, "").trim();
    const rangeDate = /^(\d{4}-\d{2}-\d{2})[~](\d{4}-\d{2}-\d{2})$/;
    if (rangeDate.test(raw)) { const [, s, e] = raw.match(rangeDate); sdate = normalizeDate(s); edate = normalizeDate(e); isRange = true; }
    else if (/^\d{4}-\d{2}-\d{2}$/.test(normalizeDate(raw))) { sdate = edate = normalizeDate(raw); }
    else {
      return res.json({
        response_type: "ephemeral",
        text: [
          "입력 형식이 올바르지 않습니다.",
          "",
          "*키워드*",
          `${command} 오늘 / 내일 / 이번주 / 다음주`,
          `${command} 업데이트 (최신 데이터 강제 동기화)`,
          "",
          "*날짜 직접 입력*",
          `${command} 2026-03-25`,
          `${command} 2026-03-23~2026-03-27`,
          "",
          "*지원 형식*",
          "2026-03-25 / 2026.03.25 / 2026/03/25 / [2026-03-25]",
        ].join("\n"),
      });
    }
  }
  res.json({ response_type: "ephemeral", text: "조회 중..." });
  try {
    let message;
    if (command === "/휴가") {
      const list = await fetchVacations(sdate, edate, true);
      const matchedTeam = TEAM_WEBHOOKS.find(t => t.channel_id === channel_id);
      if (matchedTeam) {
        message = buildVacationMessage(sdate, list.filter(i => matchedTeam.teams.includes(i.deptName)), `${sdate} 휴가자`, isRange);
      } else {
        const uTeam = await getSlackUserTeam(user_id);
        const mTeam = uTeam ? TEAM_WEBHOOKS.find(t => t.teams.includes(uTeam)) : null;
        if (mTeam) message = buildVacationMessage(sdate, list.filter(i => mTeam.teams.includes(i.deptName)), `${sdate} 휴가자`, isRange);
        else message = buildVacationMessage(sdate, list.filter(i => TEAM_WEBHOOKS.some(t => t.teams.includes(i.deptName))), `${sdate} 전체 휴가자`, isRange, TEAM_WEBHOOKS);
      }
    } else if (command === "/회의실") {
      const list = await fetchRooms(sdate, edate, true);
      message = buildRoomMessage(sdate, list, edate);
    }
    if (message && response_url) await axios.post(response_url, { ...message, response_type: "ephemeral", replace_original: false });
  } catch (err) { logger(`[커맨드 오류] ${err.message}`, true); }
});

// 스케줄
cron.schedule("*/10 * * * *", () => syncAndCheckChanges(false), { timezone: "Asia/Seoul" });
cron.schedule("0 9 * * 1", async () => { const d = (()=>{ const d = new Date(); const mon = new Date(d); mon.setDate(d.getDate() - d.getDay() + 1); return Array.from({length:5},(_,i)=>{ const nd = new Date(mon); nd.setDate(mon.getDate()+i); return formatDate(nd); }); })(); const list = await fetchVacations(d[0], d[4], true); for (const { teams, webhook } of TEAM_WEBHOOKS) await axios.post(webhook, buildVacationMessage(d[0], list.filter(i => teams.includes(i.deptName)), "이번주 휴가자", true)); }, { timezone: "Asia/Seoul" });
cron.schedule("0 9 * * 2-5", async () => { const t = getToday(); const list = await fetchVacations(t, t, true); for (const { teams, webhook } of TEAM_WEBHOOKS) await axios.post(webhook, buildVacationMessage(t, list.filter(i => teams.includes(i.deptName)))); }, { timezone: "Asia/Seoul" });
cron.schedule("0 9 * * 1-5", async () => { const t = getToday(); const list = await fetchRooms(t, t, true); for (const { webhook } of TEAM_WEBHOOKS) await axios.post(webhook, buildRoomMessage(t, list)); }, { timezone: "Asia/Seoul" });
cron.schedule("*/10 * * * *", async () => {
  try {
    const r = await axios.get(SESSION_KEEP_URL, { headers: { Cookie: avsCookie }, validateStatus: s => true });
    if (r.status === 900 || (typeof r.data === "string" && r.data.includes("<!DOCTYPE"))) {
      logger("AVS 세션 만료 감지 - 재로그인");
      await loginAvs();
    } else {
      logger("AVS 세션 유지 ping 성공");
    }
  } catch (e) { logger(`AVS ping 실패 - 재로그인: ${e.message}`, true); await loginAvs().catch(e => logger(`AVS 재로그인 실패: ${e.message}`, true)); }
  try {
    const r = await axios.get(GW_SESSION_URL, { headers: { Cookie: gwCookie }, validateStatus: s => true });
    if (r.status === 900 || (typeof r.data === "string" && r.data.includes("<!DOCTYPE"))) {
      logger("GW 세션 만료 감지 - 재로그인");
      await loginGw();
    } else {
      logger("GW 세션 유지 ping 성공");
    }
  } catch (e) { logger(`GW ping 실패 - 재로그인: ${e.message}`, true); await loginGw().catch(e => logger(`GW 재로그인 실패: ${e.message}`, true)); }
});

async function init() {
  logger(`서버 초기화 중...`); loadSnapshot(); await loginAll();
  const isOld = !prevVacationSnapshot.updatedAt || (Date.now() - new Date(prevVacationSnapshot.updatedAt).getTime() > 10 * 60 * 1000);
  if (isOld) await syncAndCheckChanges(); else logger(`최신 스냅샷(10분 이내)이 존재하여 초기 동기화를 건너뜁니다.`);
  app.listen(PORT, () => logger(`서버 실행 중 (Port: ${PORT})`));
}
init().catch(err => { logger(`초기화 실패: ${err.message}`, true); process.exit(1); });
