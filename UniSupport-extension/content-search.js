const COOKIE_PROCESSER   = 'dsh_processer';
const COOKIE_DAYS        = 'dsh_days';
const COOKIE_AUTO        = 'dsh_auto';
const COOKIE_TEAMS       = 'dsh_teams';
const COOKIE_PROGRESSION = 'dsh_progression';
const COOKIE_SORT_COL    = 'dsh_sort_col';
const COOKIE_SORT_DIR    = 'dsh_sort_dir';
const COOKIE_DATE_TYPE   = 'dsh_date_type';

const TEAM_OPTIONS = [
  { value: '',  label: '전체' },
  { value: '1', label: '1팀' },
  { value: '2', label: '2팀' },
  { value: '3', label: '3팀' },
  { value: '4', label: '4팀' },
  { value: '5', label: '5팀' },
  { value: '6', label: '6팀' },
  { value: '7', label: '7팀' },
  { value: 'N', label: '미지정' },
];

const ALL_TEAM_VALUES = ['1','2','3','4','5','6','7','N'];

const PROGRESSION_OPTIONS = [
  { value: 'R', label: '확인요청' },
  { value: 'E', label: '테스트요청' },
  { value: 'O', label: '운영반영요청' },
  { value: 'A', label: '접수' },
  { value: 'W', label: '보류' },
  { value: 'C', label: '처리중' },
  { value: 'M', label: '검토' },
  { value: 'N', label: '고객사답변' },
];

const DEFAULT_PROGRESSION = ['R','E','O','A','C','M','N'];

const DATE_TYPE_OPTIONS = [
  { value: 'R', label: '접수일' },
  { value: 'P', label: '처리일' },
];

const SORT_COL_OPTIONS = [
  { value: 'none',     label: '사용 안함' },
  { value: 'status',   label: '처리상태' },
  { value: 'hub_name', label: '고객사명' },
  { value: 'date',     label: '처리일' },
  { value: 'req_date', label: '접수일' },
];

// ─── 쿠키 헬퍼 ───────────────────────────────────────────
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : '';
}

function setCookie(name, value) {
  const exp = new Date();
  exp.setFullYear(exp.getFullYear() + 1);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${exp.toUTCString()}; path=/`;
}

function getToday() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
}

function getStartDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - Number(days));
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
}

// ─── iframe 포함 document/window 탐색 ───────────────────
function getTargetContext() {
  if (document.querySelector('#START_DATE')) return { doc: document, win: window };
  for (const iframe of document.querySelectorAll('iframe')) {
    try {
      if (iframe.contentDocument?.querySelector('#START_DATE')) {
        return { doc: iframe.contentDocument, win: iframe.contentWindow };
      }
    } catch (e) {}
  }
  return null;
}

function getTargetDoc() {
  return getTargetContext()?.doc || null;
}

// 메인 document + 모든 iframe에서 selector에 맞는 첫 요소 반환 (없으면 null)
function findInPage(selector) {
  const m = document.querySelector(selector);
  if (m) return m;
  for (const f of document.querySelectorAll('iframe')) {
    try { const r = f.contentDocument?.querySelector(selector); if (r) return r; } catch (_) {}
  }
  return null;
}

// ─── DOM 요소 대기 (폴링) ────────────────────────────────
function waitForElement(selector, callback, timeout = 15000) {
  let elapsed = 0;
  const interval = setInterval(() => {
    elapsed += 500;
    const doc = getTargetDoc();
    if (doc?.querySelector(selector)) { clearInterval(interval); callback(); }
    if (elapsed >= timeout) clearInterval(interval);
  }, 500);
}

// ─── 공통 헬퍼 ───────────────────────────────────────────
function setDatePicker($, el, val) {
  if (!el || !$) return;
  $(el).datepicker('setDate', val);
}

function setVal($, el, val) {
  if (!el) return;
  if ($) {
    $(el).val(val).trigger('input').trigger('change').trigger('blur');
  } else {
    el.value = val;
    el.dispatchEvent(new Event('input',  { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.dispatchEvent(new Event('blur',   { bubbles: true }));
  }
}

// 멀티셀렉트 공통 세팅 (팀, 처리상태 공용)
function setMultiSelect($, doc, selector, values, options) {
  const select = doc.querySelector(selector);
  if (!select) return;
  Array.from(select.options).forEach(opt => { opt.selected = values.includes(opt.value); });
  if ($) {
    try { $(select).multiselect('refresh'); } catch (e) {}
    $(select).trigger('change');
  }
  // multiselect 플러그인이 button width를 덮어쓰는 것 방지
  const btn = select.closest('.up-select-wrapper')?.querySelector('button.ui-multiselect');
  if (btn) btn.style.width = '100%';

  const spanEl = select.closest('.up-select-wrapper')?.querySelector('.up-select-text');
  if (spanEl) {
    const labels = values.map(v => options.find(o => o.value === v)?.label).filter(Boolean);
    spanEl.textContent = labels.length ? labels.join(', ') : '전체';
  }
}

function setDateType($, doc, val) {
  const select = doc.querySelector('#SEARCH_DATE_TYPE');
  if (!select) return;
  if ($) {
    $(select).val(val).trigger('change');
  } else {
    select.value = val;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }
  // 커스텀 버튼 UI 텍스트 동기화
  const spanEl = select.closest('.up-select-wrapper')?.querySelector('.up-select-text');
  if (spanEl) {
    spanEl.textContent = DATE_TYPE_OPTIONS.find(o => o.value === val)?.label || '접수일';
  }
}

function setTeams($, doc, teamValues) {
  const values = teamValues.includes('') ? ALL_TEAM_VALUES : teamValues;
  setMultiSelect($, doc, '#UNIDOCU_PART_TYPE', values, TEAM_OPTIONS);
}

function setProgression($, doc, progressionValues) {
  setMultiSelect($, doc, '#PROGRESSION_TYPE', progressionValues, PROGRESSION_OPTIONS);
}

// ─── 그리드 정렬 (grid.setColSort) ──────────────────────
function getGrid() {
  return getTargetContext()?.win?.grid || window.grid || null;
}

function applySort() {
  const sortCol = getCookie(COOKIE_SORT_COL) || 'none';
  if (sortCol === 'none') return; // 정렬 사용 안함
  const colMap = { status:'STATUS', hub_name:'CM_NAME', date:'PROCESS_DATE', req_date:'REQ_DATE' };
  const colId  = colMap[sortCol];
  const sortDir = getCookie(COOKIE_SORT_DIR) || 'desc';
  const asc    = sortDir === 'asc';
  const grid   = getGrid();
  if (!colId || !grid) return;

  // false는 falsy라서 내부에서 ASCENDING으로 덮어씌워짐 → 문자열로 전달
  grid.setColSort(colId, asc ? 'ascending' : 'descending');
}

// 그리드 데이터 로드 완료 감지 후 콜백 실행
// 행 수가 초기값에서 벗어난 뒤 300ms 동안 안정화되면 콜백 실행
function afterGridLoad(callback, timeout = 8000) {
  const grid = getGrid();
  if (!grid) return;
  const before  = grid.getRowCount();
  let elapsed   = 0;
  let changed   = false;
  let lastSeen  = before;
  let stableMs  = 0;

  const interval = setInterval(() => {
    elapsed += 150;
    const now = getGrid()?.getRowCount() ?? before;

    if (!changed && now !== before) changed = true;

    if (changed) {
      if (now === lastSeen) {
        stableMs += 150;
        if (stableMs >= 300) {
          clearInterval(interval);
          callback();
          return;
        }
      } else {
        stableMs = 0;
        lastSeen = now;
      }
    }

    if (elapsed >= timeout) clearInterval(interval);
  }, 150);
}


// ─── 검색 옵션 (fab.js 설정 패널에서 참조) ───────────────
const RANGE_OPTIONS = [
  { value: '10',  label: '10일 전' },
  { value: '30',  label: '한달' },
  { value: '90',  label: '3개월' },
  { value: '180', label: '6개월' },
  { value: '360', label: '360일' },
];


function sortAfterLoad() {
  // applySort가 여러 번 불리면 토글이 간섭 → 한 번만 실행
  let fired = false;
  const once = () => { if (fired) return; fired = true; applySort(); };
  afterGridLoad(once);
  setTimeout(once, 2500); // fallback
}

// ─── 날짜만 조회 ─────────────────────────────────────────
function applyDateOnly() {
  const days      = getCookie(COOKIE_DAYS) || '10';
  const today     = getToday();
  const startDate = getStartDate(days);
  const ctx       = getTargetContext();
  const $         = ctx?.win?.jQuery || ctx?.win?.$;
  const doc       = ctx?.doc || document;
  if (!$) return;

  const teams       = JSON.parse(getCookie(COOKIE_TEAMS) || '[]');
  const progression = JSON.parse(getCookie(COOKIE_PROGRESSION) || JSON.stringify(DEFAULT_PROGRESSION));
  const savedDateType = getCookie(COOKIE_DATE_TYPE) || 'R';
  const dateType      = savedDateType === 'P' ? 'R' : savedDateType; // 처리일 없는 항목 누락 방지

  setDatePicker($, doc.querySelector('#START_DATE'), startDate);
  setDatePicker($, doc.querySelector('#END_DATE'), today);
  setDateType($, doc, dateType);
  setTeams($, doc, teams);
  setProgression($, doc, progression);

  const allRadio = doc.querySelector('#RECEIPT_INFO_ALL');
  if (allRadio) {
    allRadio.checked = true;
    allRadio.dispatchEvent(new Event('click',  { bubbles: true }));
    allRadio.dispatchEvent(new Event('change', { bubbles: true }));
  }

  setTimeout(() => {
    doc.querySelector('#doSearch>div.doSearch>div')?.click();
  }, 300);
}

// ─── 조건 포함 조회 ──────────────────────────────────────
function applyAndSearch() {
  const days        = getCookie(COOKIE_DAYS) || '10';
  const processer   = getCookie(COOKIE_PROCESSER) || document.querySelector('.userNm')?.title?.trim() || '';
  const today       = getToday();
  const startDate   = getStartDate(days);
  const ctx         = getTargetContext();
  const $           = ctx?.win?.jQuery || ctx?.win?.$;
  const doc         = ctx?.doc || document;
  const teams       = JSON.parse(getCookie(COOKIE_TEAMS) || '[]');
  const progression = JSON.parse(getCookie(COOKIE_PROGRESSION) || JSON.stringify(DEFAULT_PROGRESSION));
  const dateType    = getCookie(COOKIE_DATE_TYPE) || 'R';

  setDatePicker($, doc.querySelector('#START_DATE'), startDate);
  setDatePicker($, doc.querySelector('#END_DATE'), today);
  setDateType($, doc, dateType);
  setTeams($, doc, teams);
  setProgression($, doc, progression);

  const processerRadio = doc.querySelector('#RECEIPT_INFO_PROCESSER');
  if (processerRadio) {
    processerRadio.checked = true;
    processerRadio.dispatchEvent(new Event('click',  { bubbles: true }));
    processerRadio.dispatchEvent(new Event('change', { bubbles: true }));
  }

  setTimeout(() => {
    if (processer) setVal($, doc.querySelector('#RECEIPT_INFO_TEXT'), processer);
    setTimeout(() => {
      doc.querySelector('#doSearch>div.doSearch>div')?.click();
      // '사용 안함'이면 정렬 불필요
      if ((getCookie(COOKIE_SORT_COL) || 'none') !== 'none') sortAfterLoad();
    }, 150);
  }, 300);
}

// ─── 초기화 ──────────────────────────────────────────────
function initSearch() {
  if (getCookie(COOKIE_AUTO) === 'true') {
    waitForElement('#doSearch>div.doSearch>div', applyAndSearch);
  }
}

initSearch();
