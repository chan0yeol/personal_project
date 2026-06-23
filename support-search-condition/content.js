const COOKIE_PROCESSER = 'dsh_processer';
const COOKIE_DAYS      = 'dsh_days';
const COOKIE_AUTO      = 'dsh_auto';
const COOKIE_TEAMS     = 'dsh_teams';

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

// N일 전 날짜 계산
function getStartDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - Number(days));
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
}

const BTN_STYLE = `
  z-index: 10000; position: fixed; padding: 2px 8px;
  background: rgb(255, 215, 0); color: rgb(0, 0, 0);
  border: 1px solid rgb(0, 0, 0); border-radius: 3px;
  font-size: 12px; font-weight: bold;
  box-shadow: rgba(0,0,0,0.2) 0px 2px 4px;
  top: 7px; cursor: pointer;
`;

// ─── 버튼 주입 ────────────────────────────────────────────
function injectButton() {
  if (document.getElementById('dsh-btn')) return;

  // 날짜 조회 버튼 (처리자 없이 날짜만)
  const dateBtn = document.createElement('button');
  dateBtn.id = 'dsh-date-btn';
  dateBtn.textContent = '날짜 조회';
  dateBtn.style.cssText = BTN_STYLE + 'left: 1240px;';
  dateBtn.addEventListener('click', applyDateOnly);
  document.body.appendChild(dateBtn);

  // 바로 조회 버튼 (처리자 포함 전체 조건)
  const quickBtn = document.createElement('button');
  quickBtn.id = 'dsh-quick-btn';
  quickBtn.textContent = '설정한 조건 조회';
  quickBtn.style.cssText = BTN_STYLE + 'left: 1320px;';
  quickBtn.addEventListener('click', applyAndSearch);
  document.body.appendChild(quickBtn);

  // 검색 설정 버튼
  const btn = document.createElement('button');
  btn.id = 'dsh-btn';
  btn.textContent = '검색 설정';
  btn.style.cssText = BTN_STYLE + 'left: 1440px;';
  btn.addEventListener('click', openModal);
  document.body.appendChild(btn);
}

// ─── 모달 ────────────────────────────────────────────────
const RANGE_OPTIONS = [
  { value: '10',  label: '10일 전' },
  { value: '30',  label: '한달' },
  { value: '90',  label: '3개월' },
  { value: '180', label: '6개월' },
  { value: '360', label: '360일' },
];

function openModal() {
  if (document.getElementById('dsh-overlay')) return;

  const savedProcesser = getCookie(COOKIE_PROCESSER)
    || document.querySelector('.userNm')?.title?.trim()
    || '';
  const savedDays      = getCookie(COOKIE_DAYS) || '10';
  const savedAuto      = getCookie(COOKIE_AUTO) === 'true';
  const savedTeams     = JSON.parse(getCookie(COOKIE_TEAMS) || '[]');

  const radioHTML = RANGE_OPTIONS.map(opt => `
    <label class="dsh-radio-label">
      <input type="radio" name="dsh-days" value="${opt.value}" ${savedDays === opt.value ? 'checked' : ''} />
      ${opt.label}
    </label>
  `).join('');

  const overlay = document.createElement('div');
  overlay.id = 'dsh-overlay';
  overlay.innerHTML = `
    <div id="dsh-modal">
      <h2>검색 설정</h2>

      <div class="dsh-field">
        <label>처리자</label>
        <input type="text" id="dsh-processer" value="${savedProcesser}" placeholder="처리자 이름 입력" />
      </div>

      <div class="dsh-field">
        <label>시작일</label>
        <div class="dsh-radio-group">${radioHTML}</div>
      </div>

      <div class="dsh-field">
        <label>팀</label>
        <div class="dsh-check-group" id="dsh-team-group">
          ${TEAM_OPTIONS.map(opt => `
            <label class="dsh-check-label">
              <input type="checkbox" name="dsh-team" value="${opt.value}" ${savedTeams.includes(opt.value) ? 'checked' : ''} />
              ${opt.label}
            </label>
          `).join('')}
        </div>
      </div>

      <div class="dsh-field dsh-toggle-row">
        <span>화면 진입 시 자동 설정</span>
        <label class="dsh-toggle">
          <input type="checkbox" id="dsh-auto" ${savedAuto ? 'checked' : ''} />
          <span class="dsh-toggle-slider"></span>
        </label>
      </div>

      <div id="dsh-actions">
        <button id="dsh-cancel">닫기</button>
        <button id="dsh-save">저장</button>
        <button id="dsh-apply">저장 & 조회</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 전체 체크 시 1~7팀 + 미지정 모두 선택, 개별 체크 시 전체 해제
  document.querySelectorAll('input[name="dsh-team"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.value === '' && cb.checked) {
        document.querySelectorAll('input[name="dsh-team"]').forEach(c => {
          c.checked = c.value !== '';
        });
      } else if (cb.value !== '') {
        const all = document.querySelector('input[name="dsh-team"][value=""]');
        if (all) all.checked = false;
      }
    });
  });

  document.getElementById('dsh-cancel').addEventListener('click', closeModal);
  document.getElementById('dsh-save').addEventListener('click', saveSettings);
  document.getElementById('dsh-apply').addEventListener('click', saveAndSearch);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}

function closeModal() {
  document.getElementById('dsh-overlay')?.remove();
}

// ─── 저장 ────────────────────────────────────────────────
function saveSettings() {
  const processer = document.getElementById('dsh-processer')?.value.trim();
  const days      = document.querySelector('input[name="dsh-days"]:checked')?.value || '10';
  const auto      = document.getElementById('dsh-auto')?.checked ? 'true' : 'false';

  const teams = Array.from(document.querySelectorAll('input[name="dsh-team"]:checked')).map(c => c.value);
  setCookie(COOKIE_PROCESSER, processer);
  setCookie(COOKIE_DAYS, days);
  setCookie(COOKIE_AUTO, auto);
  setCookie(COOKIE_TEAMS, JSON.stringify(teams));
}

// ─── 날짜만 적용 & 조회 (처리자 없이 전체) ──────────────
function applyDateOnly() {
  const days      = getCookie(COOKIE_DAYS) || '10';
  const today     = getToday();
  const startDate = getStartDate(days);
  const ctx       = getTargetContext();
  const $         = ctx?.win?.jQuery || ctx?.win?.$;
  const doc       = ctx?.doc || document;

  if (!$) return;

  const teams = JSON.parse(getCookie(COOKIE_TEAMS) || '[]');
  setDatePicker($, doc.querySelector('#START_DATE'), startDate);
  setDatePicker($, doc.querySelector('#END_DATE'), today);
  setTeams($, doc, teams);

  // 전체 라디오 선택
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

// ─── 팀 멀티셀렉트 세팅 ──────────────────────────────────
const ALL_TEAM_VALUES = ['1','2','3','4','5','6','7','N'];

function setTeams($, doc, teamValues) {
  const select = doc.querySelector('#UNIDOCU_PART_TYPE');
  if (!select) return;

  // 전체('') 포함되면 모든 팀으로 확장
  const values = teamValues.includes('') ? ALL_TEAM_VALUES : teamValues;

  Array.from(select.options).forEach(opt => {
    opt.selected = values.includes(opt.value);
  });

  if ($) {
    try { $(select).multiselect('refresh'); } catch (e) {}
    $(select).trigger('change');
  }

  // 버튼 span 텍스트 업데이트
  const spanEl = select.closest('.up-select-wrapper')?.querySelector('.up-select-text');
  if (spanEl) {
    const labels = values
      .map(v => TEAM_OPTIONS.find(t => t.value === v)?.label)
      .filter(Boolean);
    spanEl.textContent = labels.length ? labels.join(', ') : '전체';
  }
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

// ─── 값 적용 & 조회 클릭 (처리자 포함) ──────────────────
function applyAndSearch() {
  const days      = getCookie(COOKIE_DAYS) || '10';
  const processer = getCookie(COOKIE_PROCESSER)
    || document.querySelector('.userNm')?.title?.trim()
    || '';
  const today     = getToday();
  const startDate = getStartDate(days);
  const ctx       = getTargetContext();
  const $         = ctx?.win?.jQuery || ctx?.win?.$;
  const doc       = ctx?.doc || document;

  const teams = JSON.parse(getCookie(COOKIE_TEAMS) || '[]');
  setDatePicker($, doc.querySelector('#START_DATE'), startDate);
  setDatePicker($, doc.querySelector('#END_DATE'), today);
  setTeams($, doc, teams);

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
    }, 150);
  }, 300);
}

function saveAndSearch() {
  saveSettings();
  closeModal();
  applyAndSearch();
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

// ─── DOM 요소 대기 (폴링) ────────────────────────────────
function waitForElement(selector, callback, timeout = 15000) {
  let elapsed = 0;
  const interval = setInterval(() => {
    elapsed += 500;
    const doc = getTargetDoc();
    if (doc?.querySelector(selector)) {
      clearInterval(interval);
      callback();
    }
    if (elapsed >= timeout) clearInterval(interval);
  }, 500);
}

// ─── 초기화 ──────────────────────────────────────────────
function init() {
  injectButton();

  // 자동 설정 ON이면 조회 버튼 생기는 순간 자동 적용
  if (getCookie(COOKIE_AUTO) === 'true') {
    waitForElement('#doSearch>div.doSearch>div', applyAndSearch);
  }

  const observer = new MutationObserver(() => {
    if (!document.getElementById('dsh-btn')) injectButton();
  });
  observer.observe(document.body, { childList: true, subtree: false });
}

init();
