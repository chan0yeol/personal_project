const axios = require('axios');
const db = require('./db');
const { loginPortal, PORTAL_BASE } = require('./login');

const HR_API_URL = `${PORTAL_BASE}/portal/unicloud/admin/dept/getOrganizationUserTreeList`;

const TRACKED_FIELDS = ['dept_name', 'dept_id', 'us_roll_name', 'us_pos_name', 'us_mail1'];

async function fetchHrUsers(cookie) {
  const res = await axios.post(HR_API_URL, { userShowYn: 'N' }, {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
      'Origin': PORTAL_BASE,
      'Referer': `${PORTAL_BASE}/portal/my-service`,
      '__req_co_regno__': '1048621562',
      '__req_us_id__': process.env.LOGIN_ID,
      '__is_app__': 'false',
      '__is_mobile__': 'false',
      'ajax': 'true',
      'x-requested-with': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0',
    },
    validateStatus: s => s < 1000,
  });
  if (!Array.isArray(res.data?.response)) throw new Error(`인사 API 응답 오류: ${JSON.stringify(res.data)?.slice(0, 200)}`);
  // dataType === "U" 인 노드만 추출 (부서/루트 노드 제외)
  return res.data.response.filter(node => node.ccDeptTree?.dataType === 'U' && node.ccDeptTree?.usId);
}

function toRecord(node) {
  const u = node.ccDeptTree;
  return {
    us_id:        u.usId,
    us_name:      u.usName,
    dept_id:      u.deptPId    ?? null,   // 실제 소속 부서 ID
    dept_name:    u.deptPName  ?? null,   // 실제 소속 팀명
    us_roll_name: u.usRollName ?? null,
    us_pos_name:  u.usPosName  ?? null,
    us_mail1:     u.usMail1    ?? null,
    chief_yn:     null,
    chief_us_id:  null,
    user_show_yn: 'Y',
  };
}

async function runHrBatch() {
  console.log(`[HR배치] 시작: ${new Date().toLocaleString('ko-KR')}`);

  const cookie = await loginPortal();
  const apiUsers = await fetchHrUsers(cookie);
  console.log(`[HR배치] API 응답: ${apiUsers.length}명`);

  const dbRes = await db.query('SELECT us_id, us_name, dept_id, dept_name, us_roll_name, us_pos_name, us_mail1, user_show_yn FROM users');
  const dbMap = Object.fromEntries(dbRes.rows.map(r => [r.us_id, r]));

  // rec 기준으로 사전 변환 (ccDeptTree 의존 제거)
  const apiRecords = apiUsers.map(toRecord);
  const apiMap = Object.fromEntries(apiRecords.map(r => [r.us_id, r]));

  let joined = 0, left = 0, changed = 0;

  for (const rec of apiRecords) {
    const existing = dbMap[rec.us_id];

    if (!existing) {
      // 신규 입사
      await db.query(
        `INSERT INTO users (us_id, us_name, dept_id, dept_name, us_roll_name, us_pos_name, us_mail1, chief_yn, chief_us_id, user_show_yn, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, NOW(), NOW())
         ON CONFLICT (us_id) DO UPDATE SET
           us_name=EXCLUDED.us_name, dept_id=EXCLUDED.dept_id, dept_name=EXCLUDED.dept_name,
           us_roll_name=EXCLUDED.us_roll_name, us_pos_name=EXCLUDED.us_pos_name,
           us_mail1=EXCLUDED.us_mail1,
           user_show_yn=EXCLUDED.user_show_yn, updated_at=NOW()`,
        [rec.us_id, rec.us_name, rec.dept_id, rec.dept_name, rec.us_roll_name, rec.us_pos_name,
         rec.us_mail1, rec.chief_yn, rec.chief_us_id, rec.user_show_yn]
      );
      await db.query(
        `INSERT INTO user_history (us_id, change_type, new_value) VALUES ($1,'JOIN',$2)`,
        [rec.us_id, rec.dept_name ?? '']
      );
      console.log(`[HR배치] 입사: ${rec.us_name} (${rec.dept_name})`);
      joined++;
    } else {
      // 변동 감지
      const changes = [];
      for (const field of TRACKED_FIELDS) {
        const oldVal = existing[field] ?? '';
        const newVal = rec[field] ?? '';
        if (oldVal !== newVal) changes.push({ field, oldVal, newVal });
      }
      if (changes.length) {
        await db.query(
          `UPDATE users SET dept_id=$1, dept_name=$2, us_roll_name=$3, us_pos_name=$4,
           us_mail1=$5, updated_at=NOW() WHERE us_id=$6`,
          [rec.dept_id, rec.dept_name, rec.us_roll_name, rec.us_pos_name,
           rec.us_mail1, rec.us_id]
        );
        for (const c of changes) {
          await db.query(
            `INSERT INTO user_history (us_id, change_type, field_name, old_value, new_value)
             VALUES ($1,$2,$3,$4,$5)`,
            [rec.us_id, c.field === 'dept_name' ? 'DEPT_CHANGE' : 'ROLE_CHANGE', c.field, c.oldVal, c.newVal]
          );
          console.log(`[HR배치] 변동: ${existing.us_name} ${c.field} [${c.oldVal}] → [${c.newVal}]`);
        }
        changed++;
      }
    }
  }

  // 퇴사 감지
  for (const row of dbRes.rows) {
    if (!apiMap[row.us_id] && row.user_show_yn !== 'N') {
      await db.query(`UPDATE users SET user_show_yn='N', updated_at=NOW() WHERE us_id=$1`, [row.us_id]);
      await db.query(
        `INSERT INTO user_history (us_id, change_type, old_value) VALUES ($1,'LEAVE',$2)`,
        [row.us_id, row.dept_name ?? '']
      );
      console.log(`[HR배치] 퇴사: ${row.us_name} (${row.dept_name})`);
      left++;
    }
  }

  console.log(`[HR배치] 완료 — 입사 ${joined}, 퇴사 ${left}, 변동 ${changed}`);
}

module.exports = { runHrBatch };
