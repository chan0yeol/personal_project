const axios = require('axios');
const db = require('./db');
const { loginAvs, loginGw, UNICLOUD_BASE, GW_BASE } = require('./login');

// ── 상수 ──────────────────────────────────────────────────────
const TARGET_URL   = `${UNICLOUD_BASE}/unicloud/avs/report/getMonthReportAvsUse`;
const COMMUTE_URL  = `${UNICLOUD_BASE}/unicloud/avs/commute/status/getCommuteMonthDetail`;
const GW_TARGET_URL = `${GW_BASE}/unicloud/gw/equipReservation/getFolderReservation`;
const GW_SESSION_URL = `${GW_BASE}/unicloud/view/gw-equip-reservation`;
const SESSION_KEEP_URL = `${UNICLOUD_BASE}/unicloud/view/avs-use-month-report`;

const ITEM_IDS = [
  '2673DED180C14058A5492AD0C6593D45', '01A614219FAE435E991B16B84956D5E4',
  '5F451BD3A3A042C889FDCD8334FE5826', 'CC63430C4EB746E8BCF2629483F6C646',
  'B4D79AED292B8991E050E7DE961F6DAB', 'B4D79AED292D8991E050E7DE961F6DAB',
  '2A65F1A08644427EB79313D8DED9F5DA',
];
const EQUIP_LIST = [{ seq: '7', name: '중회의실(에땅)' }, { seq: '8', name: '대회의실(에땅)' }];

// ── 세션 ──────────────────────────────────────────────────────
let avsCookie = '';
let gwCookie  = '';

async function ensureAvs() {
  if (!avsCookie) avsCookie = await loginAvs();
}
async function ensureGw() {
  if (!gwCookie) gwCookie = await loginGw();
}

async function keepSessions() {
  try {
    await axios.get(SESSION_KEEP_URL, { headers: { Cookie: avsCookie }, validateStatus: () => true });
  } catch {
    avsCookie = '';
    await ensureAvs().catch(() => {});
  }
  try {
    await axios.get(GW_SESSION_URL, { headers: { Cookie: gwCookie }, validateStatus: () => true });
  } catch {
    gwCookie = '';
    await ensureGw().catch(() => {});
  }
}

// ── 유틸 ──────────────────────────────────────────────────────
function getToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── 휴가 ──────────────────────────────────────────────────────
async function fetchVacations(sdate, edate, retry = 0) {
  await ensureAvs();
  const res = await axios.post(TARGET_URL, {
    coRegno: '1048621562', sSdate: sdate, sEdate: edate, itemIds: ITEM_IDS, userStatus: '10', procSts: 'S',
  }, {
    headers: {
      'Content-Type': 'application/json', 'Cookie': avsCookie,
      'Origin': UNICLOUD_BASE, 'Referer': SESSION_KEEP_URL,
      'ajax': 'true', 'x-requested-with': 'XMLHttpRequest',
      '__service_id__': 'AVS', '__view_id__': 'avs-use-month-report',
      '__req_co_regno__': '1048621562', '__req_us_id__': process.env.LOGIN_ID, 'User-Agent': 'Mozilla/5.0',
    },
    validateStatus: s => s < 1000,
  });
  if (res.status === 900 || (typeof res.data === 'string' && res.data.includes('<!DOCTYPE'))) {
    if (retry >= 3) throw new Error('AVS 세션 재로그인 3회 초과');
    avsCookie = await loginAvs();
    return fetchVacations(sdate, edate, retry + 1);
  }
  return (res.data?.response ?? []).filter(i => (i.useSdate ?? '') <= edate && sdate <= (i.useEdate ?? ''));
}

async function upsertVacations(list) {
  for (const v of list) {
    if (!v.usName || !v.useSdate) continue;
    await db.query(
      `INSERT INTO vacations
         (us_name, dept_name, time_unit_name, use_time_type, use_time_type_name, use_sdate, use_edate, use_stime, use_etime)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (us_name, dept_name, time_unit_name, use_time_type, use_sdate, use_stime) DO UPDATE SET
         use_edate=EXCLUDED.use_edate, use_etime=EXCLUDED.use_etime, synced_at=NOW()`,
      [v.usName, v.deptName||'', v.timeUnitName||'', v.useTimeType||'', v.useTimeTypeName||null,
       v.useSdate, v.useEdate||null, v.useStime||'', v.useEtime||null]
    ).catch(e => console.error(`[UPSERT 휴가] ${v.usName}: ${e.message}`));
  }
}

// ── 회의실 ────────────────────────────────────────────────────
async function fetchRooms(sdate, edate, retry = 0) {
  await ensureGw();
  const res = await axios.post(GW_TARGET_URL, {
    useMyReservation: false, activeStart: sdate, activeEnd: edate,
    labels: ['1'], equipSeqList: EQUIP_LIST.map(e => e.seq),
  }, {
    headers: {
      'Content-Type': 'application/json', 'Cookie': gwCookie,
      'Origin': GW_BASE, 'Referer': GW_SESSION_URL,
      'ajax': 'true', 'x-requested-with': 'XMLHttpRequest',
      '__service_id__': 'GW', '__view_id__': 'gw-equip-reservation', '__menu_id__': 'GW080010',
      'User-Agent': 'Mozilla/5.0',
    },
    validateStatus: s => s < 1000,
  });
  if (res.status === 900 || (typeof res.data === 'string' && res.data.includes('<!DOCTYPE'))) {
    if (retry >= 3) throw new Error('GW 세션 재로그인 3회 초과');
    gwCookie = await loginGw();
    return fetchRooms(sdate, edate, retry + 1);
  }
  return (res.data?.response ?? []).filter(i => (i.start?.slice(0,10) ?? '') >= sdate && (i.start?.slice(0,10) ?? '') <= edate);
}

async function upsertRooms(list) {
  for (const r of list) {
    if (!r.id) continue;
    await db.query(
      `INSERT INTO room_bookings (booking_id, room_name, title, booker, book_date, start_time, end_time)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (booking_id) DO UPDATE SET
         title=EXCLUDED.title, start_time=EXCLUDED.start_time, end_time=EXCLUDED.end_time, synced_at=NOW()`,
      [String(r.id), r.equipName||'', r.title||'', r.reservatUsName||'', r.start?.slice(0,10)||null, r.start||null, r.end||null]
    ).catch(e => console.error(`[UPSERT 회의실] ${r.id}: ${e.message}`));
  }
}

// ── 출퇴근 ────────────────────────────────────────────────────
async function fetchCommuteStatus(date, deptId, retry = 0) {
  await ensureAvs();
  const dateStr = date.replace(/-/g, '');
  const res = await axios.post(COMMUTE_URL, {
    deptId, usId: '', sDate: dateStr, eDate: dateStr,
    workTypeIds: ['FIXED', 'FIXED_WEEKDAY', 'FLEX'],
  }, {
    headers: {
      'Content-Type': 'application/json', 'Cookie': avsCookie,
      'Origin': UNICLOUD_BASE, 'Referer': `${UNICLOUD_BASE}/unicloud/view/avs-commute-calendar`,
      'ajax': 'true', 'x-requested-with': 'XMLHttpRequest',
      '__service_id__': 'AVS', '__view_id__': 'avs-commute-calendar', '__menu_id__': 'MAV1200',
      '__req_co_regno__': '1048621562', '__req_us_id__': process.env.LOGIN_ID, 'User-Agent': 'Mozilla/5.0',
    },
    validateStatus: s => s < 1000,
  });
  if (res.status === 900 || (typeof res.data === 'string' && res.data.includes('<!DOCTYPE'))) {
    if (retry >= 3) throw new Error('출퇴근 세션 재로그인 3회 초과');
    avsCookie = await loginAvs();
    return fetchCommuteStatus(date, deptId, retry + 1);
  }
  const weekList = res.data?.response?.avsCommuteWeekList ?? [];
  const typeMap  = Object.fromEntries((res.data?.response?.avsCommuteTypeList ?? []).map(t => [t.usId, t]));
  return weekList.map(r => ({ ...r, deptId: typeMap[r.usId]?.deptId || r.deptId, deptName: typeMap[r.usId]?.deptName || r.deptName }));
}

async function fetchCommuteRange(sdate, edate, deptId, retry = 0) {
  await ensureAvs();
  const res = await axios.post(COMMUTE_URL, {
    deptId, usId: '',
    sDate: sdate.replace(/-/g, ''),
    eDate: edate.replace(/-/g, ''),
    workTypeIds: ['FIXED', 'FIXED_WEEKDAY', 'FLEX'],
  }, {
    headers: {
      'Content-Type': 'application/json', 'Cookie': avsCookie,
      'Origin': UNICLOUD_BASE, 'Referer': `${UNICLOUD_BASE}/unicloud/view/avs-commute-calendar`,
      'ajax': 'true', 'x-requested-with': 'XMLHttpRequest',
      '__service_id__': 'AVS', '__view_id__': 'avs-commute-calendar', '__menu_id__': 'MAV1200',
      '__req_co_regno__': '1048621562', '__req_us_id__': process.env.LOGIN_ID, 'User-Agent': 'Mozilla/5.0',
    },
    validateStatus: s => s < 1000,
  });
  if (res.status === 900 || (typeof res.data === 'string' && res.data.includes('<!DOCTYPE'))) {
    if (retry >= 3) throw new Error('출퇴근 세션 재로그인 3회 초과');
    avsCookie = await loginAvs();
    return fetchCommuteRange(sdate, edate, deptId, retry + 1);
  }
  const weekList = res.data?.response?.avsCommuteWeekList ?? [];
  const typeMap  = Object.fromEntries((res.data?.response?.avsCommuteTypeList ?? []).map(t => [t.usId, t]));
  return weekList.map(r => ({ ...r, deptId: typeMap[r.usId]?.deptId || r.deptId, deptName: typeMap[r.usId]?.deptName || r.deptName }));
}

async function upsertCommuteRecords(list) {
  const parseHHMM  = v => (v && /^\d{4}$/.test(v)) ? parseInt(v.slice(0,2)) * 60 + parseInt(v.slice(2,4)) : null;
  const parseDate8 = v => (v && v.length === 8) ? `${v.slice(0,4)}-${v.slice(4,6)}-${v.slice(6,8)}` : null;
  for (const r of list) {
    if (!r.usName || !r.workDate) continue;
    const deptId   = r.deptId || '';
    const workDate = `${r.workDate.slice(0,4)}-${r.workDate.slice(4,6)}-${r.workDate.slice(6,8)}`;
    await db.query(
      `INSERT INTO commute_records
         (dept_id, us_id, name, work_date, scheduled_start_time, scheduled_end_time,
          actual_start_time, actual_end_time, work_minutes, break_minutes,
          is_late, is_early_leave, is_absent, start_place_name, start_device_name, end_device_name,
          time_unit, time_unit_name, vac_sdate, vac_edate, vac_stime, vac_etime)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       ON CONFLICT (dept_id, name, work_date) DO UPDATE SET
         actual_start_time = EXCLUDED.actual_start_time,
         actual_end_time   = EXCLUDED.actual_end_time,
         work_minutes      = EXCLUDED.work_minutes,
         break_minutes     = EXCLUDED.break_minutes,
         is_late           = EXCLUDED.is_late,
         is_early_leave    = EXCLUDED.is_early_leave,
         is_absent         = EXCLUDED.is_absent,
         start_device_name = EXCLUDED.start_device_name,
         end_device_name   = EXCLUDED.end_device_name,
         time_unit         = EXCLUDED.time_unit,
         time_unit_name    = EXCLUDED.time_unit_name,
         vac_sdate         = EXCLUDED.vac_sdate,
         vac_edate         = EXCLUDED.vac_edate,
         vac_stime         = EXCLUDED.vac_stime,
         vac_etime         = EXCLUDED.vac_etime,
         synced_at         = NOW()`,
      [
        deptId, r.usId||null, r.usName, workDate,
        r.workStime||null, r.workEtime||null,
        r.workStartTime||null, r.workEndTime||null,
        parseHHMM(r.workTime), parseHHMM(r.breakTime),
        r.lateYn === 'Y', r.earlyLeaveYn === 'Y', r.absenceYn === 'Y',
        r.workStartPlaceName||null, r.workStartDeviceName||null, r.workEndDeviceName||null,
        r.timeUnit||null, r.timeUnitName||null,
        parseDate8(r.useSdate), parseDate8(r.useEdate),
        r.useStime||null, r.useEtime||null,
      ]
    ).catch(e => console.error(`[UPSERT 출퇴근] ${r.usName}/${workDate}: ${e.message}`));
  }
}

// ── 공휴일 ────────────────────────────────────────────────────
const HOLIDAY_URL = `${UNICLOUD_BASE}/unicloud/avs/setting/getAvsSetHoliday`;

async function fetchHolidays(year, retry = 0) {
  await ensureAvs();
  const res = await axios.post(HOLIDAY_URL, { belongYear: String(year) }, {
    headers: {
      'Content-Type': 'application/json', 'Cookie': avsCookie,
      'Origin': UNICLOUD_BASE, 'Referer': SESSION_KEEP_URL,
      'ajax': 'true', 'x-requested-with': 'XMLHttpRequest',
      '__service_id__': 'AVS', '__req_co_regno__': '1048621562',
      '__req_us_id__': process.env.LOGIN_ID, 'User-Agent': 'Mozilla/5.0',
    },
    validateStatus: s => s < 1000,
  });
  if (res.status === 900 || (typeof res.data === 'string' && res.data.includes('<!DOCTYPE'))) {
    if (retry >= 3) throw new Error('공휴일 세션 재로그인 3회 초과');
    avsCookie = await loginAvs();
    return fetchHolidays(year, retry + 1);
  }
  return res.data?.response ?? [];
}

async function upsertHolidays(list) {
  for (const h of list) {
    if (!h.holidayId || !h.holidayDate) continue;
    await db.query(
      `INSERT INTO holidays (holiday_id, holiday_date, holiday_name, public_yn, deduct_yn)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (holiday_id) DO UPDATE SET
         holiday_date=EXCLUDED.holiday_date, holiday_name=EXCLUDED.holiday_name,
         public_yn=EXCLUDED.public_yn, deduct_yn=EXCLUDED.deduct_yn, synced_at=NOW()`,
      [h.holidayId, h.holidayDate, h.holidayName || '', h.publicYn || 'Y', h.deductYn || 'N']
    ).catch(e => console.error(`[UPSERT 공휴일] ${h.holidayDate}: ${e.message}`));
  }
}

// ── 메인 동기화 (10분마다 실행) ───────────────────────────────
async function syncAll() {
  const today = getToday();
  const sixtyDaysLater = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    .toISOString().slice(0, 10);

  console.log(`[동기화] 시작 (${today})`);

  // 휴가 (오늘 ~ 60일 후)
  try {
    const vList = await fetchVacations(today, sixtyDaysLater);
    await upsertVacations(vList);
    console.log(`[동기화] 휴가 ${vList.length}건 upsert 완료`);
  } catch (e) { console.error(`[동기화] 휴가 실패: ${e.message}`); }

  // 회의실 (오늘 ~ 14일 후)
  try {
    const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const rList = await fetchRooms(today, twoWeeksLater);
    await upsertRooms(rList);
    console.log(`[동기화] 회의실 ${rList.length}건 upsert 완료 (${today}~${twoWeeksLater})`);
  } catch (e) { console.error(`[동기화] 회의실 실패: ${e.message}`); }

  // 출퇴근 (오늘치만 - 실시간 갱신용)
  try {
    const list = await fetchCommuteStatus(today, '00');
    await upsertCommuteRecords(list);
    console.log(`[동기화] 출퇴근 ${list.length}건 upsert 완료 (오늘)`);
  } catch (e) { console.error(`[동기화] 출퇴근 실패: ${e.message}`); }

  console.log(`[동기화] 완료`);
}

module.exports = { syncAll, keepSessions, fetchCommuteRange, upsertCommuteRecords, fetchHolidays, upsertHolidays };
