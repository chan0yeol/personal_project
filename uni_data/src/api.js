const express = require('express');
const router = express.Router();
const db = require('./db');

// ── 인사정보 ──────────────────────────────────────────────────

// GET /api/users?dept_id=&dept_name=&name=&role=&pos=&active_only=true
router.get('/users', async (req, res) => {
  try {
    const { dept_id, dept_name, name, role, pos, active_only } = req.query;
    const conditions = [];
    const params = [];

    if (active_only !== 'false') {
      conditions.push(`user_show_yn = 'Y'`);
    }
    if (dept_id) {
      params.push(`%${dept_id}%`);
      conditions.push(`dept_id ILIKE $${params.length}`);
    }
    if (dept_name) {
      params.push(`%${dept_name}%`);
      conditions.push(`dept_name ILIKE $${params.length}`);
    }
    if (name) {
      params.push(`%${name}%`);
      conditions.push(`us_name ILIKE $${params.length}`);
    }
    if (role) {
      params.push(`%${role}%`);
      conditions.push(`us_roll_name ILIKE $${params.length}`);
    }
    if (pos) {
      params.push(`%${pos}%`);
      conditions.push(`us_pos_name ILIKE $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT us_id, us_name, dept_id, dept_name, us_roll_name, us_pos_name,
              us_mail1, slack_id, is_leader,
              enter_date, retire_date, emp_no, user_show_yn
       FROM users ${where} ORDER BY dept_name, us_name`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/users/:usId
router.get('/users/:usId', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE us_id = $1', [req.params.usId]);
    if (!rows[0]) return res.status(404).json({ error: '사용자 없음' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/history?us_id=&type=&limit=50
router.get('/history', async (req, res) => {
  try {
    const { us_id, type, limit = 100 } = req.query;
    const conditions = [];
    const params = [];

    if (us_id) { params.push(us_id); conditions.push(`us_id = $${params.length}`); }
    if (type)  { params.push(type);  conditions.push(`change_type = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(Math.min(parseInt(limit) || 100, 500));
    const { rows } = await db.query(
      `SELECT h.id, h.us_id, u.us_name, h.change_type, h.field_name,
              h.old_value, h.new_value, h.detected_at
       FROM user_history h
       LEFT JOIN users u ON h.us_id = u.us_id
       ${where} ORDER BY h.detected_at DESC LIMIT $${params.length}`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 출퇴근 ────────────────────────────────────────────────────

// GET /api/commute/today?dept_id=
router.get('/commute/today', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { dept_id } = req.query;
    const params = [today];
    const extra = dept_id ? ` AND dept_id = $2` : '';
    if (dept_id) params.push(dept_id);

    const { rows } = await db.query(
      `SELECT dept_id, name, work_date, scheduled_start_time, actual_start_time,
              actual_end_time, is_late, is_absent, start_device_name,
              time_unit, time_unit_name, vac_stime, vac_etime, synced_at
       FROM commute_records
       WHERE work_date = $1 ${extra}
       ORDER BY dept_id, name`,
      params
    );
    res.json({ date: today, count: rows.length, records: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/commute/absent?date=&dept_id=
router.get('/commute/absent', async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    if (isWeekend(date)) return res.json({ date, is_weekend: true, count: 0, records: [] });

    const { dept_id } = req.query;
    const holiday = await db.query('SELECT holiday_name FROM holidays WHERE holiday_date = $1', [date]);
    if (holiday.rows.length) return res.json({ date, is_holiday: true, holiday_name: holiday.rows[0].holiday_name, count: 0, records: [] });

    const params = [date];
    const extra = dept_id ? ` AND dept_id = $2` : '';
    if (dept_id) params.push(dept_id);

    const { rows } = await db.query(
      `SELECT c.dept_id, c.name, c.scheduled_start_time, c.time_unit, c.vac_etime, c.synced_at
       FROM commute_records c
       WHERE c.work_date = $1
         AND c.actual_start_time IS NULL
         AND c.time_unit IS DISTINCT FROM 'FULL'
         ${extra}
         AND NOT EXISTS (
           SELECT 1 FROM vacations v
           WHERE v.us_name = c.name
             AND v.use_sdate <= $1::date
             AND COALESCE(v.use_edate, v.use_sdate) >= $1::date
             AND v.time_unit_name = '종일'
         )
       ORDER BY c.dept_id, c.scheduled_start_time`,
      params
    );
    res.json({ date, count: rows.length, records: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/commute?sdate=&edate=&dept_id=&name=
router.get('/commute', async (req, res) => {
  try {
    const { sdate, edate, dept_id, name } = req.query;
    if (!sdate || !edate) return res.status(400).json({ error: 'sdate, edate 필수' });

    const conditions = ['work_date BETWEEN $1 AND $2'];
    const params = [sdate, edate];

    if (dept_id) { params.push(dept_id); conditions.push(`dept_id = $${params.length}`); }
    if (name)    { params.push(`%${name}%`); conditions.push(`name ILIKE $${params.length}`); }

    const { rows } = await db.query(
      `SELECT dept_id, name, work_date, scheduled_start_time, scheduled_end_time,
              actual_start_time, actual_end_time, work_minutes, break_minutes,
              is_late, is_early_leave, is_absent, start_place_name, start_device_name, end_device_name,
              time_unit, time_unit_name, vac_sdate, vac_edate, vac_stime, vac_etime
       FROM commute_records
       WHERE ${conditions.join(' AND ')}
       ORDER BY work_date DESC, dept_id, name`,
      params
    );
    res.json({ sdate, edate, count: rows.length, records: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 휴가 ──────────────────────────────────────────────────────

// GET /api/vacations?sdate=&edate=&name=&dept=
router.get('/vacations', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { sdate = today, edate = today, name, dept } = req.query;

    const conditions = ['use_sdate <= $2 AND COALESCE(use_edate, use_sdate) >= $1'];
    const params = [sdate, edate];

    if (name) { params.push(`%${name}%`); conditions.push(`us_name ILIKE $${params.length}`); }
    if (dept) { params.push(`%${dept}%`); conditions.push(`dept_name ILIKE $${params.length}`); }

    const { rows } = await db.query(
      `SELECT us_name, dept_name, time_unit_name, use_time_type_name,
              use_sdate, use_edate, use_stime, use_etime, synced_at
       FROM vacations
       WHERE ${conditions.join(' AND ')}
       ORDER BY use_sdate, dept_name, us_name`,
      params
    );
    res.json({ sdate, edate, count: rows.length, records: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 회의실 ────────────────────────────────────────────────────

// GET /api/rooms?sdate=&edate=
router.get('/rooms', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { sdate = today, edate = today } = req.query;

    const { rows } = await db.query(
      `SELECT room_name, title, booker, book_date, start_time, end_time
       FROM room_bookings
       WHERE book_date BETWEEN $1 AND $2
       ORDER BY book_date, start_time`,
      [sdate, edate]
    );
    res.json({ sdate, edate, count: rows.length, records: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 부서 ──────────────────────────────────────────────────────

const DEPT_CTE = `
  WITH RECURSIVE dept_tree AS (
    SELECT dept_id, dept_name, level, parent, dept_id::text AS path
    FROM departments
    WHERE parent IS NULL
    UNION ALL
    SELECT d.dept_id, d.dept_name, d.level, d.parent, dt.path || '-' || d.dept_id
    FROM departments d
    JOIN dept_tree dt ON d.parent = dt.dept_id
  )
`;

// GET /api/departments?parent=0006&level=3&root=0009&name=구독
router.get('/departments', async (req, res) => {
  try {
    const { parent, level, root, name } = req.query;
    const conditions = [];
    const params = [];

    if (parent) { params.push(parent);          conditions.push(`parent = $${params.length}`); }
    if (level)  { params.push(parseInt(level));  conditions.push(`level = $${params.length}`); }
    if (name)   { params.push(`%${name}%`);      conditions.push(`dept_name ILIKE $${params.length}`); }
    if (root) {
      const { rows: r } = await db.query(`${DEPT_CTE} SELECT path FROM dept_tree WHERE dept_id = $1`, [root]);
      if (!r.length) return res.status(404).json({ error: '부서 코드 없음' });
      params.push(`${r[0].path}%`);
      conditions.push(`path LIKE $${params.length}`);
    }
    if (!root && !parent && !level && !name) conditions.push(`dept_id != '00'`);

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `${DEPT_CTE} SELECT dept_id, dept_name, level, parent, path FROM dept_tree ${where} ORDER BY path`,
      params
    );
    res.json({ count: rows.length, records: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/departments/tree?root=0009&root_name=구독그룹
router.get('/departments/tree', async (req, res) => {
  try {
    let { root, root_name } = req.query;
    const params = [];
    let where = `WHERE dept_id != '00'`;

    if (root_name && !root) {
      const { rows: r } = await db.query(`SELECT dept_id FROM departments WHERE dept_name ILIKE $1 LIMIT 1`, [`%${root_name}%`]);
      if (!r.length) return res.status(404).json({ error: '부서명 없음' });
      root = r[0].dept_id;
    }

    if (root) {
      const { rows: r } = await db.query(`${DEPT_CTE} SELECT path FROM dept_tree WHERE dept_id = $1`, [root]);
      if (!r.length) return res.status(404).json({ error: '부서 코드 없음' });
      params.push(`${r[0].path}%`);
      where = `WHERE path LIKE $1`;
    }

    const { rows } = await db.query(
      `${DEPT_CTE} SELECT dept_id, dept_name, level, parent, path FROM dept_tree ${where} ORDER BY path`,
      params
    );

    const map = {};
    const roots = [];
    for (const row of rows) map[row.dept_id] = { ...row, children: [] };
    for (const row of rows) {
      if (row.parent && map[row.parent]) map[row.parent].children.push(map[row.dept_id]);
      else roots.push(map[row.dept_id]);
    }
    res.json(roots);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 대시보드 ──────────────────────────────────────────────────

async function getDeptCodes(root) {
  const { rows } = await db.query(
    `${DEPT_CTE} SELECT dept_id FROM dept_tree WHERE path LIKE $1`,
    [`${root}%`]
  );
  return rows.map(r => r.dept_id);
}

function isWeekend(dateStr) { const d = new Date(dateStr).getDay(); return d === 0 || d === 6; }

// GET /api/dashboard/today?date=&dept_id=&root=
router.get('/dashboard/today', async (req, res) => {
  try {
    const date    = req.query.date || new Date().toISOString().slice(0, 10);
    if (isWeekend(date)) return res.json({ date, is_weekend: true, count: 0, summary: {}, records: [] });
    const { dept_id, dept_name, root } = req.query;
    const params  = [date];
    const conditions = [];

    if (dept_id)   { params.push(dept_id);        conditions.push(`u.dept_id = $${params.length}`); }
    if (dept_name) { params.push(`%${dept_name}%`); conditions.push(`u.dept_name ILIKE $${params.length}`); }
    if (root) {
      const codes = await getDeptCodes(root);
      params.push(codes);
      conditions.push(`u.dept_id = ANY($${params.length})`);
    }

    const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(`
      SELECT
        u.us_id, u.us_name AS name, u.dept_id, u.dept_name,
        c.actual_start_time, c.actual_end_time, c.work_minutes,
        c.is_late, c.time_unit, c.time_unit_name, c.vac_stime, c.vac_etime,
        (SELECT holiday_name FROM holidays WHERE holiday_date = $1 LIMIT 1) AS holiday_name,
        CASE
          WHEN EXISTS (SELECT 1 FROM holidays WHERE holiday_date = $1) THEN '공휴일'
          WHEN c.time_unit = 'FULL'                                    THEN '종일휴가'
          WHEN c.actual_start_time IS NOT NULL AND c.time_unit = 'HOUR' THEN '반차출근'
          WHEN c.actual_start_time IS NOT NULL                          THEN '출근'
          WHEN c.time_unit = 'HOUR'                                     THEN '반차'
          WHEN c.us_id IS NOT NULL                                      THEN '미출근'
          ELSE '미등록'
        END AS status
      FROM users u
      LEFT JOIN commute_records c ON c.us_id = u.us_id AND c.work_date = $1
      WHERE u.user_show_yn = 'Y' ${where}
      ORDER BY u.dept_name, u.us_name
    `, params);

    const summary = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
    res.json({ date, count: rows.length, summary, records: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/dashboard/stats?sdate=&edate=&dept_id=&root=&name=
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { sdate, edate, dept_id, dept_name, root, name } = req.query;
    if (!sdate || !edate) return res.status(400).json({ error: 'sdate, edate 필수' });
    if (sdate === edate && isWeekend(sdate)) return res.json({ sdate, edate, is_weekend: true, count: 0, records: [] });

    const params = [sdate, edate];
    const conditions = [];

    if (dept_id)   { params.push(dept_id);          conditions.push(`u.dept_id = $${params.length}`); }
    if (dept_name) { params.push(`%${dept_name}%`);  conditions.push(`u.dept_name ILIKE $${params.length}`); }
    if (root)      { const codes = await getDeptCodes(root); params.push(codes); conditions.push(`u.dept_id = ANY($${params.length})`); }
    if (name)      { params.push(`%${name}%`);       conditions.push(`u.us_name ILIKE $${params.length}`); }

    const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(`
      SELECT
        u.us_name AS name, u.dept_id, u.dept_name,
        COUNT(c.work_date)                                                         AS total_days,
        COUNT(c.work_date) FILTER (WHERE c.actual_start_time IS NOT NULL)          AS attended_days,
        COUNT(c.work_date) FILTER (WHERE c.actual_start_time IS NULL
                                     AND COALESCE(c.time_unit,'') <> 'FULL')       AS absent_days,
        COUNT(c.work_date) FILTER (WHERE c.is_late = true)                         AS late_count,
        COUNT(c.work_date) FILTER (WHERE c.time_unit = 'FULL')                     AS vacation_days,
        ROUND(AVG(EXTRACT(EPOCH FROM c.actual_start_time) / 60)
              FILTER (WHERE c.actual_start_time IS NOT NULL))::integer             AS avg_start_min,
        COALESCE(SUM(c.work_minutes), 0)                                           AS total_work_minutes
      FROM users u
      LEFT JOIN commute_records c ON c.us_id = u.us_id AND c.work_date BETWEEN $1 AND $2
      WHERE u.user_show_yn = 'Y' ${where}
      GROUP BY u.us_name, u.dept_id, u.dept_name
      ORDER BY u.dept_name, u.us_name
    `, params);

    res.json({ sdate, edate, count: rows.length, records: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/dashboard/late?sdate=&edate=&dept_id=&root=
router.get('/dashboard/late', async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { sdate = today, edate = today, dept_id, dept_name, root } = req.query;
    if (sdate === edate && isWeekend(sdate)) return res.json({ sdate, edate, is_weekend: true, count: 0, records: [] });
    const params = [sdate, edate];
    const conditions = [];

    if (dept_id)   { params.push(dept_id);         conditions.push(`dept_id = $${params.length}`); }
    if (dept_name) { params.push(`%${dept_name}%`); conditions.push(`name ILIKE $${params.length}`); }
    if (root)      { const codes = await getDeptCodes(root); params.push(codes); conditions.push(`dept_id = ANY($${params.length})`); }

    const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(`
      SELECT name, dept_id, work_date, actual_start_time, time_unit_name
      FROM commute_records
      WHERE work_date BETWEEN $1 AND $2 AND is_late = true ${where}
      ORDER BY work_date DESC, dept_id, name
    `, params);

    res.json({ sdate, edate, count: rows.length, records: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 공휴일 ────────────────────────────────────────────────────

// GET /api/holidays?year=2026&sdate=2026-01-01&edate=2026-12-31
router.get('/holidays', async (req, res) => {
  try {
    const { year, sdate, edate } = req.query;
    const conditions = [];
    const params = [];

    if (year)  { params.push(`${year}-01-01`); conditions.push(`holiday_date >= $${params.length}`);
                 params.push(`${year}-12-31`); conditions.push(`holiday_date <= $${params.length}`); }
    if (sdate) { params.push(sdate); conditions.push(`holiday_date >= $${params.length}`); }
    if (edate) { params.push(edate); conditions.push(`holiday_date <= $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT holiday_id, holiday_date, holiday_name, public_yn, deduct_yn
       FROM holidays ${where} ORDER BY holiday_date`,
      params
    );
    res.json({ count: rows.length, records: rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 헬스체크 ──────────────────────────────────────────────────
// ── IP 관리 ──────────────────────────────────────────────────

function shortId() { return Math.random().toString(36).slice(2, 6); }

const IP_FIELDS = `id, ip, status, name, device, mac, memo, date, team_id AS team`;

// GET /api/ip/teams
router.get('/ip/teams', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name, prefix, startrange AS start, endrange AS end, color FROM ip_teams ORDER BY id');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/ip/teams
router.post('/ip/teams', async (req, res) => {
  try {
    const { name, prefix = '192.168.12', start, end, color = '' } = req.body;
    const id = req.body.id || shortId();
    await db.query(
      'INSERT INTO ip_teams (id, name, prefix, startrange, endrange, color) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, name, prefix, start, end, color]
    );
    const { rows } = await db.query('SELECT id, name, prefix, start, "end" AS end, color FROM ip_teams WHERE id=$1', [id]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/ip/teams/:id
router.put('/ip/teams/:id', async (req, res) => {
  try {
    const { name, prefix, start, end, color } = req.body;
    const { rowCount } = await db.query(
      'UPDATE ip_teams SET name=$1, prefix=$2, startrange=$3, endrange=$4, color=$5 WHERE id=$6',
      [name, prefix, start, end, color, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: '팀 없음' });
    const { rows } = await db.query('SELECT id, name, prefix, start, "end" AS end, color FROM ip_teams WHERE id=$1', [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/ip/teams/:id
router.delete('/ip/teams/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ip_teams WHERE id=$1', [req.params.id]);
    res.json({});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/ip/ips?status=used&team=t2
router.get('/ip/ips', async (req, res) => {
  try {
    const { status, team } = req.query;
    const conditions = [];
    const params = [];
    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
    if (team)   { params.push(team);   conditions.push(`team_id = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT ${IP_FIELDS} FROM ip_addresses ${where} ORDER BY ip`,
      params
    );
    // res.json(rows.map(r => ({ ...r, date: r.date ? r.date.toISOString().slice(0, 10) : null })));
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/ip/ips
router.post('/ip/ips', async (req, res) => {
  try {
    const { ip, status = 'free', name = '', device = '', mac = '', memo = '', date, team } = req.body;
    const id = req.body.id || shortId();
    await db.query(
      'INSERT INTO ip_addresses (id, ip, status, name, device, mac, memo, date, team_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
      [id, ip, status, name, device, mac, memo, date || null, team || null]
    );
    const { rows } = await db.query(`SELECT ${IP_FIELDS} FROM ip_addresses WHERE id=$1`, [id]);
    // res.status(201).json({ ...rows[0], date: rows[0].date ? rows[0].date.toISOString().slice(0, 10) : null });
    res.status(201).json(rows);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: '이미 등록된 IP입니다' });
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/ip/ips/:id
router.put('/ip/ips/:id', async (req, res) => {
  try {
    const { ip, status, name, device, mac, memo, date, team } = req.body;
    const { rowCount } = await db.query(
      'UPDATE ip_addresses SET ip=$1, status=$2, name=$3, device=$4, mac=$5, memo=$6, date=$7, team_id=$8, updated_at=NOW() WHERE id=$9',
      [ip, status, name, device, mac, memo, date || null, team || null, req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'IP 없음' });
    const { rows } = await db.query(`SELECT ${IP_FIELDS} FROM ip_addresses WHERE id=$1`, [req.params.id]);
    // res.json({ ...rows[0], date: rows[0].date ? rows[0].date.toISOString().slice(0, 10) : null });
    res.json(rows)
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/ip/ips/:id
router.patch('/ip/ips/:id', async (req, res) => {
  try {
    const allowed = ['ip', 'status', 'name', 'device', 'mac', 'memo', 'date', 'team'];
    const fields = Object.keys(req.body).filter(k => allowed.includes(k));
    if (!fields.length) return res.status(400).json({ error: '변경할 필드 없음' });

    const setClauses = fields.map((f, i) => `${f === 'team' ? 'team_id' : f} = $${i + 1}`);
    const values = fields.map(f => req.body[f]);
    values.push(req.params.id);

    await db.query(
      `UPDATE ip_addresses SET ${setClauses.join(', ')}, updated_at=NOW() WHERE id=$${values.length}`,
      values
    );
    const { rows } = await db.query(`SELECT ${IP_FIELDS} FROM ip_addresses WHERE id=$1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'IP 없음' });
    // res.json({ ...rows[0], date: rows[0].date ? rows[0].date.toISOString().slice(0, 10) : null });
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/ip/ips/:id
router.delete('/ip/ips/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ip_addresses WHERE id=$1', [req.params.id]);
    res.json({});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── 헬스체크 ──────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, time: new Date().toISOString() });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

module.exports = router;
