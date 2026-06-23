// ── 상태 ──────────────────────────────────────────────
let registeredEvents = []
let firedEvents = []
let nstCalls = []       // { callId, method, serviceId, programId, time, is_data, it_data, status, duration, response }
const nstCallMap = {}   // callId → nstCalls 인덱스
let activeFilter = 'ALL'
let activeProgramFilter = ''
let searchQuery = ''
let currentTab = 'registered'
const knownProgramIds = new Set()
let liveItemMap = {} // key → { li, countEl, durEl, argsEl, count }
let disabledEvKeys = new Set()
let activePatternCategory = 'ALL'
let docSelectedKeys = new Set() // 문서 생성 대상으로 체크된 이벤트 키

// ── 패턴 레퍼런스 데이터 ($u API 기반) ────────────────
const PATTERNS = [
  // ── GRD ──────────────────────────────────────────
  { category: 'GRD', title: '셀 클릭 이벤트', desc: '그리드 셀 클릭 시 컬럼 키·행 인덱스 획득',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');
gridObj.onCellClick(function(columnKey, rowIndex) {
  const val = gridObj.$V(columnKey, rowIndex);
});` },
  { category: 'GRD', title: '셀 값 변경 → 자동 계산', desc: '셀 편집 완료 시 연산 결과를 다른 셀에 반영',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');
gridObj.onChangeCell(function(columnKey, rowIndex, oldValue, newValue) {
  if (columnKey === 'QTY' || columnKey === 'PRICE') {
    const qty   = gridObj.$V('QTY', rowIndex);
    const price = gridObj.$V('PRICE', rowIndex);
    gridObj.$V('TOTAL', rowIndex, qty * price);
  }
});` },
  { category: 'GRD', title: '행 활성화 이벤트', desc: '행 선택(포커스 이동) 시 하단 폼에 데이터 연동',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');
gridObj.onRowActivate(function(rowIndex) {
  const data = gridObj.getJSONData();
  const row  = data[rowIndex];
  $u.get('FIELD_ID').setValue(row.FIELD_KEY);
});` },
  { category: 'GRD', title: '체크된 행 가져오기', desc: 'getSELECTEDJSONData() — asserts로 미선택 검증 포함',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');
gridObj.asserts.rowSelected(); // 체크 행 없으면 자동 throw
const checkedRows = gridObj.getSELECTEDJSONData();` },
  { category: 'GRD', title: '전체 데이터 읽기 / 가공 / 쓰기', desc: 'getJSONData → 배열 가공 → setJSONData (DOM 조작 최소화)',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');
const data = gridObj.getJSONData();
if (!data.length) return;

// 특정 조건의 행 데이터 가공 후 일괄 반영
const updated = data.map(function(row) {
  if (row['FLAG'] === 'Y') {
    return $.extend({}, row, { STATUS: 'DONE' });
  }
  return row;
});
gridObj.setJSONData(updated);` },
  { category: 'GRD', title: '셀 값 읽기 / 쓰기 ($V)', desc: '$V(컬럼키, 행인덱스) 패턴으로 단일 셀 처리',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');
const rowIndex = gridObj.getActiveRowIndex();

// 읽기
const val = gridObj.$V('COLUMN_KEY', rowIndex);

// 쓰기
gridObj.$V('COLUMN_KEY', rowIndex, '새값');` },
  { category: 'GRD', title: '행 편집 모드 제어', desc: '조건에 따라 행별 편집 가능 / 읽기 전용 전환',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');
const data = gridObj.getJSONData();
if (!data.length) return;

data.forEach(function(row, i) {
  if (row['STATUS'] === 'C') gridObj.makeRowEditable(i);
  else gridObj.makeRowReadOnly(i);
});` },
  { category: 'GRD', title: '컬럼 표시 / 숨김', desc: 'setColumnHide로 컬럼을 동적으로 표시하거나 숨김',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');

gridObj.setColumnHide('COLUMN_KEY', true);  // 숨기기
gridObj.setColumnHide('COLUMN_KEY', false); // 표시` },
  { category: 'GRD', title: '선택 행 데이터 일괄 수정', desc: 'getSelectedRowIndexes + setRowDataByJSONObj — 체크 행만 골라 데이터 일괄 교체',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');
gridObj.asserts.rowSelected(); // 체크 행 없으면 자동 throw

const data    = gridObj.getSELECTEDJSONData();    // 체크 행 JSON 배열
const indexes = gridObj.getSelectedRowIndexes();  // 체크 행 rowIndex 배열 (data와 순서 일치)

indexes.forEach(function(rowIndex, i) {
  const updated = $.extend({}, data[i], { STATUS: 'DONE' }); // 필요한 필드만 변경
  gridObj.setRowDataByJSONObj(rowIndex, updated);
});` },
  { category: 'GRD', title: '아이템 체크 이벤트 (_rg)', desc: '개별 행 체크박스 상태 변경 감지 (RealGrid 네이티브)',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');
gridObj._rg.onItemChecked(function(grid, itemIndex, checked) {
  const data = gridObj.getJSONData();
  const row  = data[itemIndex];
  // checked: true/false
});` },

  // ── FLD ──────────────────────────────────────────
  { category: 'FLD', title: 'change 이벤트 등록', desc: '필드 값 변경 감지 후 연관 필드 자동 업데이트',
    code: `$u.get('FIELD_ID').$el.change(function() {
  const val = $u.get('FIELD_ID').getValue();
  $u.get('OTHER_FIELD').setValue(val);
});` },
  { category: 'FLD', title: 'blur 유효성 검사', desc: '포커스 해제 시 필수값 / 형식 검사',
    code: `$u.get('FIELD_ID').$el.blur(function() {
  const val = $u.get('FIELD_ID').getValue();
  if (!val) {
    alert('필수 입력 항목입니다.');
  }
});` },
  { category: 'FLD', title: '날짜 필드 오늘로 초기화', desc: '페이지 로드 시 날짜 필드를 오늘 날짜(YYYYMMDD)로 세팅',
    code: `const t    = new Date();
const yyyy = t.getFullYear();
const mm   = String(t.getMonth() + 1).padStart(2, '0');
const dd   = String(t.getDate()).padStart(2, '0');
$u.get('DATE_FIELD').setValue(yyyy + mm + dd);` },
  { category: 'FLD', title: 'keyup 이벤트', desc: '키 입력마다 실시간 처리 (글자 수 제한 등)',
    code: `$u.get('FIELD_ID').$el.keyup(function() {
  let val = $u.get('FIELD_ID').getValue();
  if (val.length > 10) {
    $u.get('FIELD_ID').setValue(val.slice(0, 10));
  }
});` },

  // ── BTN ──────────────────────────────────────────
  { category: 'BTN', title: '화면 버튼 핸들러 (addHandler)', desc: '화면 버튼 ID와 매핑 — 해당 ID 버튼 클릭 시 자동 실행',
    code: `$u.addHandler('BTN_SAVE', function() {
  // 화면의 BTN_SAVE 버튼 클릭 시 자동 실행
});` },
  { category: 'BTN', title: '유틸 함수 등록 (addCustomHandler)', desc: '화면 버튼과 무관한 기능성 함수 — runCustomHandler()로 직접 호출',
    code: `$u.buttons.addCustomHandler('doSave', function(params) {
  // 직접 호출용 유틸·기능성 함수
  // params로 데이터 전달 가능
});

// 호출 시
$u.buttons.runCustomHandler('doSave', { key: 'value' });` },
  { category: 'BTN', title: '저장 버튼 패턴', desc: '체크 행 검증 후 데이터 수집까지의 저장 패턴',
    code: `$u.addHandler('BTN_SAVE', function() {
  const gridObj = $u.gridWrapper.getGrid('그리드ID');
  gridObj.asserts.rowSelected(); // 체크 행 없으면 자동 throw
  const saveData = gridObj.getSELECTEDJSONData();
  // TODO: $nst 호출
});` },
  { category: 'BTN', title: '행 삭제 버튼 패턴', desc: '체크 행 확인 후 역순 삭제 (인덱스 꼬임 방지)',
    code: `$u.addHandler('BTN_DEL', function() {
  const gridObj = $u.gridWrapper.getGrid('그리드ID');
  gridObj.asserts.rowSelected(); // 체크 행 없으면 자동 throw
  if (!confirm('삭제하시겠습니까?')) return;
  const idxArr = gridObj.getSelectedRowIndexes();
  idxArr.slice().reverse().forEach(function(i) {
    gridObj.deleteRow(i);
  });
});` },

  // ── HDL ──────────────────────────────────────────
  { category: 'HDL', title: '핸들러 등록 기본', desc: '$u.addHandler로 일반 이벤트 핸들러 등록',
    code: `$u.addHandler('HANDLER_ID', function() {
  // 핸들러 처리
});` },
  { category: 'HDL', title: '페이지 초기화 핸들러', desc: 'UF_INI — 화면 로드 시 파라미터 세팅 및 초기 조회',
    code: `$u.addHandler('UF_INI', function() {
  const params = $u.page.getPageParams();
  if (params.INIT_VALUE) {
    $u.get('FIELD_ID').setValue(params.INIT_VALUE);
  }
});` },

  // ── NST ──────────────────────────────────────────
  { category: 'NST', title: '조회 — is_data → ot_data', desc: 'is_data 전달 후 OT_DATA 배열 받아 그리드 바인딩',
    code: `const is_data = $u.getValues('search-condition');

$nst.is_data_ot_data('서비스ID', is_data, function(ot_data) {
  const gridObj = $u.gridWrapper.getGrid('그리드ID');
  gridObj.setJSONData(ot_data);
});` },
  { category: 'NST', title: '저장 — it_data → nsReturn', desc: '그리드 체크 행을 it_data로 전달 후 저장 결과 처리',
    code: `const gridObj = $u.gridWrapper.getGrid('그리드ID');
gridObj.asserts.rowSelected();
const it_data = gridObj.getSELECTEDJSONData();

$nst.it_data_nsReturn('서비스ID', it_data, function(nsReturn) {
  unidocuAlert(nsReturn.getReturnMessage(), function() {
    $u.buttons.triggerFormTableButtonClick(); // 저장 후 재조회
  });
});` },
  { category: 'NST', title: '저장 — is_data + it_data → nsReturn', desc: 'is_data(조건) + it_data(그리드 데이터) 함께 전달',
    code: `const is_data = $u.getValues('search-condition');
const gridObj = $u.gridWrapper.getGrid('그리드ID');
gridObj.asserts.rowSelected();
const it_data = gridObj.getSELECTEDJSONData();

$nst.is_data_it_data_nsReturn('서비스ID', is_data, it_data, function(nsReturn) {
  unidocuAlert(nsReturn.getReturnMessage(), function() {
    $u.buttons.triggerFormTableButtonClick();
  });
});` },
  { category: 'NST', title: '처리 후 단순 메시지', desc: 'is_data → returnMessage — 결과 메시지만 받아 alert',
    code: `const is_data = $u.getValues();

$nst.is_data_returnMessage('서비스ID', is_data, function(message) {
  unidocuAlert(message, function() {
    $u.buttons.triggerFormTableButtonClick();
  });
});` },
  { category: 'NST', title: 'nsReturn 전체 활용', desc: 'getTableReturn / getExportMap / getReturnMessage 조합 패턴',
    code: `const is_data = $u.getValues();

$nst.is_data_nsReturn('서비스ID', is_data, function(nsReturn) {
  const ot_data   = nsReturn.getTableReturn('OT_DATA');   // 테이블 반환
  const os_data   = nsReturn.getExportMap('OS_DATA');     // 맵 반환
  const message   = nsReturn.getReturnMessage();          // 단일 메시지
  const strReturn = nsReturn.getStringReturns();          // 문자열 맵

  const gridObj = $u.gridWrapper.getGrid('그리드ID');
  gridObj.setJSONData(ot_data);

  if (message) unidocuAlert(message);
});` },

  // ── PAGE ─────────────────────────────────────────
  { category: 'PAGE', title: '페이지 파라미터 조회', desc: 'getPageParams / getPROGRAM_ID / getVIEW_NAME 사용 패턴',
    code: `const params     = $u.page.getPageParams();
const programId  = $u.page.getPROGRAM_ID();
const viewName   = $u.page.getVIEW_NAME();` },
  { category: 'PAGE', title: '프로그램 ID로 화면 이동', desc: 'navigateByProgramId로 파라미터 전달 후 화면 전환',
    code: `$u.navigateByProgramId('TARGET_PRG_ID', {
  PARAM1: $u.get('FIELD1').getValue(),
  PARAM2: 'value'
});` },
  { category: 'PAGE', title: '페이지 새로고침 / 홈 이동', desc: '현재 화면 새로고침 또는 홈으로 이동',
    code: `// 현재 페이지 새로고침
$u.pageReload();

// 홈으로 이동
$u.moveToHome();` }
]

// ── DOM ───────────────────────────────────────────────
const tbody    = document.getElementById('tableBody')
const countEl  = document.getElementById('count')
const searchEl = document.getElementById('search')
const programFilterEl = document.getElementById('programFilter')
const detail   = document.getElementById('detail')
const liveList = document.getElementById('liveList')
const liveEmpty= document.getElementById('liveEmpty')
const liveCountEl = document.getElementById('liveCount')
const liveScroll  = document.getElementById('liveScroll')

// ── Background 포트 연결 ───────────────────────────────
const port = chrome.runtime.connect({ name: `devtools-${chrome.devtools.inspectedWindow.tabId}` })

port.onMessage.addListener((msg) => {
  if (msg.type === 'INIT') {
    const all = msg.events || []
    registeredEvents = all.filter(e => !e.fired)
    firedEvents      = all.filter(e => e.fired)
    registeredEvents.forEach(e => trackProgramId(e.programId))
    firedEvents.forEach(e => trackProgramId(e.programId))
    renderRegistered()
    renderLive()
  } else if (msg.type === 'NEW_EVENT') {
    trackProgramId(msg.event.programId)
    if (msg.event.fired) {
      firedEvents.push(msg.event)
      appendLiveItem(msg.event)
    } else {
      registeredEvents.push(msg.event)
      renderRegistered()
    }
  } else if (msg.type === 'PICK_RESULT') {
    handlePickResult(msg.info)
  } else if (msg.type === 'NST_CALL') {
    handleNstCall(msg.data)
  }
})

// ── 탭 전환 ───────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentTab = btn.dataset.tab
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')

    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'))
    document.getElementById(`tab-${currentTab}`).classList.add('active')

    document.getElementById('toolbar-registered').style.display = currentTab === 'registered' ? '' : 'none'
    document.getElementById('toolbar-realtime').style.display   = currentTab === 'realtime'   ? '' : 'none'
    document.getElementById('toolbar-nst').style.display        = currentTab === 'nst'        ? '' : 'none'
    document.getElementById('toolbar-ai').style.display         = currentTab === 'ai'         ? '' : 'none'
  })
})

// ── 프로그램 ID 드롭다운 관리 ─────────────────────────
function trackProgramId(id) {
  if (!id || knownProgramIds.has(id)) return
  knownProgramIds.add(id)
  const opt = document.createElement('option')
  opt.value = id
  opt.textContent = id
  programFilterEl.appendChild(opt)
}

// ── 비활성화 토글 헬퍼 ───────────────────────────────
function evDisableKey(ev) {
  return ev.fnKey || `${ev.type}:${ev.id}`
}

function buildDisableExpr(ev, disable) {
  const id = JSON.stringify(ev.id)
  if (ev.type === 'FLD' || ev.type === 'GRD') {
    const k = JSON.stringify(ev.fnKey)
    return disable
      ? `(window.__UNI_DISABLED__=window.__UNI_DISABLED__||new Set(),window.__UNI_DISABLED__.add(${k}),'ok')`
      : `(window.__UNI_DISABLED__&&window.__UNI_DISABLED__.delete(${k}),'ok')`
  }
  if (ev.type === 'BTN') {
    const orig = JSON.stringify(`BTN:${ev.id}`)
    return disable
      ? `(function(){window.__UNI_ORIG__=window.__UNI_ORIG__||{};var m=$u.buttons.getCustomHandlers();window.__UNI_ORIG__[${orig}]=m[${id}];m[${id}]=function(){};return 'ok'})()`
      : `(function(){var m=$u.buttons.getCustomHandlers();if(window.__UNI_ORIG__&&window.__UNI_ORIG__[${orig}])m[${id}]=window.__UNI_ORIG__[${orig}];return 'ok'})()`
  }
  if (ev.type === 'HDL') {
    const orig = JSON.stringify(`HDL:${ev.id}`)
    return disable
      ? `(function(){window.__UNI_ORIG__=window.__UNI_ORIG__||{};var m=$u.buttons.getHandler();window.__UNI_ORIG__[${orig}]=m[${id}];m[${id}]=function(){};return 'ok'})()`
      : `(function(){var m=$u.buttons.getHandler();if(window.__UNI_ORIG__&&window.__UNI_ORIG__[${orig}])m[${id}]=window.__UNI_ORIG__[${orig}];return 'ok'})()`
  }
  return null
}

function toggleDisable(ev) {
  const key = evDisableKey(ev)
  const isDisabled = disabledEvKeys.has(key)
  const expr = buildDisableExpr(ev, !isDisabled)
  if (!expr) return
  chrome.devtools.inspectedWindow.eval(expr, (result, isException) => {
    if (isException) { console.warn('[UNI] 비활성화 실패'); return }
    if (isDisabled) disabledEvKeys.delete(key)
    else disabledEvKeys.add(key)
    renderRegistered()
    if (detail.style.display !== 'none') showDetail(ev)
  })
}

// 실행 파라미터 포맷
function formatArgs(args) {
  return args.map(a => {
    if (a === null || a === undefined) return String(a)
    if (typeof a === 'object') { try { return JSON.stringify(a) } catch (e) { return '[obj]' } }
    return String(a)
  }).join(', ')
}

// ── 등록 탭 ───────────────────────────────────────────
function getFiltered() {
  return registeredEvents.filter(e => {
    const matchType = activeFilter === 'ALL' || e.type === activeFilter
    const matchProg = !activeProgramFilter || (e.programId || '') === activeProgramFilter
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || e.id?.toLowerCase().includes(q) || e.fnName?.toLowerCase().includes(q)
    return matchType && matchProg && matchSearch
  })
}

function renderRegistered() {
  const filtered = getFiltered()
  countEl.textContent = `${filtered.length} / ${registeredEvents.length} events`

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr class="no-data"><td colspan="5">표시할 이벤트 없음</td></tr>`
    return
  }

  tbody.innerHTML = filtered.map(e => {
    const isDis    = disabledEvKeys.has(evDisableKey(e))
    const docKey   = evDisableKey(e)
    const isDocSel = docSelectedKeys.has(docKey)
    return `
      <tr data-idx="${registeredEvents.indexOf(e)}" class="${isDis ? 'ev-disabled' : ''}">
        <td><input type="checkbox" class="doc-check" data-key="${docKey}" ${isDocSel ? 'checked' : ''} title="문서 생성 포함"></td>
        <td><button class="dis-toggle ${isDis ? 'off' : ''}" title="${isDis ? '활성화' : '비활성화'}">●</button></td>
        <td><span class="badge badge-${e.type}">${e.type}</span></td>
        <td class="prog-id">${e.programId || '-'}</td>
        <td>${e.id || '-'}</td>
        <td class="fn-name">${e.fnName || '-'}</td>
        <td class="event-name">${e.event || '-'}</td>
        <td class="time">${e.time || '-'}</td>
      </tr>
    `
  }).join('')

  tbody.querySelectorAll('tr[data-idx]').forEach(row => {
    const ev = registeredEvents[parseInt(row.dataset.idx)]
    row.querySelector('.doc-check')?.addEventListener('change', e => {
      e.stopPropagation()
      if (e.target.checked) docSelectedKeys.add(e.target.dataset.key)
      else docSelectedKeys.delete(e.target.dataset.key)
      updateDocCheckAll()
    })
    row.querySelector('.dis-toggle')?.addEventListener('click', e => {
      e.stopPropagation()
      toggleDisable(ev)
    })
    row.addEventListener('click', () => showDetail(ev))
  })
  updateDocCheckAll()
}

function buildExpr(ev) {
  // 감지 활성화 후 래퍼로 교체된 경우 __UNI_ORIG__ 원본 우선 사용
  if (ev.type === 'BTN') return `(window.__UNI_ORIG__ && window.__UNI_ORIG__["INSTR:BTN:${ev.id}"]) || $u.buttons.getCustomHandlers()["${ev.id}"]`
  if (ev.type === 'HDL') return `(window.__UNI_ORIG__ && window.__UNI_ORIG__["INSTR:HDL:${ev.id}"]) || $u.buttons.getHandler()["${ev.id}"]`
  if ((ev.type === 'FLD' || ev.type === 'GRD') && ev.fnKey) return `window.__UNI_FN_MAP__["${ev.fnKey}"]`
  return null
}

function goToSource(ev, btn) {
  const expr = buildExpr(ev)
  if (!expr) return

  const origText = btn.textContent
  btn.disabled = true
  btn.textContent = '...'

  chrome.runtime.sendMessage({
    type: 'GET_FUNCTION_LOCATION',
    tabId: chrome.devtools.inspectedWindow.tabId,
    expr
  }, (result) => {
    btn.disabled = false
    btn.textContent = origText
    if (!result || result.error || !result.url) {
      console.warn('[UNI] 소스 이동 실패:', result?.error)
      return
    }
    chrome.devtools.panels.openResource(result.url, result.lineNumber, () => {})
  })
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

function showDetail(ev) {
  detail.style.display = 'block'
  const srcLines = ev.src_code ? ev.src_code.split('\n').slice(0, 12).join('\n') : null

  const isDis = disabledEvKeys.has(evDisableKey(ev))
  detail.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      <span><strong>타입:</strong> ${ev.type}</span>
      <span><strong>ID:</strong> ${ev.id}</span>
      <span><strong>함수명:</strong> ${ev.fnName}</span>
      ${ev.event ? `<span><strong>이벤트:</strong> ${ev.event}</span>` : ''}
      <span><strong>출처:</strong> ${ev.src === 'scan' ? 'Scan' : '후킹'}</span>
      <div style="margin-left:auto;display:flex;gap:6px">
        <button id="askAiBtn">AI에게 묻기</button>
        <button id="disableBtn" style="padding:1px 8px;background:${isDis ? '#5a1a1a' : '#3a3a1a'};border:1px solid ${isDis ? '#aa4444' : '#7a7a2a'};color:${isDis ? '#ff8888' : '#cccc55'};border-radius:3px;cursor:pointer;font-size:11px">${isDis ? '▶ 활성화' : '⏸ 비활성화'}</button>
        ${(ev.type === 'BTN' || ev.type === 'HDL' || ((ev.type === 'FLD' || ev.type === 'GRD') && ev.fnKey)) ? `<button id="gotoBtn" style="padding:1px 8px;background:#2d7a2d;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px">소스 이동</button>` : ''}
        ${srcLines ? `<button id="copyBtn" style="padding:1px 8px;background:#0e639c;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px">복사</button>` : ''}
      </div>
    </div>
    ${srcLines
      ? `<pre style="margin:0;padding:6px 8px;background:#1a1a1a;border-radius:3px;overflow-x:auto;font-size:11px;line-height:1.5;color:#ce9178;max-height:160px;overflow-y:auto">${escapeHtml(srcLines)}</pre>`
      : '<span style="color:#555">소스 없음 (후킹으로 수집됨)</span>'
    }
  `

  document.getElementById('copyBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(ev.src_code || '')
  })

  document.getElementById('disableBtn')?.addEventListener('click', () => toggleDisable(ev))

  document.getElementById('gotoBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('gotoBtn')
    goToSource(ev, btn)
  })

  document.getElementById('askAiBtn')?.addEventListener('click', () => {
    sendEventToAI(ev)
  })
}

// 필터 버튼
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    activeFilter = btn.dataset.type
    renderRegistered()
  })
})

// 검색
searchEl.addEventListener('input', () => {
  searchQuery = searchEl.value
  renderRegistered()
})

// 프로그램 ID 필터
programFilterEl.addEventListener('change', () => {
  activeProgramFilter = programFilterEl.value
  renderRegistered()
})

// Scan
const scanBtn = document.getElementById('scanBtn')
scanBtn.addEventListener('click', () => {
  scanBtn.disabled = true; scanBtn.textContent = '...'

  const expr = `(function() {
    try {
      var handlers = $u.buttons.getHandler();
      var customHandlers = $u.buttons.getCustomHandlers();
      var out = { handlers: [], customHandlers: [] };
      function fnInfo(fn) {
        if (!fn) return { fnName: 'anonymous', src: '' };
        var src = ''; try { src = fn.toString(); } catch(e) {}
        return { fnName: fn.name || 'anonymous', src: src };
      }
      for (var id in handlers) {
        var i = fnInfo(handlers[id]);
        out.handlers.push({ id: id, fnName: i.fnName, src: i.src });
      }
      for (var id in customHandlers) {
        var i = fnInfo(customHandlers[id]);
        out.customHandlers.push({ id: id, fnName: i.fnName, src: i.src });
      }
      return out;
    } catch(e) { return { error: e.message }; }
  })()`

  // FLD jQuery 이벤트 스캔 — jQuery.cache에서 $u 필드에 걸린 핸들러 추출
  const fldScanExpr = `(function() {
    try {
      var jq = window.jQuery || window.$
      if (!jq || !jq.cache || !jq.expando) return []
      var expando = jq.expando
      var evTypes = ['change','click','keyup','keydown','blur','focus']
      var results = []
      var els = document.querySelectorAll('[id]')
      Array.from(els).forEach(function(el) {
        var key = el[expando]
        if (!key || !jq.cache[key] || !jq.cache[key].events) return
        var id = el.id
        if (!id) return
        try { var f = window.$u && $u.get(id); if (!f || !f.$el) return } catch(e) { return }
        var evData = jq.cache[key].events
        evTypes.forEach(function(evType) {
          var hs = evData[evType]
          if (!hs || !hs.length) return
          hs.forEach(function(h) {
            var fn = h.handler || h
            if (typeof fn !== 'function') return
            var src = ''; try { src = fn.toString() } catch(e) {}
            results.push({ id: id, event: evType, fnName: fn.name || 'anonymous', src: src })
          })
        })
      })
      return results
    } catch(e) { return [] }
  })()`

  chrome.devtools.inspectedWindow.eval(expr, (result, isException) => {
    scanBtn.disabled = false; scanBtn.textContent = 'Scan'
    if (isException || !result || result.error) {
      console.warn('[UNI] Scan 실패:', isException || result?.error)
      return
    }
    const now = new Date().toLocaleTimeString()
    const existing = new Set(registeredEvents.filter(e => e.src === 'scan').map(e => `${e.type}:${e.id}`))

    chrome.devtools.inspectedWindow.eval('(window.$u && window.$u.page && window.$u.page.getPROGRAM_ID) ? window.$u.page.getPROGRAM_ID() : ""', (programId) => {
      const pid = programId || ''
      trackProgramId(pid)
      result.handlers.forEach(({ id, fnName, src }) => {
        if (!existing.has(`HDL:${id}`)) registeredEvents.push({ type: 'HDL', id, fnName, time: now, src: 'scan', src_code: src, programId: pid })
      })
      result.customHandlers.forEach(({ id, fnName, src }) => {
        if (!existing.has(`BTN:${id}`)) registeredEvents.push({ type: 'BTN', id, fnName, time: now, src: 'scan', src_code: src, programId: pid })
      })

      // FLD 스캔 병렬 실행
      chrome.devtools.inspectedWindow.eval(fldScanExpr, (fldResult) => {
        if (Array.isArray(fldResult)) {
          fldResult.forEach(({ id, event, fnName, src }) => {
            const key = `FLD:${id}:${event}`
            if (!existing.has(key)) {
              const fnKey = `FLD:${id}:${event}:scan`
              registeredEvents.push({ type: 'FLD', id, event, fnName, time: now, src: 'scan', src_code: src, programId: pid, fnKey })
              existing.add(key)
            }
          })
        }
        renderRegistered()
      })
    })
  })
})

// 헤더 전체 선택 체크박스 상태 동기화
function updateDocCheckAll() {
  const el = document.getElementById('docCheckAll')
  if (!el) return
  const filtered = getFiltered()
  const selCount = filtered.filter(ev => docSelectedKeys.has(evDisableKey(ev))).length
  el.checked       = selCount > 0 && selCount === filtered.length
  el.indeterminate = selCount > 0 && selCount < filtered.length
}

// 헤더 체크박스 — 현재 필터된 이벤트 전체 선택/해제
document.getElementById('docCheckAll').addEventListener('change', e => {
  getFiltered().forEach(ev => {
    if (e.target.checked) docSelectedKeys.add(evDisableKey(ev))
    else docSelectedKeys.delete(evDisableKey(ev))
  })
  renderRegistered()
})

// Clear (등록)
document.getElementById('clearBtn').addEventListener('click', () => {
  registeredEvents = []
  docSelectedKeys.clear()
  detail.style.display = 'none'
  renderRegistered()
})

// ── 실시간 탭 ─────────────────────────────────────────
function liveKey(ev) {
  return `${ev.type}:${ev.id}:${ev.event || ''}`
}

function appendLiveItem(ev) {
  liveEmpty.style.display = 'none'
  liveCountEl.textContent = `${firedEvents.length} fired`

  const key = liveKey(ev)
  const existing = liveItemMap[key]

  if (existing) {
    existing.count++
    existing.countEl.textContent = `×${existing.count}`
    existing.countEl.style.display = ''
    if (ev.duration !== undefined) {
      existing.durEl.textContent = `${ev.duration}ms`
      existing.durEl.className = `live-dur ${ev.duration >= 500 ? 'slow' : 'fast'}`
    }
    if (existing.argsEl && ev.args && ev.args.length) {
      existing.argsEl.textContent = `(${formatArgs(ev.args)})`
    }
    liveScroll.scrollTop = liveScroll.scrollHeight
    return
  }

  const canGoto = !!buildExpr(ev)
  const li = document.createElement('li')
  li.style.cursor = canGoto ? 'pointer' : 'default'
  li.title = canGoto ? '클릭하여 소스 이동' : ''
  li.innerHTML = `
    <span class="live-time">${ev.time}</span>
    <span class="badge badge-${ev.type}">${ev.type}</span>
    ${ev.programId ? `<span class="live-prog">${ev.programId}</span>` : ''}
    <span class="live-id">${ev.id}</span>
    <span class="live-fn">${ev.fnName}</span>
    ${ev.event ? `<span class="live-ev">${ev.event}</span>` : ''}
    ${ev.duration !== undefined ? `<span class="live-dur ${ev.duration >= 500 ? 'slow' : 'fast'}">${ev.duration}ms</span>` : ''}
    ${ev.args && ev.args.length ? `<span class="live-args">(${formatArgs(ev.args)})</span>` : ''}
    <span class="live-count" style="display:none"></span>
    ${canGoto ? `<span style="margin-left:auto;color:#2d7a2d;font-size:10px">→ 소스</span>` : ''}
  `
  if (canGoto) {
    li.addEventListener('click', () => {
      const indicator = li.querySelector('span[style*="margin-left"]')
      goToSource(ev, indicator || li)
    })
  }

  liveItemMap[key] = {
    li,
    countEl: li.querySelector('.live-count'),
    durEl: li.querySelector('.live-dur'),
    argsEl: li.querySelector('.live-args'),
    count: 1
  }

  liveList.appendChild(li)
  liveScroll.scrollTop = liveScroll.scrollHeight
}

function renderLive() {
  liveList.innerHTML = ''
  liveCountEl.textContent = `${firedEvents.length} fired`
  if (firedEvents.length === 0) {
    liveEmpty.style.display = 'block'
    return
  }
  liveEmpty.style.display = 'none'
  firedEvents.forEach(appendLiveItem)
}

// 감지 활성화 — Scan에서 찾은 BTN/HDL 함수를 실행 추적 래퍼로 교체
const instrumentBtn = document.getElementById('instrumentBtn')
instrumentBtn.addEventListener('click', () => {
  instrumentBtn.disabled = true; instrumentBtn.textContent = '...'

  const expr = `(function() {
    try {
      function wrap(map, type) {
        window.__UNI_ORIG__ = window.__UNI_ORIG__ || {};
        for (var id in map) {
          (function(fnId, orig) {
            // 래핑 전 원본 보존 → 소스 이동 시 사용
            window.__UNI_ORIG__['INSTR:' + type + ':' + fnId] = orig;
            map[fnId] = function() {
              var markName = 'uni:' + type + ':' + fnId;
              performance.mark(markName + ':start');
              var t0 = performance.now();
              var ret = orig.apply(this, arguments);
              var duration = Math.round(performance.now() - t0);
              performance.mark(markName + ':end');
              try { performance.measure(markName, markName + ':start', markName + ':end'); } catch(_) {}
              var args = window.__UNI_SAFE_ARGS__ ? window.__UNI_SAFE_ARGS__(arguments) : [];
              window.postMessage({ __UNI_EV__: true, event: {
                type: type, id: fnId, fnName: orig.name || 'anonymous',
                fired: true, time: new Date().toLocaleTimeString(),
                programId: (window.$u && window.$u.page && window.$u.page.getPROGRAM_ID) ? window.$u.page.getPROGRAM_ID() : '',
                duration: duration, ts: Date.now(), args: args
              }}, '*');
              return ret;
            };
          })(id, map[id]);
        }
      }
      wrap($u.buttons.getCustomHandlers(), 'BTN');
      wrap($u.buttons.getHandler(), 'HDL');
      return 'ok';
    } catch(e) { return { error: e.message }; }
  })()`

  chrome.devtools.inspectedWindow.eval(expr, (result, isException) => {
    instrumentBtn.disabled = false
    if (isException || result?.error) {
      instrumentBtn.textContent = '실패'
      console.warn('[UNI] instrument 실패:', result?.error)
      return
    }
    instrumentBtn.textContent = '감지 중 ✓'
    instrumentBtn.style.background = '#1a5c1a'
  })
})

// ── 엘리먼트 피커 ─────────────────────────────────────────
const pickBtn = document.getElementById('pickBtn')
let pickMode = false

function resetPickBtn() {
  pickMode = false
  pickBtn.textContent = '고르기'
  pickBtn.style.background = '#4a3a6a'
  pickBtn.disabled = false
}

pickBtn.addEventListener('click', () => {
  if (pickMode) return
  pickMode = true
  pickBtn.textContent = '클릭...'
  pickBtn.style.background = '#7a3a1a'
  pickBtn.disabled = true

  // 오버레이 없이 캡처 단계 클릭 리스너 사용 → e.target이 실제 클릭된 요소
  const injectExpr = `(function() {
    window.__UNI_PICK_RESULT__ = null
    var origCursor = document.body.style.cursor
    document.body.style.cursor = 'crosshair'

    function cleanup() {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('keydown', onEsc, true)
      document.body.style.cursor = origCursor
    }

    function onClick(e) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      cleanup()

      var clickX = e.clientX, clickY = e.clientY
      var candidates = []

      // 1순위: F8 debug 스팬 — 클릭 위치에서 가장 가까운 .unidocu-debug 텍스트 사용
      var debugSpans = Array.from(document.querySelectorAll('.unidocu-debug'))
      if (debugSpans.length) {
        var closest = null, minDist = Infinity
        debugSpans.forEach(function(span) {
          var rect = span.getBoundingClientRect()
          var cx = rect.left + rect.width / 2
          var cy = rect.top + rect.height / 2
          var dist = Math.sqrt((cx - clickX) * (cx - clickX) + (cy - clickY) * (cy - clickY))
          if (dist < minDist) { minDist = dist; closest = span }
        })
        if (closest && minDist < 300) {
          var debugId = closest.textContent.trim()
          if (debugId) candidates.push(debugId)
        }
      }

      // 2순위: DOM 조상 체인 ID 탐색 (폴백)
      var cur = e.target
      while (cur && cur !== document.body) {
        if (cur.id) candidates.push(cur.id)
        if (cur.name) candidates.push(cur.name)
        if (cur.dataset) Object.values(cur.dataset).forEach(function(v) { if (v && v.length < 60) candidates.push(v) })
        cur = cur.parentElement
      }
      candidates = candidates.filter(function(v, i, a) { return v && a.indexOf(v) === i })

      // $u 필드 확인
      var fieldIds = []
      candidates.forEach(function(id) {
        try { var f = window.$u && $u.get(id); if (f && f.$el) fieldIds.push(id) } catch(e2) {}
      })

      // $u 핸들러 맵 교차 확인
      var verifiedHDL = [], verifiedBTN = []
      try {
        var hm = window.$u && typeof $u.buttons.getHandler === 'function' ? $u.buttons.getHandler() : {}
        var bm = window.$u && typeof $u.buttons.getCustomHandlers === 'function' ? $u.buttons.getCustomHandlers() : {}
        candidates.forEach(function(c) {
          if (hm[c] !== undefined) verifiedHDL.push(c)
          if (bm[c] !== undefined) verifiedBTN.push(c)
        })
      } catch(e3) {}

      window.__UNI_PICK_RESULT__ = {
        candidates: candidates.slice(0, 24),
        fieldIds: fieldIds,
        verifiedHDL: verifiedHDL,
        verifiedBTN: verifiedBTN,
        usedDebug: debugSpans.length > 0
      }
    }

    function onEsc(e) {
      if (e.key !== 'Escape') return
      cleanup()
      window.__UNI_PICK_RESULT__ = { cancelled: true }
    }

    document.addEventListener('click', onClick, true)
    document.addEventListener('keydown', onEsc, true)
    return 'ok'
  })()`

  const prevCount = countEl.textContent
  countEl.textContent = '주입 중...'

  chrome.devtools.inspectedWindow.eval(injectExpr, (result, exInfo) => {
    if (exInfo || result !== 'ok') {
      resetPickBtn()
      countEl.textContent = `주입 실패: ${exInfo?.description || String(result)}`
      setTimeout(() => { countEl.textContent = prevCount }, 4000)
      return
    }

    // 주입 성공 → 페이지에서 클릭 대기
    countEl.textContent = 'F8(debug) 후 클릭 — ESC 취소'

    const poll = setInterval(() => {
      chrome.devtools.inspectedWindow.eval('window.__UNI_PICK_RESULT__', (res, err) => {
        if (err || res === null || res === undefined) return
        clearInterval(poll)
        chrome.devtools.inspectedWindow.eval('window.__UNI_PICK_RESULT__ = null', () => {})
        countEl.textContent = `후보: [${(res.candidates || []).slice(0, 5).join(', ')}]`
        setTimeout(() => handlePickResult(res), 100)
      })
    }, 300)

    setTimeout(() => { clearInterval(poll); resetPickBtn(); countEl.textContent = prevCount }, 30000)
  })
})

function handlePickResult(info) {
  resetPickBtn()
  if (info.cancelled) return

  const { candidates = [], fieldIds = [], verifiedHDL = [], verifiedBTN = [] } = info
  const allCandidates = [...new Set([...candidates, ...fieldIds])]

  // registeredEvents(Scan/후킹 수집분)에서 매칭
  let matches = registeredEvents.filter(ev =>
    allCandidates.some(c => c && ev.id && (ev.id === c || ev.id.startsWith(c + '/') || c.startsWith(ev.id + '/')))
  )

  // registeredEvents에 없지만 $u 핸들러 맵에 실재하는 경우 → Scan 유도
  if (!matches.length && (verifiedHDL.length || verifiedBTN.length)) {
    const ids = [
      ...verifiedHDL.map(id => `HDL:${id}`),
      ...verifiedBTN.map(id => `BTN:${id}`)
    ].join(', ')
    const prev = countEl.textContent
    countEl.textContent = `Scan 후 재시도 — ${ids}`
    setTimeout(() => { countEl.textContent = prev }, 4000)
    return
  }

  if (!matches.length) {
    const prev = countEl.textContent
    countEl.textContent = `후보: [${allCandidates.slice(0, 4).join(', ')}] — 매칭 없음`
    setTimeout(() => { countEl.textContent = prev }, 3000)
    return
  }

  // 등록 탭 전환 + 필터 초기화
  document.querySelector('.tab-btn[data-tab="registered"]').click()
  activeFilter = 'ALL'
  searchQuery = ''
  activeProgramFilter = ''
  searchEl.value = ''
  programFilterEl.value = ''
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'))
  document.querySelector('.filter-btn[data-type="ALL"]').classList.add('active')
  renderRegistered()

  // 매칭된 행 하이라이트
  let firstRow = null
  matches.forEach(ev => {
    const idx = registeredEvents.indexOf(ev)
    const row = tbody.querySelector(`tr[data-idx="${idx}"]`)
    if (!row) return
    row.classList.add('ev-highlight')
    setTimeout(() => row.classList.remove('ev-highlight'), 2100)
    if (!firstRow) firstRow = row
  })
  if (firstRow) firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' })

  countEl.textContent = `${matches.length}개 매칭`
  setTimeout(() => {
    const filtered = getFiltered()
    countEl.textContent = `${filtered.length} / ${registeredEvents.length} events`
  }, 2500)
}

// Clear (실시간)
document.getElementById('clearLiveBtn').addEventListener('click', () => {
  firedEvents = []
  liveItemMap = {}
  liveList.innerHTML = ''
  liveEmpty.style.display = 'block'
  liveCountEl.textContent = '0 fired'
})

// ── 초기 렌더 ─────────────────────────────────────────
renderRegistered()

// 디버그용 전역 노출
window.__UNI__ = { get reg() { return registeredEvents }, get fired() { return firedEvents } }

// ── AI 가이드 ──────────────────────────────────────────
let aiHistory = [] // { role, content }
let pendingEventContext = null // { ev, sourceCode }
const aiMessagesEl  = document.getElementById('ai-messages')
const aiInputEl     = document.getElementById('aiInput')
const aiSendBtn     = document.getElementById('aiSend')
const aiKeyInput    = document.getElementById('aiKeyInput')
const ragUrlInput   = document.getElementById('ragUrlInput')
const aiKeyArea     = document.getElementById('ai-key-area')
const aiUseContext  = document.getElementById('aiUseContext')
const aiProvider    = document.getElementById('aiProvider')

const PROVIDER_PLACEHOLDERS = { groq: 'gsk_...', upstage: 'up_...' }

// Provider 변경 시 placeholder 업데이트
aiProvider.addEventListener('change', () => {
  const p = aiProvider.value
  aiKeyInput.placeholder = PROVIDER_PLACEHOLDERS[p] || ''
  aiKeyInput.value = ''
  chrome.storage.local.get([p + 'ApiKey'], (res) => {
    if (res[p + 'ApiKey']) aiKeyInput.value = res[p + 'ApiKey']
  })
})

// API Key + RAG URL 로드
chrome.storage.local.get(['groqApiKey', 'upstageApiKey', 'ragUrl', 'aiProvider'], (res) => {
  if (res.aiProvider) aiProvider.value = res.aiProvider
  const key = res[aiProvider.value + 'ApiKey']
  if (key) aiKeyInput.value = key
  if (res.ragUrl) ragUrlInput.value = res.ragUrl
  aiKeyInput.placeholder = PROVIDER_PLACEHOLDERS[aiProvider.value] || ''
})

// API Key 저장
document.getElementById('aiKeySave').addEventListener('click', () => {
  const key = aiKeyInput.value.trim()
  const ragUrl = ragUrlInput.value.trim()
  const provider = aiProvider.value
  if (!key) return
  var saveObj = { ragUrl: ragUrl || '', aiProvider: provider }
  saveObj[provider + 'ApiKey'] = key
  chrome.storage.local.set(saveObj, () => {
    aiKeyInput.blur()
    document.getElementById('aiKeyToggle').textContent = '🔑 API Key ✓'
  })
})

// API Key 토글
document.getElementById('aiKeyToggle').addEventListener('click', () => {
  aiKeyArea.style.display = aiKeyArea.style.display === 'flex' ? 'none' : 'flex'
})

// Clear
document.getElementById('clearAiBtn').addEventListener('click', () => {
  aiHistory = []
  aiMessagesEl.innerHTML = '<p class="ai-empty">Groq API Key를 설정하고 질문을 입력하세요.<br>예: 버튼 클릭 시 그리드 체크된 행만 가져오는 코드</p>'
})

// 마크다운 → HTML 변환 (코드블록 + 인라인코드 + 볼드)
function renderMarkdown(text) {
  const parts = []
  const codeBlockRe = /```[\w]*\n?([\s\S]*?)```/g
  let last = 0, m
  while ((m = codeBlockRe.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', content: text.slice(last, m.index) })
    parts.push({ type: 'code', content: m[1].trimEnd() })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) })

  return parts.map(p => {
    if (p.type === 'code') {
      const id = `cb_${Date.now()}_${Math.random().toString(36).slice(2)}`
      return `<div class="ai-code-block"><pre id="${id}">${escapeHtml(p.content)}</pre><button class="ai-copy-btn" data-target="${id}">복사</button></div>`
    }
    const html = escapeHtml(p.content)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<span class="ai-inline-code">$1</span>')
      .replace(/\n/g, '<br>')
    return `<span class="ai-msg-body">${html}</span>`
  }).join('')
}

function appendAiMessage(role, content) {
  const empty = aiMessagesEl.querySelector('.ai-empty')
  if (empty) empty.remove()

  const div = document.createElement('div')
  div.className = `ai-msg ${role}`
  div.innerHTML = `<span class="ai-msg-role">${role === 'user' ? '나' : 'AI'}</span><div class="ai-msg-body">${renderMarkdown(content)}</div>`

  div.querySelectorAll('.ai-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pre = document.getElementById(btn.dataset.target)
      navigator.clipboard.writeText(pre?.textContent || '').then(() => {
        btn.textContent = '✓'
        setTimeout(() => { btn.textContent = '복사' }, 1500)
      })
    })
  })

  aiMessagesEl.appendChild(div)
  aiMessagesEl.scrollTop = aiMessagesEl.scrollHeight
}

function buildContext() {
  if (!aiUseContext.checked || !registeredEvents.length) return ''
  const programId = registeredEvents.find(e => e.programId)?.programId || ''
  const summary = registeredEvents.slice(0, 30).map(e =>
    `${e.type} | ${e.id}${e.event ? ' | ' + e.event : ''} | ${e.fnName}`
  ).join('\n')
  return `\n\n[현재 화면 컨텍스트]\n프로그램 ID: ${programId || '(미확인)'}\n등록된 이벤트:\n${summary}`
}

function buildEventContext() {
  if (!pendingEventContext) return ''
  const { ev, sourceCode, callees, runtimeChain, uniChain } = pendingEventContext
  let ctx = `\n\n[분석 대상 이벤트]\n타입: ${ev.type} | ID: ${ev.id}`
  if (ev.event) ctx += ` | 이벤트: ${ev.event}`
  if (ev.fnName) ctx += ` | 함수명: ${ev.fnName}`

  if (sourceCode) ctx += `\n\n[소스 코드]\n\`\`\`js\n${sourceCode}\n\`\`\``

  if (callees && callees.length) {
    ctx += `\n\n[정적 분석 — 내부에서 호출된 함수 소스]`
    callees.forEach(c => {
      ctx += `\n\n// ${c.name}\n\`\`\`js\n${c.src.slice(0, 1000)}\n\`\`\``
    })
  }

  if (uniChain && uniChain.length) {
    ctx += `\n\n[$u 이벤트 호출 체인 — 이 핸들러에서 연쇄 호출되는 $u 핸들러]`
    uniChain.forEach(c => {
      if (c.type === 'TRIGGER') {
        ctx += `\n  → triggerFormTableButtonClick() (조회 버튼 재실행)`
        return
      }
      ctx += `\n\n  → [${c.type}:${c.id}]${c.ev?.fnName ? ` (${c.ev.fnName})` : ' (미등록 또는 Scan 필요)'}`
      if (c.ev?.src_code) ctx += `\n\`\`\`js\n${c.ev.src_code.slice(0, 600)}\n\`\`\``
    })
  }

  if (runtimeChain && runtimeChain.length) {
    ctx += `\n\n[런타임 호출 체인 — 최근 실행 시 같은 구간에서 발생한 이벤트]`
    runtimeChain.forEach(e => {
      ctx += `\n  +${e.relativeMs}ms  [${e.type}] ${e.id}${e.event ? '.' + e.event : ''}  (${e.duration}ms)`
    })
  }

  return ctx
}

function renderPendingContext() {
  document.getElementById('ai-context-card')?.remove()
  if (!pendingEventContext) return
  const { ev, sourceCode, callees, runtimeChain, uniChain } = pendingEventContext
  const card = document.createElement('div')
  card.id = 'ai-context-card'
  card.innerHTML = `
    <span class="badge badge-${ev.type}">${ev.type}</span>
    <span style="color:#9cdcfe">${ev.id}</span>
    ${ev.event ? `<span style="color:#ce9178">${ev.event}</span>` : ''}
    <span style="color:#dcdcaa">${ev.fnName || ''}</span>
    ${sourceCode ? '<span class="ctx-source">소스 ✓</span>' : '<span class="ctx-no-source">소스 없음</span>'}
    ${callees?.length ? `<span style="color:#dcdcaa;font-size:10px">+${callees.length}개 함수</span>` : ''}
    ${uniChain?.length ? `<span style="color:#ce9178;font-size:10px">체인 ${uniChain.length}건</span>` : ''}
    ${runtimeChain?.length ? `<span style="color:#6abf69;font-size:10px">런타임 ${runtimeChain.length}건</span>` : ''}
    <button id="clearContextBtn">✕</button>
  `
  document.getElementById('ai-input-area').insertBefore(card, aiInputEl)
  document.getElementById('clearContextBtn').addEventListener('click', () => {
    pendingEventContext = null
    card.remove()
  })
}

// ── 정적 분석: 소스에서 호출 함수명 추출 ─────────────────
const SKIP_CALLS = new Set([
  'if','else','for','while','do','switch','case','break','continue','return',
  'throw','try','catch','finally','new','delete','typeof','instanceof','void',
  'var','let','const','function','class','async','await','yield',
  'true','false','null','undefined','NaN','Infinity',
  'alert','confirm','prompt','console','window','document','navigator','location',
  'setTimeout','clearTimeout','setInterval','clearInterval','requestAnimationFrame',
  'performance','JSON','Math','Date','Object','Array','String','Number','Boolean',
  'RegExp','Error','Promise','Map','Set','WeakMap','WeakSet','Symbol','Proxy',
  'parseInt','parseFloat','isNaN','isFinite','encodeURIComponent','decodeURIComponent',
  'apply','call','bind','toString','valueOf','hasOwnProperty','length','push','pop',
  'slice','splice','map','filter','reduce','forEach','find','indexOf','join',
])

function extractFunctionCalls(src) {
  // 메서드 호출(obj.fn)은 제외하고 독립 호출만 추출
  const re = /(?<![.\w$])([a-zA-Z_][\w$]*)\s*\(/g
  const found = new Set()
  let m
  while ((m = re.exec(src)) !== null) {
    const name = m[1]
    if (!SKIP_CALLS.has(name) && name.length >= 3 && !name.startsWith('$')) {
      found.add(name)
    }
  }
  return [...found].slice(0, 10) // 최대 10개로 제한
}

// ── 정적 분석: 페이지 컨텍스트에서 함수 소스 resolve ─────
function resolveCallees(names, callback) {
  if (!names.length) { callback([]); return }
  const results = []
  let pending = names.length

  names.forEach(name => {
    // window[name] 우선, 없으면 직접 참조 시도 (글로벌 함수)
    const expr = `(function(){try{var f=typeof window["${name}"]=="function"?window["${name}"]:${name};return typeof f=="function"?f.toString():null}catch(e){return null}})()`
    chrome.devtools.inspectedWindow.eval(expr, (result, isException) => {
      if (!isException && result && typeof result === 'string' && result.length < 5000) {
        results.push({ name, src: result })
      }
      if (--pending === 0) callback(results)
    })
  })
}

function resolveCalleesAsync(names) {
  return new Promise(resolve => resolveCallees(names, resolve))
}

// ── 정적 분석: 재귀 callTree 구축 ────────────────────────
async function buildCallTree(rootSrc, opts = {}) {
  const maxDepth = opts.maxDepth ?? 3
  const maxNodes = opts.maxNodes ?? 15
  const visited = new Set() // 같은 함수 재방문 방지 (순환 + 중복 제거)
  let nodeCount = 0

  async function expand(parentSrc, depth) {
    if (depth > maxDepth || nodeCount >= maxNodes) return []
    const names = extractFunctionCalls(parentSrc).filter(n => !visited.has(n))
    if (!names.length) return []

    const remaining = maxNodes - nodeCount
    const slice = names.slice(0, remaining)
    slice.forEach(n => visited.add(n)) // 동시 호출 중복 방지를 위해 미리 마킹

    const resolved = await resolveCalleesAsync(slice)
    const children = []
    for (const r of resolved) {
      nodeCount++
      const node = { name: r.name, src: r.src, depth, children: [] }
      children.push(node)
    }

    // 각 자식에 대해 다음 레벨 확장
    for (const child of children) {
      child.children = await expand(child.src, depth + 1)
    }
    return children
  }

  return {
    name: '__root__',
    src: rootSrc,
    depth: 0,
    children: await expand(rootSrc, 1),
    nodeCount
  }
}

// ── 런타임 체인: ts+duration 윈도우로 내부 호출 이벤트 추출 ─
function buildRuntimeChain(ev) {
  if (!ev.ts || ev.duration === undefined) return []
  const start = ev.ts - ev.duration
  return firedEvents
    .filter(e => e.ts && e.ts >= start && e.ts <= ev.ts && !(e.type === ev.type && e.id === ev.id))
    .map(e => ({ ...e, relativeMs: e.ts - start }))
    .sort((a, b) => a.relativeMs - b.relativeMs)
}

// ── $u 이벤트 호출 체인 추출 ─────────────────────────────
// 소스에서 runCustomHandler/runHandler 호출 패턴을 재귀적으로 따라가
// 실제 등록된 $u 핸들러 소스를 체인으로 구성
function extractUniChain(src, visited = new Set()) {
  if (!src) return []
  const chain = []

  // runCustomHandler('X') → BTN:X
  const btnRe = /runCustomHandler\s*\(\s*['"]([^'"]+)['"]/g
  let m
  while ((m = btnRe.exec(src)) !== null) {
    const id = m[1]
    const key = `BTN:${id}`
    if (visited.has(key)) continue
    visited.add(key)
    const ev = registeredEvents.find(e => e.type === 'BTN' && e.id === id)
    chain.push({ type: 'BTN', id, ev: ev || null })
    if (ev?.src_code) chain.push(...extractUniChain(ev.src_code, visited))
  }

  // runHandler('X') → HDL:X
  const hdlRe = /runHandler\s*\(\s*['"]([^'"]+)['"]/g
  while ((m = hdlRe.exec(src)) !== null) {
    const id = m[1]
    const key = `HDL:${id}`
    if (visited.has(key)) continue
    visited.add(key)
    const ev = registeredEvents.find(e => e.type === 'HDL' && e.id === id)
    chain.push({ type: 'HDL', id, ev: ev || null })
    if (ev?.src_code) chain.push(...extractUniChain(ev.src_code, visited))
  }

  // triggerFormTableButtonClick() → 조회 버튼 재실행 표시
  if (/triggerFormTableButtonClick\s*\(/.test(src) && !visited.has('__trigger__')) {
    visited.add('__trigger__')
    chain.push({ type: 'TRIGGER', id: 'triggerFormTableButtonClick', ev: null })
  }

  return chain
}

function sendEventToAI(ev) {
  // AI 탭 + 채팅 서브탭으로 전환
  document.querySelector('.tab-btn[data-tab="ai"]').click()
  document.querySelectorAll('.ai-sub-tab').forEach(b => b.classList.remove('active'))
  document.querySelector('.ai-sub-tab[data-subtab="chat"]').classList.add('active')
  document.getElementById('ai-chat-view').style.display     = 'flex'
  document.getElementById('ai-patterns-view').style.display = 'none'

  function finalize(sourceCode, callees, runtimeChain, uniChain) {
    pendingEventContext = { ev, sourceCode, callees, runtimeChain, uniChain }
    renderPendingContext()
    aiInputEl.focus()
  }

  function proceed(sourceCode) {
    const runtimeChain = buildRuntimeChain(ev)
    const uniChain = extractUniChain(sourceCode)
    if (sourceCode) {
      const names = extractFunctionCalls(sourceCode)
      if (names.length) {
        resolveCallees(names, callees => finalize(sourceCode, callees, runtimeChain, uniChain))
        return
      }
    }
    finalize(sourceCode, [], runtimeChain, uniChain)
  }

  if (ev.src_code) { proceed(ev.src_code); return }

  const expr = buildExpr(ev)
  if (expr) {
    chrome.devtools.inspectedWindow.eval(`(${expr}).toString()`, (result, isException) => {
      proceed(isException ? null : result)
    })
    return
  }

  proceed(null)
}

async function collectPageContext() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return resolve(null)
      chrome.tabs.sendMessage(tabs[0].id, { type: 'COLLECT_PAGE_CONTEXT' }, (res) => {
        resolve(chrome.runtime.lastError ? null : res)
      })
    })
  })
}

function buildPageContext(ctx) {
  if (!ctx) return ''
  var lines = []
  if (ctx.fields && Object.keys(ctx.fields).length) {
    lines.push('[현재 필드 값]')
    Object.keys(ctx.fields).forEach(function(k) { lines.push(`  ${k}: ${ctx.fields[k]}`) })
  }
  if (ctx.grids && Object.keys(ctx.grids).length) {
    lines.push('[그리드 컬럼]')
    Object.keys(ctx.grids).forEach(function(gridId) {
      var headers = ctx.grids[gridId]
      var cols = Array.isArray(headers) ? headers.map(function(h) { return h.fieldName || h.name || h }).join(', ') : JSON.stringify(headers)
      lines.push(`  ${gridId}: ${cols}`)
    })
  }
  return lines.length ? '\n\n' + lines.join('\n') : ''
}

async function sendAiMessage() {
  const question = aiInputEl.value.trim()
  if (!question) return

  const apiKey = aiKeyInput.value.trim()
  if (!apiKey) {
    aiKeyArea.style.display = 'flex'
    aiKeyInput.focus()
    return
  }

  aiInputEl.value = ''
  aiSendBtn.disabled = true
  aiSendBtn.textContent = '...'

  const pageCtx = await collectPageContext()
  const hasSourceContext = !!(pendingEventContext?.sourceCode)
  const hasEventContext  = !!(pendingEventContext) // 이벤트 컨텍스트 첨부 여부 → 분석 모드 전환 트리거
  const content = question + buildEventContext() + buildContext() + buildPageContext(pageCtx)
  appendAiMessage('user', question)
  aiHistory.push({ role: 'user', content })

  // 전송 후 이벤트 컨텍스트 초기화
  pendingEventContext = null
  document.getElementById('ai-context-card')?.remove()

  const thinkingDiv = document.createElement('div')
  thinkingDiv.className = 'ai-msg assistant'
  thinkingDiv.innerHTML = '<span class="ai-msg-role">AI</span><span style="color:#555;font-size:11px">생각 중...</span>'
  aiMessagesEl.appendChild(thinkingDiv)
  aiMessagesEl.scrollTop = aiMessagesEl.scrollHeight

  const ragUrl = ragUrlInput.value.trim() || null
  const provider = aiProvider.value
  const trimmedMessages = aiHistory.length > 8 ? aiHistory.slice(-8) : aiHistory
  chrome.runtime.sendMessage({ type: 'GROQ_CHAT', apiKey, provider, messages: trimmedMessages, ragUrl, hasSourceContext, hasEventContext, question }, (res) => {
    thinkingDiv.remove()
    aiSendBtn.disabled = false
    aiSendBtn.textContent = '전송'

    if (!res || !res.ok) {
      appendAiMessage('assistant', `오류: ${res?.error || '알 수 없는 오류'}`)
      aiHistory.pop()
      return
    }

    aiHistory.push({ role: 'assistant', content: res.content })
    appendAiMessage('assistant', res.content)
  })
}

aiSendBtn.addEventListener('click', sendAiMessage)
aiInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAiMessage() }
})

// ── 문서 생성 (기능 6) ────────────────────────────────
document.getElementById('docBtn').addEventListener('click', generateDoc)

async function generateDoc() {
  if (!docSelectedKeys.size) {
    alert('문서 생성할 이벤트를 체크해주세요.\n(헤더 체크박스로 전체 선택 가능)')
    return
  }
  const targetEvents = registeredEvents.filter(ev => docSelectedKeys.has(evDisableKey(ev)))
  if (!targetEvents.length) {
    alert('이벤트가 없습니다. Scan 또는 페이지 새로고침 후 시도하세요.')
    return
  }

  // 저장된 API Key + Provider 로드
  const { provider, apiKey } = await new Promise(resolve => {
    chrome.storage.local.get(['aiProvider', 'groqApiKey', 'upstageApiKey'], res => {
      const p = res.aiProvider || 'groq'
      resolve({ provider: p, apiKey: res[p + 'ApiKey'] || '' })
    })
  })

  const overlay = document.getElementById('doc-overlay')
  const progressText = document.getElementById('doc-progress-text')
  const progressBar = document.getElementById('doc-progress-bar')
  overlay.style.display = 'flex'
  progressBar.style.width = '0%'

  // 1단계: 이벤트별 소스 코드 수집 (병렬)
  progressText.textContent = '소스 코드 수집 중...'
  const enriched = await Promise.all(targetEvents.map(ev =>
    new Promise(resolve => {
      // Scan으로 수집된 것은 src_code 바로 사용
      if (ev.src_code) { resolve({ ev, src: ev.src_code }); return }
      // 후킹으로 수집된 것은 fnKey/expr로 eval하여 .toString()
      const expr = buildExpr(ev)
      if (expr) {
        chrome.devtools.inspectedWindow.eval(`(${expr}).toString()`, (result, isException) => {
          resolve({ ev, src: isException ? null : result })
        })
        return
      }
      resolve({ ev, src: null })
    })
  ))

  // 2단계: 소스 있는 이벤트에 대해 AI 설명 순차 생성
  const withSrc = enriched.filter(r => r.src)
  if (apiKey && withSrc.length > 0) {
    for (let i = 0; i < withSrc.length; i++) {
      progressText.textContent = `AI 설명 생성 중... (${i + 1} / ${withSrc.length})`
      progressBar.style.width = `${Math.round(((i + 1) / withSrc.length) * 100)}%`
      // 함수 선언 위 JSDoc 먼저 조회 (있으면 AI 프롬프트에 우선 반영)
      const jsdoc = await getJsdocForEvent(withSrc[i].ev)
      withSrc[i].desc = await getAiDescription(apiKey, provider, withSrc[i].ev, withSrc[i].src, jsdoc)
      // rate limit 방지
      if (i < withSrc.length - 1) await new Promise(r => setTimeout(r, 200))
    }
  }

  overlay.style.display = 'none'

  // 3단계: Markdown 생성 + 다운로드
  const programId = enriched.find(r => r.ev.programId)?.ev.programId || 'UNKNOWN'
  const dateStr = new Date().toISOString().slice(0, 10)
  const md = buildDocMarkdown(enriched, !!apiKey)
  downloadFile(md, `인수인계_${programId}_${dateStr}.md`, 'text/markdown')
}

// 문서 생성용 JSDoc 조회 — GET_FUNCTION_LOCATION with withJsdoc:true
function getJsdocForEvent(ev) {
  return new Promise(resolve => {
    const expr = buildExpr(ev)
    if (!expr) { resolve(null); return }
    chrome.runtime.sendMessage({
      type: 'GET_FUNCTION_LOCATION',
      tabId: chrome.devtools.inspectedWindow.tabId,
      expr,
      withJsdoc: true
    }, (result) => {
      resolve(result?.jsdoc || null)
    })
  })
}

// 단일 이벤트에 대한 AI 설명 요청 (기존 GROQ_CHAT 재사용)
function getAiDescription(apiKey, provider, ev, src, jsdoc) {
  return new Promise(resolve => {
    const label = `타입: ${ev.type} | ID: ${ev.id}${ev.event ? ' | 이벤트: ' + ev.event : ''}`
    // JSDoc이 있으면 별도 섹션으로 전달해 AI가 우선 참고하도록 함
    const jsdocPart = jsdoc ? `\n\n[함수 주석 — 아래 내용을 우선 참고]\n${jsdoc}` : ''
    const messages = [{
      role: 'user',
      content: `다음 $u 프레임워크 이벤트 핸들러를 1~2문장으로 간결하게 설명해주세요. 함수 주석이 있으면 우선 참고하고, 없으면 로직을 분석해 설명하세요. 설명 텍스트만 출력하세요.\n\n${label}${jsdocPart}\n\n\`\`\`js\n${src.slice(0, 1500)}\n\`\`\``
    }]
    chrome.runtime.sendMessage(
      { type: 'GROQ_CHAT', apiKey, provider, messages, ragUrl: null, hasSourceContext: true, question: '' },
      res => resolve(res?.ok ? res.content.trim() : null)
    )
  })
}

// Markdown 문서 조립
function buildDocMarkdown(enriched, hasApiKey) {
  const now = new Date()
  const programId = enriched.find(r => r.ev.programId)?.ev.programId || 'UNKNOWN'
  const withDesc = enriched.filter(r => r.desc).length

  const lines = [
    `# 인수인계 문서`,
    ``,
    `| 항목 | 내용 |`,
    `|------|------|`,
    `| 생성일 | ${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR')} |`,
    `| 프로그램 ID | \`${programId}\` |`,
    `| 총 이벤트 수 | ${enriched.length} |`,
    `| AI 설명 생성 | ${withDesc} / ${enriched.length} |`,
    ``,
    `---`,
    ``,
    `## 이벤트 핸들러 목록`,
    ``
  ]

  const typeOrder = ['HDL', 'BTN', 'FLD', 'GRD']
  const typeLabels = { HDL: 'Handler', BTN: 'Button', FLD: 'Field', GRD: 'Grid' }
  const grouped = {}
  enriched.forEach(r => {
    const t = r.ev.type
    if (!grouped[t]) grouped[t] = []
    grouped[t].push(r)
  })

  typeOrder.filter(t => grouped[t]).forEach(type => {
    lines.push(`### ${typeLabels[type]} (${type})`)
    lines.push('')
    grouped[type].forEach(({ ev, src, desc }) => {
      const title = ev.event ? `${ev.id} · \`${ev.event}\`` : ev.id
      lines.push(`#### ${title}`)
      lines.push(`- **함수명**: \`${ev.fnName || '-'}\``)
      if (ev.programId) lines.push(`- **프로그램 ID**: \`${ev.programId}\``)
      lines.push(`- **수집**: ${ev.src === 'scan' ? 'Scan' : '후킹'}`)

      if (desc) {
        lines.push(`- **설명**: ${desc}`)
      } else if (!hasApiKey) {
        lines.push(`- **설명**: *(AI 가이드 탭에서 API Key 설정 후 재생성)*`)
      } else if (!src) {
        lines.push(`- **설명**: *(소스 코드 없음 — Scan 실행 시 생성 가능)*`)
      }
      lines.push('')
    })
  })

  return lines.join('\n')
}

// Blob 다운로드
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── $nst 탭 ───────────────────────────────────────────
const nstList       = document.getElementById('nstList')
const nstEmpty      = document.getElementById('nstEmpty')
const nstCountEl    = document.getElementById('nstCount')
const nstScroll     = document.getElementById('nstScroll')
const nstSearchEl   = document.getElementById('nstSearch')
const nstProgEl     = document.getElementById('nstProgFilter')
const nstSlowBtn    = document.getElementById('nstSlowBtn')
const knownNstProgs = new Set()

let nstSearchQuery  = ''
let nstProgFilter   = ''
let nstSlowOnly     = false

function trackNstProg(id) {
  if (!id || knownNstProgs.has(id)) return
  knownNstProgs.add(id)
  const opt = document.createElement('option')
  opt.value = id; opt.textContent = id
  nstProgEl.appendChild(opt)
}

function getNstFiltered() {
  return nstCalls.filter(c => {
    const q = nstSearchQuery.toLowerCase()
    const matchSearch = !q ||
      (c.serviceId || '').toLowerCase().includes(q) ||
      getNstSummary(c).toLowerCase().includes(q)
    const matchProg = !nstProgFilter || (c.programId || '') === nstProgFilter
    const matchSlow = !nstSlowOnly || (c.status === 'done' && c.duration >= 1000)
    return matchSearch && matchProg && matchSlow
  })
}

function renderNst() {
  nstList.innerHTML = ''
  const filtered = getNstFiltered()
  nstCountEl.textContent = `${filtered.length} / ${nstCalls.length} calls`
  if (!filtered.length) { nstEmpty.style.display = 'block'; return }
  nstEmpty.style.display = 'none'
  filtered.forEach(c => {
    const idx = nstCalls.indexOf(c)
    const li = document.createElement('li')
    li.className = 'nst-item'
    li.dataset.idx = idx
    li.innerHTML = buildNstRowHtml(c)
    li.querySelector('.nst-row').addEventListener('click', () => toggleNstDetail(li, idx))
    nstList.appendChild(li)
  })
}

nstSearchEl.addEventListener('input', () => { nstSearchQuery = nstSearchEl.value; renderNst() })
nstProgEl.addEventListener('change', () => { nstProgFilter = nstProgEl.value; renderNst() })
nstSlowBtn.addEventListener('click', () => {
  nstSlowOnly = !nstSlowOnly
  nstSlowBtn.classList.toggle('active', nstSlowOnly)
  renderNst()
})

// is_data에서 내부 필드 제외하고 의미 있는 파라미터만 요약
const NST_INTERNAL_KEYS = new Set(['namedServiceId', 'tableParamsString', 'n_service_cache_key'])
// 우선순위 키 — 있으면 먼저 표시
const NST_PRIORITY_KEYS = ['SCOPE', 'WEB_DATA_ID', 'FOBJ', 'GB', 'KEY', 'ID', 'CODE', 'BUKRS', 'WERKS', 'MATNR']

function getNstSummary(call) {
  if (!call.is_data || typeof call.is_data !== 'object') return ''

  // 우선순위 키 중 값이 있는 것 먼저
  const priority = NST_PRIORITY_KEYS
    .filter(k => call.is_data[k] != null && call.is_data[k] !== '' && typeof call.is_data[k] !== 'object')
    .slice(0, 2)
    .map(k => `${k}=${call.is_data[k]}`)

  if (priority.length) return priority.join(' · ')

  // 폴백: 내부 키 제외한 일반 문자열/숫자 값
  return Object.entries(call.is_data)
    .filter(([k, v]) => !NST_INTERNAL_KEYS.has(k) && v != null && v !== '' && typeof v !== 'object')
    .slice(0, 2)
    .map(([k, v]) => `${k}=${v}`)
    .join(' · ')
}

function formatNstObj(obj) {
  if (obj === null || obj === undefined) return '(없음)'
  if (typeof obj === 'string') return obj
  if (obj._arr !== undefined) {
    const rows = (obj.preview || []).map(r => JSON.stringify(r)).join('\n')
    return `[ ${obj._arr}행 ]\n${rows}`
  }
  try { return JSON.stringify(obj, null, 2) } catch(e) { return String(obj) }
}

function handleNstCall(data) {
  if (data.status === 'pending') {
    const idx = nstCalls.length
    nstCalls.push({ ...data })
    nstCallMap[data.callId] = idx
    trackNstProg(data.programId)
    renderNst()
    nstScroll.scrollTop = nstScroll.scrollHeight
  } else if (data.status === 'done') {
    const idx = nstCallMap[data.callId]
    if (idx === undefined) return
    nstCalls[idx] = { ...nstCalls[idx], ...data }
    // 이미 열려있는 항목은 인플레이스 업데이트
    const li = nstList.querySelector(`li[data-idx="${idx}"]`)
    if (li) {
      const wasOpen = li.querySelector('.nst-detail')?.classList.contains('open')
      li.innerHTML = buildNstRowHtml(nstCalls[idx])
      if (wasOpen) li.querySelector('.nst-detail')?.classList.add('open')
      li.querySelector('.nst-row').addEventListener('click', () => toggleNstDetail(li, idx))
    } else {
      renderNst()
    }
    nstCountEl.textContent = `${getNstFiltered().length} / ${nstCalls.length} calls`
  }
}

function buildNstRowHtml(call) {
  const durHtml = call.status === 'done'
    ? `<span class="nst-dur ${call.duration >= 1000 ? 'slow' : 'fast'}">${call.duration}ms</span>`
    : `<span class="nst-status-pending">대기중...</span>`

  const summary = getNstSummary(call)
  return `
    <div class="nst-row">
      <span class="nst-time">${call.time}</span>
      <span class="nst-svc">${escapeHtml(call.serviceId || '-')}</span>
      ${summary ? `<span class="nst-summary">${escapeHtml(summary)}</span>` : ''}
      ${call.method && call.method !== 'direct' ? `<span class="nst-method">${escapeHtml(call.method)}</span>` : ''}
      ${call.programId ? `<span class="nst-prog">${escapeHtml(call.programId)}</span>` : ''}
      ${durHtml}
    </div>
    <div class="nst-detail">${buildNstDetailHtml(call)}</div>
  `
}

function buildNstDetailHtml(call) {
  let html = ''

  if (call.is_data && Object.keys(call.is_data).length) {
    html += `<div class="nst-detail-section">
      <div class="nst-detail-label">입력 (is_data)</div>
      <div class="nst-detail-val">${escapeHtml(formatNstObj(call.is_data))}</div>
    </div>`
  }

  if (call.tableParams && Object.keys(call.tableParams).length) {
    html += `<div class="nst-detail-section">
      <div class="nst-detail-label">테이블 입력 (IT_DATA 등)</div>
      <div class="nst-detail-val">${escapeHtml(formatNstObj(call.tableParams))}</div>
    </div>`
  }

  if (call.status === 'done' && call.response) {
    const r = call.response
    if (r.returnMessage) {
      html += `<div class="nst-detail-section">
        <div class="nst-detail-label">응답 메시지</div>
        <div class="nst-detail-val">${escapeHtml(r.returnMessage)}</div>
      </div>`
    }
    if (r.tableReturns && Object.keys(r.tableReturns).length) {
      html += `<div class="nst-detail-section">
        <div class="nst-detail-label">테이블 결과 (OT_DATA 등)</div>
        <div class="nst-detail-val">${escapeHtml(formatNstObj(r.tableReturns))}</div>
      </div>`
    }
    if (r.exportMaps && Object.keys(r.exportMaps).length) {
      html += `<div class="nst-detail-section">
        <div class="nst-detail-label">Export Maps</div>
        <div class="nst-detail-val">${escapeHtml(formatNstObj(r.exportMaps))}</div>
      </div>`
    }
    if (r.stringReturns && Object.keys(r.stringReturns).length) {
      html += `<div class="nst-detail-section">
        <div class="nst-detail-label">String Returns</div>
        <div class="nst-detail-val">${escapeHtml(formatNstObj(r.stringReturns))}</div>
      </div>`
    }
  }

  return html || '<span style="color:#555;font-size:10px">상세 없음</span>'
}

function toggleNstDetail(li, idx) {
  const detail = li.querySelector('.nst-detail')
  if (!detail) return
  detail.classList.toggle('open')
}

document.getElementById('clearNstBtn').addEventListener('click', () => {
  nstCalls = []
  Object.keys(nstCallMap).forEach(k => delete nstCallMap[k])
  knownNstProgs.clear()
  nstProgEl.innerHTML = '<option value="">모든 프로그램</option>'
  nstSearchEl.value = ''
  nstSearchQuery = ''
  nstProgFilter = ''
  nstSlowOnly = false
  nstSlowBtn.classList.remove('active')
  nstList.innerHTML = ''
  nstEmpty.style.display = 'block'
  nstCountEl.textContent = '0 calls'
})

// ── 패턴 카드 ──────────────────────────────────────────

// AI 서브탭 전환
document.querySelectorAll('.ai-sub-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.ai-sub-tab').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    const subtab = btn.dataset.subtab
    document.getElementById('ai-chat-view').style.display     = subtab === 'chat'     ? 'flex' : 'none'
    document.getElementById('ai-patterns-view').style.display = subtab === 'patterns' ? 'flex' : 'none'
    if (subtab === 'patterns') renderPatterns()
  })
})

// 패턴 카테고리 필터
document.querySelectorAll('.pattern-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.pattern-filter-btn').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    activePatternCategory = btn.dataset.cat
    renderPatterns()
  })
})

function renderPatterns() {
  const container = document.getElementById('pattern-grid')
  const filtered = activePatternCategory === 'ALL'
    ? PATTERNS
    : PATTERNS.filter(p => p.category === activePatternCategory)

  container.innerHTML = filtered.map(p => {
    const idx = PATTERNS.indexOf(p)
    return `
      <div class="pattern-card">
        <div class="pattern-card-header">
          <span class="badge badge-${p.category}">${p.category}</span>
          <span class="pattern-card-title">${escapeHtml(p.title)}</span>
        </div>
        <div class="pattern-card-desc">${escapeHtml(p.desc)}</div>
        <div class="pattern-card-code">${escapeHtml(p.code)}</div>
        <div class="pattern-card-actions">
          <button class="pattern-copy-btn" data-idx="${idx}">복사</button>
          <button class="pattern-ask-btn" data-idx="${idx}">AI에게 묻기</button>
        </div>
      </div>
    `
  }).join('')

  container.querySelectorAll('.pattern-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = PATTERNS[parseInt(btn.dataset.idx)]
      navigator.clipboard.writeText(p.code).then(() => {
        btn.textContent = '✓'
        setTimeout(() => { btn.textContent = '복사' }, 1500)
      })
    })
  })

  container.querySelectorAll('.pattern-ask-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sendPatternToAI(PATTERNS[parseInt(btn.dataset.idx)])
    })
  })
}

function sendPatternToAI(pattern) {
  // 채팅 서브탭으로 전환
  document.querySelectorAll('.ai-sub-tab').forEach(b => b.classList.remove('active'))
  document.querySelector('.ai-sub-tab[data-subtab="chat"]').classList.add('active')
  document.getElementById('ai-chat-view').style.display     = 'flex'
  document.getElementById('ai-patterns-view').style.display = 'none'

  // 패턴을 이벤트 컨텍스트로 설정
  pendingEventContext = {
    ev: { type: pattern.category, id: pattern.title, fnName: '', event: '' },
    sourceCode: pattern.code
  }
  renderPendingContext()
  aiInputEl.value = `위 패턴을 현재 화면에 맞게 활용하는 방법을 알려줘`
  aiInputEl.focus()
}
