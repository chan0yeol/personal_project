(function () {
  'use strict';

  // ─── URL 필터 ─────────────────────────────────────────────
  function isTargetPage() {
    const p = location.pathname;
    return p === '/welcome.uni' || p === '/home.uni';
  }

  function removeFAB() {
    document.getElementById('us-fab-root')?.remove();
    document.getElementById('us-panel-wrap')?.remove();
    activePanelKey = null;
    panelEl = null;
    isOpen = false;
  }

  // ─── 테마 & 아이콘 ───────────────────────────────────────
  const P = '#2563EB', PD = '#1d4ed8', PL = '#3b82f6';
  const THEME = { primary:P, dark:PD, light:PL, shadow:'rgba(37,99,235,0.35)', tint:'#eff6ff', line:'#e2e8f0', hover:'#cbd5e1' };

  // ─── 버튼 색상 프리셋 & 퍼시스턴스 ──────────────────────
  const COLOR_PRESETS = [
    { id:'blue',   bg:'#eff6ff', icon:'#2563eb' },
    { id:'green',  bg:'#f0fdf4', icon:'#16a34a' },
    { id:'purple', bg:'#f5f3ff', icon:'#7c3aed' },
    { id:'orange', bg:'#fff7ed', icon:'#ea580c' },
    { id:'red',    bg:'#fef2f2', icon:'#dc2626' },
    { id:'pink',   bg:'#fdf2f8', icon:'#db2777' },
    { id:'teal',   bg:'#f0fdfa', icon:'#0d9488' },
    { id:'gray',   bg:'#f8fafc', icon:'#475569' },
  ];

  const US_BACK_KEY = 'us-back-origin';

  function loadBtnColors() {
    try { return JSON.parse(localStorage.getItem('us-btn-colors') || '{}'); } catch { return {}; }
  }
  function saveBtnColors(data) { localStorage.setItem('us-btn-colors', JSON.stringify(data)); }
  function getBtnColor(key) {
    const saved = loadBtnColors()[key];
    return COLOR_PRESETS.find(c => c.id === saved) || COLOR_PRESETS[0];
  }
  function applyBtnColorToDOM(key, colorId) {
    const preset = COLOR_PRESETS.find(c => c.id === colorId) || COLOR_PRESETS[0];
    const iw = document.getElementById('us-icon-' + key);
    if (iw) { iw.style.background = preset.icon; iw.style.color = '#fff'; }
    const btnEl = document.getElementById('us-btn-' + key);
    if (btnEl) { btnEl.style.background = preset.bg; btnEl.dataset.colorBg = preset.bg; btnEl.dataset.colorIcon = preset.icon; }
    const fi = document.querySelector('#us-float-' + key + ' .us-float-icon');
    if (fi) { fi.style.background = preset.icon; fi.style.color = '#fff'; }
    const fb = document.querySelector('#us-float-' + key + ' .us-float-btn');
    if (fb) { fb.style.background = preset.bg; fb.dataset.colorBg = preset.bg; fb.dataset.colorIcon = preset.icon; }
  }

  // ─── 글로벌 버튼 스타일 주입 (사이트 CSS 격리) ───────────
  function injectStyles() {
    if (document.getElementById('us-fab-styles')) return;
    const s = document.createElement('style');
    s.id = 'us-fab-styles';
    s.textContent = `
      #us-panel-wrap .us-btn, #us-fab-root .us-btn, #us-help-overlay .us-btn, #dne-overlay .us-btn {
        box-sizing: border-box !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 5px !important;
        white-space: nowrap !important;
        line-height: 1 !important;
        width: auto !important;
        height: auto !important;
        overflow: visible !important;
        font-family: 'Pretendard', 'Segoe UI', system-ui, sans-serif !important;
        letter-spacing: -0.005em !important;
        vertical-align: middle !important;
        text-align: center !important;
        text-transform: none !important;
        text-indent: 0 !important;
        border-image: none !important;
        outline: none !important;
      }
      #us-panel-wrap .us-btn-primary, #us-fab-root .us-btn-primary, #us-help-overlay .us-btn-primary, #dne-overlay .us-btn-primary {
        padding: 8px 16px !important;
        background: #2563EB !important;
        color: #fff !important;
        border: none !important;
        border-radius: 9px !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        box-shadow: 0 1px 2px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.18) !important;
        transition: background 0.15s !important;
      }
      #us-panel-wrap .us-btn-primary:hover, #us-fab-root .us-btn-primary:hover, #us-help-overlay .us-btn-primary:hover, #dne-overlay .us-btn-primary:hover { background: #1d4ed8 !important; }
      #us-panel-wrap .us-btn-primary:disabled, #us-fab-root .us-btn-primary:disabled, #us-help-overlay .us-btn-primary:disabled, #dne-overlay .us-btn-primary:disabled { background: #93c5fd !important; cursor: not-allowed !important; }
      #us-panel-wrap .us-btn-ghost, #us-fab-root .us-btn-ghost, #us-help-overlay .us-btn-ghost, #dne-overlay .us-btn-ghost {
        padding: 8px 14px !important;
        background: #fff !important;
        color: #334155 !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 9px !important;
        font-size: 13px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: background 0.15s !important;
      }
      #us-panel-wrap .us-btn-ghost:hover, #us-fab-root .us-btn-ghost:hover, #us-help-overlay .us-btn-ghost:hover, #dne-overlay .us-btn-ghost:hover { background: #f8fafc !important; }
      #us-panel-wrap .us-btn-icon, #us-fab-root .us-btn-icon, #us-help-overlay .us-btn-icon, #dne-overlay .us-btn-icon {
        padding: 0 !important;
        width: 36px !important;
        height: 36px !important;
        flex-shrink: 0 !important;
        border-radius: 8px !important;
      }
    `;
    document.head.appendChild(s);
  }

  function svg(d, s) {
    return `<svg width="${s||18}" height="${s||18}" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  }
  const IC = {
    view:     svg('<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="7" y1="14" x2="13" y2="14"/><line x1="7" y1="17" x2="17" y2="17"/>'),
    register: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="12" y1="13" x2="12" y2="18"/><line x1="9.5" y1="15.5" x2="14.5" y2="15.5"/>'),
    date:     svg('<circle cx="12" cy="12" r="8.5"/><polyline points="12 7 12 12 15.5 14"/>'),
    cond:     svg('<polygon points="3.5 5 20.5 5 14 13 14 19 10 21 10 13 3.5 5"/>'),
    search:   svg('<circle cx="10.5" cy="10.5" r="5.5"/><line x1="14.5" y1="14.5" x2="20" y2="20"/>'),
    help:     svg('<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.2a2.5 2.5 0 0 1 4.9 0.6c0 1.4-1.9 1.8-1.9 3.2"/><circle cx="12.5" cy="16.4" r="0.6" fill="currentColor" stroke="none"/>'),
    plus:     svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', 24),
    close:    svg('<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>'),
    pin:      svg('<path d="M9 4v6l-2 4h10l-2-4V4"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="4" x2="15" y2="4"/>', 20),
    ticket:   svg('<rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="7" y1="4" x2="7" y2="9"/><line x1="14" y1="13" x2="18" y2="13"/><line x1="6" y1="13" x2="11" y2="13"/><line x1="6" y1="16.5" x2="18" y2="16.5"/>'),
    ai:       svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"/>'),
  };

  // ─── 상태 ────────────────────────────────────────────────
  let isOpen = false;
  let pos = { x: 28, y: 28 };
  let activePanelKey = null;
  let panelEl = null;

  const MENU = [
    { key:'help',     label:'사용법',           desc:'FAB 기능 안내 및 문의',                              fn: () => { hidePanel(); toggleOpen(false); openHelpModal(); } },
    { key:'view',     label:'반영일정 조회',    desc:'등록된 반영 일정 조회 · 수정 · 삭제',               fn: () => togglePanel('view')     },
    { key:'register', label:'반영일정 등록',    desc:'반영 일정 등록, Slack DM 알림 자동 발송',           fn: () => togglePanel('register') },
    { key:'ticket',   label:'접수번호 이동',    desc:'접수번호 입력 후 해당 상세 페이지로 바로 이동',     fn: () => togglePanel('ticket')   },
    { key:'date',     label:'날짜 조회',        desc:'저장된 날짜 범위만 적용해 빠른 조회',               fn: () => { hidePanel(); applyDateOnly?.();  } },
    { key:'cond',     label:'설정한 조건 조회', desc:'저장된 담당자·날짜·팀·상태 조건 일괄 적용',        fn: () => { hidePanel(); applyAndSearch?.(); } },
    { key:'search',   label:'설정',             desc:'검색 조건·버튼 색상 등 개인화 설정 저장',          fn: () => togglePanel('search')   },
    { key:'ai',       label:'AI 유사사례',      desc:'현재 문의와 유사한 과거 처리 사례를 AI로 검색',    fn: () => togglePanel('ai')       },
  ];

  // ─── 유틸 ────────────────────────────────────────────────
  const css = (el, s) => Object.assign(el.style, s);

  function el(tag, styles, inner) {
    const e = document.createElement(tag);
    if (styles) css(e, styles);
    if (inner !== undefined) e.innerHTML = inner;
    return e;
  }

  function inp(type, ph, val) {
    const e = document.createElement(type === 'textarea' ? 'textarea' : 'input');
    if (type !== 'textarea') e.type = type || 'text';
    if (ph)  e.placeholder = ph;
    if (val !== undefined) e.value = val;
    css(e, { width:'100%', boxSizing:'border-box', padding:'8px 10px',
      border:'1.5px solid #e2e8f0', borderRadius:'8px', outline:'none',
      fontSize:'13px', color:'#0f172a', background:'#f8fafc', fontFamily:'inherit',
      transition:'border-color 0.15s, background 0.15s' });
    e.addEventListener('focus', () => { e.style.borderColor = P; e.style.background = '#fff'; });
    e.addEventListener('blur',  () => { e.style.borderColor = '#e2e8f0'; e.style.background = '#f8fafc'; });
    return e;
  }

  function sel(opts, val) {
    const e = document.createElement('select');
    css(e, { width:'100%', boxSizing:'border-box', padding:'8px 10px',
      border:'1.5px solid #e2e8f0', borderRadius:'8px', outline:'none',
      fontSize:'13px', color:'#0f172a', background:'#f8fafc', fontFamily:'inherit' });
    opts.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value; opt.textContent = o.label;
      if (o.value === val) opt.selected = true;
      e.appendChild(opt);
    });
    return e;
  }

  function row2(...children) {
    const r = el('div', { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' });
    children.forEach(c => r.appendChild(c));
    return r;
  }

  function btnPrimary(text, onClick) {
    const b = document.createElement('button');
    b.className = 'us-btn us-btn-primary';
    b.textContent = text;
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  function btnGhost(text, onClick) {
    const b = document.createElement('button');
    b.className = 'us-btn us-btn-ghost';
    b.textContent = text;
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  function btnIcon(iconHtml, title, onClick) {
    const b = document.createElement('button');
    b.className = 'us-btn us-btn-primary us-btn-icon';
    b.innerHTML = iconHtml;
    if (title) b.title = title;
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  function msgBox() {
    const m = el('div', { fontSize:'12px', padding:'8px 12px', borderRadius:'7px', display:'none' });
    m.setSuccess = (t) => { m.textContent = t; css(m, { display:'block', background:'#f0fdf4', color:'#15803d', border:'1px solid #bbf7d0' }); };
    m.setError   = (t) => { m.textContent = t; css(m, { display:'block', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca' }); };
    m.hide       = ()  => { m.style.display = 'none'; };
    return m;
  }

  // ─── 패널 쉘 ─────────────────────────────────────────────
  function createPanel(title, subtitle, width) {
    // createPanel(title, width) 형태도 지원
    if (typeof subtitle === 'number') { width = subtitle; subtitle = null; }

    const panel = el('div', {
      width: (width||460)+'px', maxWidth:'calc(100vw - 110px)',
      background:'#fff', borderRadius:'14px',
      boxShadow:'0 30px 80px -20px rgba(15,23,42,0.25), 0 8px 24px -8px rgba(15,23,42,0.12), 0 0 0 1px rgba(15,23,42,0.04)',
      border:'1px solid '+THEME.line, overflow:'hidden',
      display:'flex', flexDirection:'column',
      maxHeight:`min(640px, calc(100vh - ${pos.y+48}px))`,
      fontFamily:"'Pretendard','Segoe UI',system-ui,sans-serif",
    });

    const hdr = el('div', { display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 16px', borderBottom:'1px solid '+THEME.line, flexShrink:'0', background:'#fff' });

    const hdrLeft = el('div');
    hdrLeft.appendChild(el('div', { fontSize:'14px', fontWeight:'600', color:'#0f172a', letterSpacing:'-0.01em' }, title));
    if (subtitle) hdrLeft.appendChild(el('div', { fontSize:'11.5px', color:'#64748b', marginTop:'2px' }, subtitle));

    const closeX = el('button', { appearance:'none', border:'none', background:'transparent',
      width:'32px', height:'32px', borderRadius:'8px', cursor:'pointer', color:'#94a3b8',
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:'0',
      padding:'0', boxSizing:'border-box', lineHeight:'1' });
    closeX.innerHTML = svg('<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>', 20);
    closeX.addEventListener('mouseenter', () => closeX.style.background = '#f1f5f9');
    closeX.addEventListener('mouseleave', () => closeX.style.background = 'transparent');
    closeX.addEventListener('click', hidePanel);
    hdr.appendChild(hdrLeft); hdr.appendChild(closeX);

    const body = el('div', { padding:'14px 16px', overflowY:'auto',
      display:'flex', flexDirection:'column', gap:'12px', flex:'1' });

    panel.appendChild(hdr); panel.appendChild(body);

    // 사이트 전역 이벤트 핸들러가 패널 내 클릭을 "외부 클릭"으로 인식해 닫는 것 방지
    ['click', 'mousedown', 'pointerdown'].forEach(type => {
      panel.addEventListener(type, e => e.stopPropagation());
    });

    return { panel, body };
  }

  // ─── 패널 컨테이너 ───────────────────────────────────────
  function getPanelContainer() {
    let c = document.getElementById('us-panel-wrap');
    if (!c) {
      c = el('div', { position:'fixed', zIndex:'2147483599',
        display:'none', alignItems:'flex-end', pointerEvents:'none' });
      c.id = 'us-panel-wrap';
      updatePanelContainerPos(c);
      document.body.appendChild(c);
    }
    return c;
  }

  function updatePanelContainerPos(c) {
    c = c || document.getElementById('us-panel-wrap');
    if (!c) return;
    css(c, { right:(pos.x+56+14)+'px', bottom:pos.y+'px', maxHeight:`calc(100vh - ${pos.y+16}px)` });
  }

  function togglePanel(key) {
    if (activePanelKey === key) { hidePanel(); return; }
    showPanel(key);
  }

  function showPanel(key) {
    const container = getPanelContainer();
    container.innerHTML = '';
    container.style.display = 'flex';
    container.style.pointerEvents = 'auto';
    activePanelKey = key;

    const renderers = { view: renderQueryPanel, register: renderRegisterPanel, ticket: renderTicketPanel, search: renderSettingsPanel, ai: renderAIPanel };
    if (!renderers[key]) return;

    const { panel } = renderers[key](container);
    css(panel, { transform:'translateX(16px)', opacity:'0' });
    container.appendChild(panel);
    panelEl = panel;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      css(panel, { transition:'transform 260ms cubic-bezier(.2,.8,.2,1), opacity 200ms ease', transform:'translateX(0)', opacity:'1' });
    }));
  }

  function hidePanel() {
    const c = document.getElementById('us-panel-wrap');
    if (!c || !c.firstChild) return;
    const p = c.firstChild;
    // 즉시 클릭 차단 해제 — 애니메이션 중 사이트 클릭 막히는 문제 방지
    p.style.pointerEvents = 'none';
    css(p, { transition:'transform 180ms cubic-bezier(.4,0,1,1), opacity 140ms ease', transform:'translateX(16px)', opacity:'0' });
    setTimeout(() => { c.innerHTML = ''; c.style.display = 'none'; c.style.pointerEvents = 'none'; }, 180);
    activePanelKey = null;
    panelEl = null;
  }

  // ─── 접수번호 이동 패널 ──────────────────────────────────
  function renderTicketPanel() {
    const { panel, body } = createPanel('접수번호 이동', '접수번호를 입력해 해당 상세로 바로 이동합니다', 360);

    // 현재 페이지에 접수번호가 있으면 자동 채움
    const autoVal = (() => {
      const els = [...document.querySelectorAll('#TITLE_BAR .up-title-text')];
      for (const e of els) {
        const m = e.textContent?.trim().match(/접수번호\s*:\s*(\S+)/);
        if (m) return m[1];
      }
      return '';
    })();

    const ticketInp = inp('text', '접수번호를 입력하세요', autoVal);
    ticketInp.style.fontSize = '15px';
    ticketInp.style.padding  = '10px 12px';

    const msg = msgBox();

    const goBtn = btnPrimary('이동 →');
    goBtn.style.width = '100%';

    function go() {
      const val = ticketInp.value.trim();
      if (!val) { msg.setError('접수번호를 입력해주세요.'); return; }
      top.pageRedirectByProgramId?.('upOperWork01011', { SR_IDX: val });
      hidePanel();
    }

    ticketInp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    goBtn.addEventListener('click', go);

    body.appendChild(ticketInp);
    body.appendChild(msg);
    body.appendChild(goBtn);

    // 패널 열리면 입력창 포커스
    requestAnimationFrame(() => ticketInp.focus());

    return { panel };
  }

  // ─── 반영일정 조회 패널 ──────────────────────────────────
  function renderQueryPanel(container) {
    const { panel, body } = createPanel('반영일정 조회', '예정/완료 반영일정을 확인합니다', 640);
    const currentUser = document.querySelector('.userNm')?.title?.trim() || '';

    // 검색 행
    const searchRow = el('div', { display:'flex', gap:'8px', alignItems:'flex-start' });

    const nameWrap = el('div', { position:'relative', width:'180px', flexShrink:'0' });
    const nameInp  = inp('text', '담당자 이름', currentUser);
    const nameSug  = el('div', { display:'none', position:'absolute', top:'calc(100% + 4px)', left:'0', right:'0',
      background:'#fff', border:'1px solid '+P, borderRadius:'8px', zIndex:'10',
      maxHeight:'200px', overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,0.12)' });
    nameWrap.appendChild(nameInp); nameWrap.appendChild(nameSug);

    const hubWrap  = el('div', { position:'relative', width:'160px', flexShrink:'0' });
    const hubInp   = inp('text', '고객사');
    const hubSug   = el('div', { display:'none', position:'absolute', top:'calc(100% + 4px)', left:'0', right:'0',
      background:'#fff', border:'1px solid '+P, borderRadius:'8px', zIndex:'10',
      maxHeight:'200px', overflowY:'auto', boxShadow:'0 8px 24px rgba(0,0,0,0.12)' });
    hubWrap.appendChild(hubInp); hubWrap.appendChild(hubSug);

    const searchBtn = btnIcon(IC.search, '조회');
    searchRow.appendChild(nameWrap); searchRow.appendChild(hubWrap); searchRow.appendChild(searchBtn);
    body.appendChild(searchRow);

    // 그리드
    const gridWrap = el('div', { border:'1px solid #e2e8f0', borderRadius:'8px', overflow:'hidden' });
    const gridHdr  = el('div', { display:'grid', gridTemplateColumns:'100px 100px 1fr 86px 86px 100px',
      background:'#f8fafc', padding:'8px 10px', borderBottom:'1px solid #e2e8f0' });
    ['접수번호','고객사명','내용','반영일시','남은시간',''].forEach(t => {
      gridHdr.appendChild(el('span', { fontSize:'11px', fontWeight:'600', color:'#64748b', textTransform:'uppercase' }, t));
    });
    const gridBody = el('div', { maxHeight:'340px', overflowY:'auto' });
    gridBody.appendChild(el('div', { textAlign:'center', color:'#94a3b8', padding:'24px', fontSize:'13px' }, '조회 버튼을 눌러주세요'));
    gridWrap.appendChild(gridHdr); gridWrap.appendChild(gridBody);
    body.appendChild(gridWrap);

    let allSchedules = [];
    const allNames = () => [...new Set((typeof membersData !== 'undefined' ? membersData : []).map(m => m.name))].filter(Boolean).sort();
    const allHubs  = () => [...new Set(allSchedules.map(r => r.hub_name).filter(Boolean))].sort();

    function bindAC(inputEl, sugEl, getItems, onSelect) {
      inputEl.addEventListener('input', () => {
        const q = inputEl.value.trim();
        sugEl.innerHTML = ''; sugEl.style.display = 'none';
        if (!q) return;
        const m = getItems().filter(v => v.includes(q)).slice(0,8);
        if (!m.length) return;
        m.forEach(v => {
          const item = el('div', { padding:'8px 12px', cursor:'pointer', fontSize:'13px',
            color:'#1e293b', borderBottom:'1px solid #f1f5f9' }, v);
          item.addEventListener('mouseenter', () => item.style.background = THEME.tint);
          item.addEventListener('mouseleave', () => item.style.background = '');
          item.addEventListener('click', () => { inputEl.value = v; sugEl.innerHTML = ''; sugEl.style.display = 'none'; onSelect(); });
          sugEl.appendChild(item);
        });
        sugEl.style.display = 'block';
      });
    }
    bindAC(nameInp, nameSug, allNames, fetchSchedules);
    bindAC(hubInp,  hubSug,  allHubs,  fetchSchedules);

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#us-panel-wrap')) { nameSug.style.display = 'none'; hubSug.style.display = 'none'; }
    });

    async function fetchSchedules() {
      const name = nameInp.value.trim();
      const hub  = hubInp.value.trim();
      gridBody.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:24px;font-size:13px">불러오는 중...</div>';
      try {
        const res = await relayFetch(`${API_BASE}/api/deploy-schedules`);
        allSchedules = await res.json();
        const now = new Date();
        let filtered = allSchedules;
        if (name) filtered = filtered.filter(r => r.registrant_name?.includes(name));
        if (hub)  filtered = filtered.filter(r => r.hub_name?.includes(hub));
        if (!filtered.length) { gridBody.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:24px;font-size:13px">조회 결과 없음</div>'; return; }

        const upcoming = filtered.filter(r => new Date(r.deploy_at) > now).sort((a,b) => new Date(a.deploy_at)-new Date(b.deploy_at));
        const past     = filtered.filter(r => new Date(r.deploy_at) <= now).sort((a,b) => new Date(b.deploy_at)-new Date(a.deploy_at));

        gridBody.innerHTML = '';
        [...upcoming, ...past].forEach(r => {
          const isPast  = new Date(r.deploy_at) <= now;
          const canEdit = r.registrant_name === currentUser || r.create_name === currentUser;
          const row = el('div', { display:'grid', gridTemplateColumns:'100px 100px 1fr 86px 86px 100px',
            alignItems:'center', borderBottom:'1px solid #f1f5f9', padding:'8px 10px',
            opacity: isPast ? '0.45' : '1' });

          const ticketCell = el('span', { fontSize:'13px', color: r.ticket_no ? P : '#94a3b8', cursor: r.ticket_no ? 'pointer' : 'default',
            textDecoration: r.ticket_no ? 'underline' : 'none', fontWeight: r.ticket_no ? '500' : '400' }, r.ticket_no || '-');
          if (r.ticket_no) ticketCell.addEventListener('click', () => { top.pageRedirectByProgramId?.('upOperWork01011', { SR_IDX: r.ticket_no }); hidePanel(); });

          const timeHtml = (() => {
            const diff = new Date(r.deploy_at) - new Date();
            if (diff <= 0) return '<span style="color:#94a3b8">완료</span>';
            const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000), m = Math.floor((diff%3600000)/60000);
            if (d > 0)  return `<span style="color:#334155">${d}일 ${h}시간</span>`;
            if (h > 0)  return `<span style="color:#d97706;font-weight:600">${h}시간 ${m}분</span>`;
            return `<span style="color:#dc2626;font-weight:700">${m}분</span>`;
          })();

          const deployStr = (() => {
            const d = new Date(r.deploy_at);
            return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
          })();

          const actionCell = el('span', { display:'flex', gap:'4px', alignItems:'center' });
          if (canEdit) {
            const editB = el('button', { all:'revert', padding:'2px 7px', background:'transparent', color:P, border:'1px solid #93c5fd', borderRadius:'4px', fontSize:'11px', cursor:'pointer' }, '수정');
            editB.addEventListener('click', () => openEditOverlay(r, fetchSchedules));
            const delB  = el('button', { all:'revert', padding:'2px 7px', background:'transparent', color:'#ef4444', border:'1px solid #fca5a5', borderRadius:'4px', fontSize:'11px', cursor:'pointer' }, '삭제');
            delB.addEventListener('click', async () => {
              if (!confirm('삭제하시겠습니까?')) return;
              await relayFetch(`${API_BASE}/api/deploy-schedules/${r.id}`, { method:'DELETE' });
              fetchSchedules();
            });
            actionCell.appendChild(editB); actionCell.appendChild(delB);
          }

          row.appendChild(ticketCell);
          row.appendChild(el('span', { fontSize:'13px', color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }, r.hub_name||'-'));
          row.appendChild(el('span', { fontSize:'13px', color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }, r.title));
          row.appendChild(el('span', { fontSize:'12px', color:'#334155' }, deployStr));
          const timeCell = el('span'); timeCell.innerHTML = timeHtml;
          row.appendChild(timeCell);
          row.appendChild(actionCell);
          gridBody.appendChild(row);
        });
      } catch(e) {
        gridBody.innerHTML = `<div style="text-align:center;color:#dc2626;padding:24px;font-size:13px">오류: ${e.message}</div>`;
      }
    }

    searchBtn.addEventListener('click', fetchSchedules);
    fetchSchedules();
    return { panel };
  }

  // ─── 반영일정 등록 패널 ──────────────────────────────────
  function renderRegisterPanel(container) {
    const { panel, body } = createPanel('반영일정 등록', '새 반영 일정을 큐에 추가합니다', 480);

    const notice = el('div', { fontSize:'11px', color:'#94a3b8', background:'#f8fafc',
      borderRadius:'6px', padding:'6px 10px', borderLeft:'3px solid #e2e8f0' },
      '※ 본 기능은 업무 편의를 위한 보조 알림 기능입니다.\n알림 누락, 지연 등의 가능성이 있으므로 중요 일정 및 만료 여부는 반드시 별도 확인 부탁드립니다.');
    body.appendChild(notice);

    const teams = typeof getNotifyTeams === 'function' ? getNotifyTeams() : [];
    const teamSel = sel([{value:'',label:'팀 선택'},...teams.map(t=>({value:t,label:t}))], '');
    const memberSel = sel([{value:'',label:'팀 먼저 선택'}], '');
    css(memberSel, { color:'#94a3b8' });
    memberSel.disabled = true;

    function refreshTeams() {
      const t2 = typeof getNotifyTeams === 'function' ? getNotifyTeams() : [];
      teamSel.innerHTML = '';
      [{value:'',label:'팀 선택'}, ...t2.map(t=>({value:t,label:t}))].forEach(o => {
        const opt = document.createElement('option'); opt.value = o.value; opt.textContent = o.label;
        teamSel.appendChild(opt);
      });
    }
    if (!teams.length && typeof loadMembers === 'function') {
      loadMembers().then(refreshTeams);
    }

    teamSel.addEventListener('change', () => {
      const members = typeof getMembersByTeam === 'function' ? getMembersByTeam(teamSel.value) : [];
      memberSel.innerHTML = '';
      memberSel.disabled = !members.length;
      (members.length ? members : [{slackId:'',name:'팀 먼저 선택'}]).forEach(m => {
        const o = document.createElement('option'); o.value = m.slackId; o.textContent = m.name;
        o.dataset.name = m.name; memberSel.appendChild(o);
      });
      css(memberSel, { color: members.length ? '#0f172a' : '#94a3b8' });
    });

    // label helper
    function lbl(text) {
      return el('div', { display:'flex', flexDirection:'column', gap:'5px' },
        `<span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em">${text}</span>`);
    }
    function fld(text, child) {
      const w = lbl(text);
      w.appendChild(child);
      return w;
    }

    body.appendChild(row2(fld('팀', teamSel), fld('담당자', memberSel)));

    const today = new Date();
    const dateInp = inp('date', '', today.toISOString().slice(0,10));
    const timeInp = inp('time', '', `${String(today.getHours()).padStart(2,'0')}:00`);
    const dtRow = el('div', { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' });
    dtRow.appendChild(dateInp); dtRow.appendChild(timeInp);
    body.appendChild(fld('반영일시', dtRow));

    // 메인 doc + 전체 iframe 탐색
    function findInPage(selector) {
      const m = document.querySelector(selector);
      if (m) return m;
      for (const f of document.querySelectorAll('iframe')) {
        try { const r = f.contentDocument?.querySelector(selector); if (r) return r; } catch(_) {}
      }
      return null;
    }

    const hubInp    = inp('text', '고객사명', findInPage('#HUB_NAME')?.value?.trim() || '');
    const ticketInp = inp('text', '접수번호', (() => {
      const t = findInPage('#TITLE_BAR .up-title-text')?.textContent?.trim() || '';
      return (t.match(/접수번호\s*:\s*(\S+)/) || [])[1] || '';
    })());
    body.appendChild(row2(fld('고객사', hubInp), fld('접수번호', ticketInp)));

    const titleInp = inp('text', '반영 내용을 입력하세요');
    body.appendChild(fld('제목', titleInp));

    // 알림 시간 다중 선택 (settings panel chipGroup과 동일 방식)
    const NOTIFY_OPTS = [
      { value:5,  label:'5분 전'  },
      { value:10, label:'10분 전' },
      { value:15, label:'15분 전' },
      { value:30, label:'30분 전' },
      { value:60, label:'1시간 전' },
    ];
    let notifyTimes = [15];
    const notifyWrap = el('div', { display:'flex', flexWrap:'wrap', gap:'6px' });

    NOTIFY_OPTS.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = opt.label;
      const applyStyle = () => {
        const on = notifyTimes.includes(opt.value);
        btn.style.background  = on ? P : '#fff';
        btn.style.borderColor = on ? P : THEME.line;
        btn.style.color       = on ? '#fff' : '#334155';
        btn.style.fontWeight  = on ? '600' : '500';
        btn.style.boxShadow   = on ? 'inset 0 1px 0 rgba(255,255,255,0.18)' : 'none';
      };
      css(btn, {
        appearance:'none', border:'1px solid '+THEME.line, background:'#fff',
        color:'#334155', padding:'5px 11px', borderRadius:'999px',
        fontSize:'12.5px', fontWeight:'500', cursor:'pointer', fontFamily:'inherit',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        lineHeight:'1', whiteSpace:'nowrap', width:'auto', height:'auto',
        boxSizing:'border-box', transition:'background 120ms ease, border-color 120ms ease, color 120ms ease',
      });
      applyStyle();
      btn.addEventListener('mouseenter', () => { if (!notifyTimes.includes(opt.value)) { btn.style.borderColor = THEME.hover; btn.style.background = THEME.tint; } });
      btn.addEventListener('mouseleave', () => { if (!notifyTimes.includes(opt.value)) { btn.style.borderColor = THEME.line; btn.style.background = '#fff'; } });
      btn.addEventListener('click', () => {
        notifyTimes = notifyTimes.includes(opt.value)
          ? notifyTimes.filter(v => v !== opt.value)
          : [...notifyTimes, opt.value];
        applyStyle();
      });
      notifyWrap.appendChild(btn);
    });
    body.appendChild(fld('알림 시간', notifyWrap));

    const msg = msgBox();
    body.appendChild(msg);

    const footer = el('div', { display:'flex', gap:'8px', justifyContent:'flex-end', paddingTop:'4px' });
    const cancelB = btnGhost('취소', hidePanel);
    const submitB = btnPrimary('등록');
    footer.appendChild(cancelB); footer.appendChild(submitB);
    body.appendChild(footer);

    submitB.addEventListener('click', async () => {
      const slackId = memberSel.value;
      const memberName = memberSel.options[memberSel.selectedIndex]?.dataset?.name || '';
      const deployDate = dateInp.value, deployTime = timeInp.value;
      const deployAt = deployDate && deployTime ? `${deployDate}T${deployTime}` : '';
      const hub = hubInp.value.trim(), ticket = ticketInp.value.trim(), title = titleInp.value.trim();
      msg.hide();
      if (!teamSel.value || !slackId || !deployAt || !title) { msg.setError('팀, 담당자, 반영일시, 제목은 필수입니다.'); return; }
      submitB.textContent = '등록 중...'; submitB.disabled = true;
      const notifyLabel = notifyTimes.length === 0 ? '알림 없음' : notifyTimes.sort((a,b)=>a-b).map(m => `${m}분 전`).join(', ');
      try {
        const res = await relayFetch(`${API_BASE}/api/deploy-schedule`, {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ deploy_at:deployAt+':00+09:00', ticket_no:ticket||null,
            hub_name:hub||null, title, registrant_name:memberName, registrant_slack_id:slackId,
            create_name:document.querySelector('.userNm')?.title?.trim()||'',
            notify_times: notifyTimes }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error||'등록 실패');
        msg.setSuccess(`등록 완료. ${notifyLabel} Slack DM 알림이 발송됩니다.`);
        setTimeout(hidePanel, 2000);
      } catch(e) { msg.setError(`오류: ${e.message}`); submitB.textContent = '등록'; submitB.disabled = false; }
    });

    return { panel };
  }

  // ─── 검색 설정 패널 ──────────────────────────────────────
  function renderSettingsPanel(container) {
    const { panel, body } = createPanel('설정', '검색 조건·버튼 색상 등 개인화 설정을 저장합니다', 460);

    const savedProcesser = typeof getCookie === 'function' ? (getCookie(COOKIE_PROCESSER)||document.querySelector('.userNm')?.title?.trim()||'') : '';
    const savedDays      = typeof getCookie === 'function' ? (getCookie(COOKIE_DAYS)||'10') : '10';
    const savedAuto      = typeof getCookie === 'function' && getCookie(COOKIE_AUTO) === 'true';
    const savedTeams     = typeof getCookie === 'function' ? JSON.parse(getCookie(COOKIE_TEAMS)||'[]') : [];
    const savedProg      = typeof getCookie === 'function' ? JSON.parse(getCookie(COOKIE_PROGRESSION)||JSON.stringify(typeof DEFAULT_PROGRESSION !== 'undefined' ? DEFAULT_PROGRESSION : [])) : [];
    const savedSortCol   = typeof getCookie === 'function' ? (getCookie(COOKIE_SORT_COL)||'status') : 'status';
    const savedSortDir   = typeof getCookie === 'function' ? (getCookie(COOKIE_SORT_DIR)||'asc') : 'asc';
    const savedDateType  = typeof getCookie === 'function' ? (getCookie(COOKIE_DATE_TYPE)||'R') : 'R';

    // ── 섹션 헤더 블록 ───────────────────────────────────────
    function ssSection(label, hintNode, child) {
      const w = el('div', { display:'flex', flexDirection:'column', gap:'8px' });
      const hdr = el('div', { display:'flex', alignItems:'baseline', justifyContent:'space-between' });
      hdr.appendChild(el('span', { fontSize:'12px', fontWeight:'600', color:'#334155', letterSpacing:'-0.005em' }, label));
      if (hintNode) {
        if (typeof hintNode === 'string') hdr.appendChild(el('span', { fontSize:'10.5px', color:'#94a3b8', fontWeight:'500' }, hintNode));
        else hdr.appendChild(hintNode);
      }
      w.appendChild(hdr);
      if (child) w.appendChild(child);
      return w;
    }

    // ── 칩 그룹 (single / multi) ─────────────────────────────
    function chipGroup(options, initSel, multi) {
      let sel = multi ? [...initSel] : initSel;
      const wrap = el('div', { display:'flex', flexWrap:'wrap', gap:'6px' });
      const allBtns = [];
      let onChange = null;

      function isSel(val) { return multi ? sel.includes(val) : sel === val; }

      function applyStyle(btn, val) {
        const on = isSel(val);
        btn.style.background   = on ? P : '#fff';
        btn.style.borderColor  = on ? P : THEME.line;
        btn.style.color        = on ? '#fff' : '#334155';
        btn.style.fontWeight   = on ? '600' : '500';
        btn.style.boxShadow    = on ? 'inset 0 1px 0 rgba(255,255,255,0.18)' : 'none';
        const dot = btn.querySelector('.ss-dot');
        if (dot) dot.style.display = on ? 'inline-block' : 'none';
      }

      options.forEach(opt => {
        const value = opt.value !== undefined ? opt.value : opt;
        const label = opt.label !== undefined ? opt.label : opt;
        const btn = document.createElement('button');
        btn.type = 'button';
        css(btn, {
          appearance:'none', border:'1px solid '+THEME.line, background:'#fff', color:'#334155',
          padding:'5px 11px', borderRadius:'999px', fontSize:'12.5px', fontWeight:'500',
          cursor:'pointer', fontFamily:'inherit', letterSpacing:'-0.005em',
          transition:'background 120ms ease, border-color 120ms ease, color 120ms ease',
          display:'inline-flex', alignItems:'center', gap:'5px',
        });
        if (!multi) {
          const dot = el('span', { display:'none', width:'6px', height:'6px', borderRadius:'50%',
            background:'#fff', boxShadow:'0 0 0 1.5px rgba(255,255,255,0.5)', flexShrink:'0' });
          dot.className = 'ss-dot';
          btn.appendChild(dot);
        }
        btn.appendChild(document.createTextNode(label));
        applyStyle(btn, value);

        btn.addEventListener('mouseenter', () => {
          if (!isSel(value)) { btn.style.borderColor = THEME.hover; btn.style.background = THEME.tint; }
        });
        btn.addEventListener('mouseleave', () => {
          if (!isSel(value)) { btn.style.borderColor = THEME.line; btn.style.background = '#fff'; }
        });
        btn.addEventListener('click', () => {
          if (multi) {
            sel = isSel(value) ? sel.filter(v => v !== value) : [...sel, value];
            applyStyle(btn, value);
          } else {
            sel = value;
            allBtns.forEach(({ b, v }) => applyStyle(b, v));
          }
          onChange?.();
        });

        allBtns.push({ b: btn, v: value });
        wrap.appendChild(btn);
      });

      wrap.getValue    = () => sel;
      wrap.setOnChange = (cb) => { onChange = cb; };
      return wrap;
    }

    // ── 처리자 ───────────────────────────────────────────────
    const avatarEl = el('span', {
      width:'24px', height:'24px', borderRadius:'50%',
      background:THEME.tint, color:P,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:'11px', fontWeight:'700', flexShrink:'0',
      border:'1px solid '+THEME.line,
    }, savedProcesser.slice(0,1) || '·');

    const procInp = document.createElement('input');
    procInp.type = 'text';
    procInp.placeholder = '이름으로 검색';
    procInp.value = savedProcesser;
    css(procInp, { flex:'1', border:'none', outline:'none', fontSize:'13.5px', color:'#0f172a',
      fontFamily:'inherit', background:'transparent', minWidth:'0' });
    procInp.addEventListener('input', () => { avatarEl.textContent = procInp.value.slice(0,1) || '·'; });

    const procRow = el('div', { display:'flex', alignItems:'center', gap:'8px',
      padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:'10px', background:'#fff' });
    procRow.appendChild(avatarEl); procRow.appendChild(procInp);
    body.appendChild(ssSection('처리자', null, procRow));

    // ── 날짜 기준 ─────────────────────────────────────────────
    const dateTypeOpts = typeof DATE_TYPE_OPTIONS !== 'undefined' ? DATE_TYPE_OPTIONS :
      [{value:'R',label:'접수일'},{value:'P',label:'처리일'}];
    const dateTypeChips = chipGroup(dateTypeOpts, savedDateType, false);
    body.appendChild(ssSection('날짜 기준', '단일 선택', dateTypeChips));

    // ── 시작일 ────────────────────────────────────────────────
    const rangeOpts = typeof RANGE_OPTIONS !== 'undefined' ? RANGE_OPTIONS :
      [{value:'10',label:'10일 전'},{value:'30',label:'한달'},{value:'90',label:'3개월'},{value:'180',label:'6개월'},{value:'360',label:'360일'}];
    const dateChips = chipGroup(rangeOpts, savedDays, false);
    body.appendChild(ssSection('시작일', '단일 선택', dateChips));

    // ── 팀 ───────────────────────────────────────────────────
    const teamOpts = typeof TEAM_OPTIONS !== 'undefined' ? TEAM_OPTIONS : [];
    const teamHint = el('span', { fontSize:'10.5px', color:'#94a3b8', fontWeight:'500' }, `다중 · ${savedTeams.length}개`);
    const teamChips = chipGroup(teamOpts, savedTeams, true);
    teamChips.setOnChange(() => { teamHint.textContent = `다중 · ${teamChips.getValue().length}개`; });
    body.appendChild(ssSection('팀', teamHint, teamChips));

    // ── 처리상태 ─────────────────────────────────────────────
    const progOpts = typeof PROGRESSION_OPTIONS !== 'undefined' ? PROGRESSION_OPTIONS : [];
    const progHint = el('span', { fontSize:'10.5px', color:'#94a3b8', fontWeight:'500' }, `다중 · ${savedProg.length}개`);
    const progChips = chipGroup(progOpts, savedProg, true);
    progChips.setOnChange(() => { progHint.textContent = `다중 · ${progChips.getValue().length}개`; });
    body.appendChild(ssSection('처리상태', progHint, progChips));

    // ── 정렬 기준 ─────────────────────────────────────────────
    const sortColOpts = typeof SORT_COL_OPTIONS !== 'undefined' ? SORT_COL_OPTIONS :
      [{value:'status',label:'처리상태'},{value:'hub_name',label:'고객사명'},{value:'date',label:'처리일'},{value:'req_date',label:'접수일'}];
    const sortColSeg = chipGroup(sortColOpts, savedSortCol, false);
    const sortDirSeg = chipGroup([{value:'asc',label:'오름차순'},{value:'desc',label:'내림차순'}], savedSortDir, false);
    const sortWrap = el('div', { display:'flex', flexDirection:'column', gap:'6px' });
    sortWrap.appendChild(sortColSeg); sortWrap.appendChild(sortDirSeg);
    body.appendChild(ssSection('정렬 기준', '각 행 단일 선택', sortWrap));

    // ── 자동 설정 토글 ────────────────────────────────────────
    let autoOn = savedAuto;
    const toggleBtn = el('button', {
      appearance:'none', border:'none', width:'38px', height:'22px',
      borderRadius:'999px', background: savedAuto ? P : '#cbd5e1',
      position:'relative', cursor:'pointer', padding:'0', flexShrink:'0',
      transition:'background 200ms ease',
    });
    const knob = el('span', {
      position:'absolute', top:'2px', left: savedAuto ? '18px' : '2px',
      width:'18px', height:'18px', borderRadius:'50%', background:'#fff',
      boxShadow:'0 1px 3px rgba(15,23,42,0.25)',
      transition:'left 200ms cubic-bezier(.2,.8,.2,1)',
    });
    toggleBtn.appendChild(knob);
    toggleBtn.addEventListener('click', () => {
      autoOn = !autoOn;
      toggleBtn.style.background = autoOn ? P : '#cbd5e1';
      knob.style.left = autoOn ? '18px' : '2px';
    });

    const autoRowEl = el('div', { display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'12px', background:'#f8fafc', borderRadius:'10px', border:'1px solid #f1f5f9' });
    const autoLabelWrap = el('div', { display:'flex', flexDirection:'column', gap:'2px' });
    autoLabelWrap.appendChild(el('span', { fontSize:'13px', fontWeight:'500', color:'#0f172a' }, '화면 진입 시 자동 설정'));
    autoLabelWrap.appendChild(el('span', { fontSize:'11.5px', color:'#94a3b8' }, '다음 접속 때 이 조건이 즉시 적용돼요'));
    autoRowEl.appendChild(autoLabelWrap); autoRowEl.appendChild(toggleBtn);
    body.appendChild(autoRowEl);

    // ── 버튼 색상 ─────────────────────────────────────────────
    const colorWrap = el('div', { display:'flex', flexDirection:'column', gap:'6px' });
    MENU.forEach(item => {
      const row = el('div', { display:'flex', alignItems:'center', gap:'8px',
        padding:'4px 6px', borderRadius:'8px', transition:'background 0.1s' });
      row.addEventListener('mouseenter', () => row.style.background = '#f8fafc');
      row.addEventListener('mouseleave', () => row.style.background = 'transparent');

      const preview = el('span', { width:'24px', height:'24px', borderRadius:'6px', flexShrink:'0',
        display:'flex', alignItems:'center', justifyContent:'center', transition:'background 0.15s, color 0.15s' });
      const initC = getBtnColor(item.key);
      preview.style.background = initC.icon; preview.style.color = '#fff';
      preview.innerHTML = IC[item.key] || '';

      const rowLabel = el('span', { fontSize:'12px', color:'#334155', fontWeight:'500', flex:'1', minWidth:'80px' }, item.label);

      const swatches = el('div', { display:'flex', gap:'5px', alignItems:'center' });
      const curColors = loadBtnColors();
      COLOR_PRESETS.forEach(preset => {
        const sw = el('button', { width:'18px', height:'18px', borderRadius:'50%',
          background:preset.icon, border:'2px solid transparent',
          cursor:'pointer', padding:'0', flexShrink:'0', outline:'none',
          transition:'transform 0.12s, border-color 0.12s', boxSizing:'border-box' });
        sw.title = preset.id;
        const isCur = (curColors[item.key] || 'blue') === preset.id;
        if (isCur) { sw.style.borderColor = '#0f172a'; sw.style.transform = 'scale(1.25)'; }
        sw.addEventListener('click', () => {
          const colors = loadBtnColors();
          colors[item.key] = preset.id;
          saveBtnColors(colors);
          preview.style.background = preset.icon; preview.style.color = '#fff';
          swatches.querySelectorAll('button').forEach(s => { s.style.borderColor = 'transparent'; s.style.transform = ''; });
          sw.style.borderColor = '#0f172a'; sw.style.transform = 'scale(1.25)';
          applyBtnColorToDOM(item.key, preset.id);
        });
        swatches.appendChild(sw);
      });

      row.appendChild(preview); row.appendChild(rowLabel); row.appendChild(swatches);
      colorWrap.appendChild(row);
    });
    body.appendChild(ssSection('버튼 색상', '아이콘 색상 개별 지정', colorWrap));

    // ── 고정 버튼 숨김 너비 ──────────────────────────────────
    const colW = loadCollapseWidth();
    const colInp = document.createElement('input');
    colInp.type = 'number'; colInp.min = '600'; colInp.max = '3840'; colInp.step = '10'; colInp.value = colW;
    css(colInp, { width:'88px', boxSizing:'border-box', padding:'6px 8px', border:'1.5px solid #e2e8f0',
      borderRadius:'8px', outline:'none', fontSize:'13px', color:'#0f172a', background:'#f8fafc', fontFamily:'inherit' });
    colInp.addEventListener('focus', () => { colInp.style.borderColor = P; colInp.style.background = '#fff'; });
    colInp.addEventListener('blur',  () => { colInp.style.borderColor = '#e2e8f0'; colInp.style.background = '#f8fafc'; });
    colInp.addEventListener('change', () => {
      const v = parseInt(colInp.value);
      if (!isNaN(v) && v >= 600) { saveCollapseWidth(v); syncFloatingVisibility(); }
    });
    const colRow = el('div', { display:'flex', alignItems:'center', gap:'8px' });
    colRow.appendChild(colInp);
    colRow.appendChild(el('span', { fontSize:'12px', color:'#64748b' }, 'px 미만이면 고정 버튼 자동 숨김'));
    body.appendChild(ssSection('고정 버튼 숨김 너비', '기본 1280px', colRow));

    // ── 저장 ─────────────────────────────────────────────────
    function collectSettings() {
      if (typeof setCookie !== 'function') return;
      setCookie(COOKIE_PROCESSER,   procInp.value.trim());
      setCookie(COOKIE_DAYS,        dateChips.getValue());
      setCookie(COOKIE_TEAMS,       JSON.stringify(teamChips.getValue()));
      setCookie(COOKIE_PROGRESSION, JSON.stringify(progChips.getValue()));
      setCookie(COOKIE_SORT_COL,    sortColSeg.getValue());
      setCookie(COOKIE_SORT_DIR,    sortDirSeg.getValue());
      setCookie(COOKIE_DATE_TYPE,   dateTypeChips.getValue());
      setCookie(COOKIE_AUTO,        autoOn ? 'true' : 'false');
    }

    // ── 푸터: 닫기(좌) / 저장 + 저장&조회(우) ────────────────
    const footer = el('div', { display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'4px' });
    const rightBtns = el('div', { display:'flex', gap:'6px' });
    rightBtns.appendChild(btnGhost('저장', () => { collectSettings(); }));
    rightBtns.appendChild(btnPrimary('저장 & 조회', () => { collectSettings(); hidePanel(); applyAndSearch?.(); }));
    footer.appendChild(btnGhost('닫기', hidePanel));
    footer.appendChild(rightBtns);
    body.appendChild(footer);

    return { panel };
  }

  // ─── 사용법 모달 ─────────────────────────────────────────
  function openHelpModal() {
    if (document.getElementById('us-help-overlay')) return;

    const ITEMS = [
      { icon: IC.view,     title: '반영일정 조회',    desc: '등록된 반영 일정을 조회합니다. 담당자 이름·고객사로 필터링하며, 접수번호 클릭 시 해당 티켓으로 이동합니다. 본인이 등록한 일정은 수정·삭제 가능합니다.' },
      { icon: IC.register, title: '반영일정 등록',    desc: '팀·담당자를 선택하고 반영일시·제목을 입력해 일정을 등록합니다. 반영 15분 전·5분 전에 담당자 Slack DM으로 알림이 자동 발송됩니다.' },
      { icon: IC.date,     title: '날짜 조회',        desc: '검색 설정에 저장된 날짜 범위만 적용해 조회합니다. 처리자 조건 없이 기간 내 전체 항목을 빠르게 확인할 때 사용합니다.' },
      { icon: IC.cond,     title: '설정한 조건 조회', desc: '검색 설정에 저장된 처리자·날짜·팀·처리상태 조건을 모두 적용해 조회합니다.' },
      { icon: IC.search,   title: '설정',             desc: '처리자·시작일·팀·처리상태·정렬 기준을 설정하고 저장합니다. 버튼 색상 개별 지정 및 화면 진입 시 자동 적용 여부도 이곳에서 설정합니다.' },
    ];

    const overlay = document.createElement('div');
    overlay.id = 'us-help-overlay';
    Object.assign(overlay.style, {
      position:'fixed', inset:'0', background:'rgba(15,23,42,0.55)',
      zIndex:'9999999', display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Pretendard','Segoe UI',system-ui,sans-serif",
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      width:'480px', maxWidth:'calc(100vw - 32px)', maxHeight:'calc(100vh - 64px)',
      background:'#fff', borderRadius:'16px', overflow:'hidden',
      boxShadow:'0 30px 80px -20px rgba(15,23,42,0.3), 0 0 0 1px rgba(15,23,42,0.06)',
      display:'flex', flexDirection:'column',
    });

    // 헤더
    const hdr = document.createElement('div');
    Object.assign(hdr.style, {
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'16px 18px', borderBottom:'1px solid #e2e8f0', flexShrink:'0',
    });
    const hdrTitle = document.createElement('div');
    Object.assign(hdrTitle.style, { display:'flex', alignItems:'center', gap:'8px' });
    const hdrIcon = document.createElement('span');
    Object.assign(hdrIcon.style, {
      width:'28px', height:'28px', borderRadius:'8px',
      background:THEME.tint, color:P,
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:'0',
    });
    hdrIcon.innerHTML = IC.help;
    const hdrText = document.createElement('span');
    Object.assign(hdrText.style, { fontSize:'14px', fontWeight:'600', color:'#0f172a', letterSpacing:'-0.01em' });
    hdrText.textContent = '사용법 안내';
    hdrTitle.appendChild(hdrIcon); hdrTitle.appendChild(hdrText);

    const closeBtn = document.createElement('button');
    Object.assign(closeBtn.style, {
      appearance:'none', border:'none', background:'transparent',
      width:'32px', height:'32px', borderRadius:'8px', cursor:'pointer', color:'#94a3b8',
      display:'flex', alignItems:'center', justifyContent:'center', padding:'0', boxSizing:'border-box',
    });
    closeBtn.innerHTML = svg('<line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>', 20);
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = '#f1f5f9');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'transparent');
    closeBtn.addEventListener('click', () => overlay.remove());
    hdr.appendChild(hdrTitle); hdr.appendChild(closeBtn);

    // 본문
    const body = document.createElement('div');
    Object.assign(body.style, { padding:'14px 18px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'4px' });

    ITEMS.forEach(item => {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display:'flex', gap:'12px', alignItems:'flex-start',
        padding:'10px 12px', borderRadius:'10px', transition:'background 0.12s',
      });
      row.addEventListener('mouseenter', () => row.style.background = '#f8fafc');
      row.addEventListener('mouseleave', () => row.style.background = 'transparent');

      const iconWrap = document.createElement('span');
      Object.assign(iconWrap.style, {
        width:'36px', height:'36px', borderRadius:'8px',
        background:THEME.tint, color:P, flexShrink:'0',
        display:'flex', alignItems:'center', justifyContent:'center', marginTop:'1px',
      });
      iconWrap.innerHTML = item.icon;

      const textWrap = document.createElement('div');
      Object.assign(textWrap.style, { display:'flex', flexDirection:'column', gap:'3px', minWidth:'0' });

      const titleEl = document.createElement('span');
      Object.assign(titleEl.style, { fontSize:'13px', fontWeight:'600', color:'#0f172a', letterSpacing:'-0.005em' });
      titleEl.textContent = item.title;

      const descEl = document.createElement('span');
      Object.assign(descEl.style, { fontSize:'12px', color:'#64748b', lineHeight:'1.6' });
      descEl.textContent = item.desc;

      textWrap.appendChild(titleEl); textWrap.appendChild(descEl);
      row.appendChild(iconWrap); row.appendChild(textWrap);
      body.appendChild(row);
    });

    // 푸터 안내
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      margin:'4px 18px 14px', padding:'10px 12px',
      background:'#f8fafc', borderRadius:'10px', border:'1px solid #f1f5f9',
    });
    const footerText = document.createElement('span');
    Object.assign(footerText.style, { fontSize:'11.5px', color:'#94a3b8', lineHeight:'1.6', display:'block', marginBottom:'8px' });
    footerText.innerHTML = '※ 알림은 보조 기능으로 중요 일정은 반드시 별도 확인 바랍니다.<br>FAB 버튼은 드래그로 위치 이동이 가능합니다.<br>각 메뉴 항목의 핀 아이콘을 누르면 화면에 독립 버튼으로 고정할 수 있습니다. <br>(F8: 고정 버튼 삭제 모드 토글)';
    footer.appendChild(footerText);

    // 문의 섹션
    const contactWrap = document.createElement('div');
    Object.assign(contactWrap.style, { paddingTop:'8px', borderTop:'1px solid #e2e8f0' });

    // 레이블 + 배지 행
    const contactRow = document.createElement('div');
    Object.assign(contactRow.style, { display:'flex', alignItems:'center', gap:'6px' });
    const contactLabel = document.createElement('span');
    Object.assign(contactLabel.style, { fontSize:'11.5px', color:'#94a3b8' });
    contactLabel.textContent = '문의 및 개선요청:';
    const contactBadge = document.createElement('button');
    Object.assign(contactBadge.style, {
      appearance:'none', border:'1px solid #bfdbfe', background:THEME.tint,
      fontSize:'11.5px', fontWeight:'600', color:P,
      padding:'2px 10px', borderRadius:'20px', cursor:'pointer',
      fontFamily:'inherit', transition:'background 0.12s',
    });
    contactBadge.textContent = '구독 6팀 오찬열';
    contactBadge.addEventListener('mouseenter', () => contactBadge.style.background = '#dbeafe');
    contactBadge.addEventListener('mouseleave', () => contactBadge.style.background = THEME.tint);
    contactRow.appendChild(contactLabel); contactRow.appendChild(contactBadge);
    contactWrap.appendChild(contactRow);

    // 인라인 입력 폼 (기본 숨김)
    const formWrap = document.createElement('div');
    Object.assign(formWrap.style, {
      display:'none', flexDirection:'column', gap:'8px', marginTop:'10px',
    });

    const textarea = document.createElement('textarea');
    Object.assign(textarea.style, {
      width:'100%', boxSizing:'border-box', resize:'none', height:'72px',
      padding:'8px 10px', border:'1.5px solid #e2e8f0', borderRadius:'8px',
      fontSize:'12.5px', color:'#0f172a', background:'#f8fafc',
      fontFamily:'inherit', outline:'none', lineHeight:'1.5',
    });
    textarea.placeholder = '불편한 점이나 개선 아이디어를 자유롭게 남겨주세요 :)';
    textarea.addEventListener('focus', () => { textarea.style.borderColor = P; textarea.style.background = '#fff'; });
    textarea.addEventListener('blur',  () => { textarea.style.borderColor = '#e2e8f0'; textarea.style.background = '#f8fafc'; });

    const formBtns = document.createElement('div');
    Object.assign(formBtns.style, { display:'flex', gap:'6px', justifyContent:'flex-end', alignItems:'center' });

    const sendMsg = document.createElement('span');
    Object.assign(sendMsg.style, { fontSize:'11.5px', flex:'1', display:'none' });

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'us-btn us-btn-ghost';
    cancelBtn.textContent = '취소';
    cancelBtn.style.fontSize = '12px';
    cancelBtn.style.padding = '6px 12px';

    const sendBtn = document.createElement('button');
    sendBtn.className = 'us-btn us-btn-primary';
    sendBtn.textContent = '보내기';
    sendBtn.style.fontSize = '12px';
    sendBtn.style.padding = '6px 14px';

    formBtns.appendChild(sendMsg); formBtns.appendChild(cancelBtn); formBtns.appendChild(sendBtn);
    formWrap.appendChild(textarea); formWrap.appendChild(formBtns);
    contactWrap.appendChild(formWrap);
    footer.appendChild(contactWrap);

    // 토글
    let formOpen = false;
    contactBadge.addEventListener('click', () => {
      formOpen = !formOpen;
      formWrap.style.display = formOpen ? 'flex' : 'none';
      if (formOpen) textarea.focus();
    });
    cancelBtn.addEventListener('click', () => {
      formOpen = false;
      formWrap.style.display = 'none';
      textarea.value = '';
      sendMsg.style.display = 'none';
    });

    sendBtn.addEventListener('click', async () => {
      const message = textarea.value.trim();
      if (!message) { textarea.focus(); return; }
      const from = document.querySelector('.userNm')?.title?.trim() || '알 수 없음';
      sendBtn.textContent = '전송 중...'; sendBtn.disabled = true;
      try {
        const res = await relayFetch(`${API_BASE}/api/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, from }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || '전송 실패');
        Object.assign(sendMsg.style, { display:'inline', color:'#15803d' });
        sendMsg.textContent = '✓ 전송 완료! 감사합니다 :)';
        textarea.value = '';
        sendBtn.textContent = '보내기'; sendBtn.disabled = false;
        setTimeout(() => { sendMsg.style.display = 'none'; formWrap.style.display = 'none'; formOpen = false; }, 2500);
      } catch (e) {
        Object.assign(sendMsg.style, { display:'inline', color:'#dc2626' });
        sendMsg.textContent = '전송 실패: ' + e.message;
        sendBtn.textContent = '보내기'; sendBtn.disabled = false;
      }
    });

    modal.appendChild(hdr); modal.appendChild(body); modal.appendChild(footer);

    // 배경 클릭 시 닫기, 모달 내부 클릭은 전파 차단
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    ['mousedown','pointerdown'].forEach(t => modal.addEventListener(t, e => e.stopPropagation()));

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); }
    });
  }

  // ─── 수정 오버레이 ────────────────────────────────────────
  function openEditOverlay(r, onSaved) {
    if (document.getElementById('dne-overlay')) return;
    const d = new Date(r.deploy_at);
    const dateVal = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const timeVal = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

    const overlay = document.createElement('div');
    overlay.id = 'dne-overlay';
    css(overlay, { position:'fixed', inset:'0', background:'rgba(15,23,42,0.55)', zIndex:'9999999',
      display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Pretendard','Segoe UI',system-ui,sans-serif" });

    const { panel:modal, body } = createPanel('반영일정 수정', 400);
    css(modal, { maxHeight:'90vh' });

    function lbl(text) {
      return el('div', { display:'flex', flexDirection:'column', gap:'5px' },
        `<span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em">${text}</span>`);
    }
    function fld(text, child) { const w = lbl(text); w.appendChild(child); return w; }

    const dateInp = inp('date', '', dateVal);
    const timeInp = inp('time', '', timeVal);
    const dtRow = el('div', { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' });
    dtRow.appendChild(dateInp); dtRow.appendChild(timeInp);
    body.appendChild(fld('반영일시', dtRow));

    const hubInp    = inp('text', '고객사명', r.hub_name||'');
    const ticketInp = inp('text', '접수번호', r.ticket_no||'');
    body.appendChild(row2(fld('고객사', hubInp), fld('접수번호', ticketInp)));

    const titleInp = inp('text', '제목', r.title||'');
    body.appendChild(fld('제목', titleInp));

    // 알림 시간 다중 선택
    const NOTIFY_OPTS = [
      {value:5,label:'5분 전'},{value:10,label:'10분 전'},{value:15,label:'15분 전'},
      {value:30,label:'30분 전'},{value:60,label:'1시간 전'},
    ];
    let editNotifyTimes = Array.isArray(r.notify_times) ? [...r.notify_times] : [15];
    const notifyWrap = el('div', { display:'flex', flexWrap:'wrap', gap:'6px' });
    NOTIFY_OPTS.forEach(opt => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.textContent = opt.label;
      const applyStyle = () => {
        const on = editNotifyTimes.includes(opt.value);
        btn.style.background  = on ? P : '#fff';
        btn.style.borderColor = on ? P : THEME.line;
        btn.style.color       = on ? '#fff' : '#334155';
        btn.style.fontWeight  = on ? '600' : '500';
      };
      css(btn, { appearance:'none', border:'1px solid '+THEME.line, background:'#fff', color:'#334155',
        padding:'4px 10px', borderRadius:'999px', fontSize:'12px', fontWeight:'500',
        cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center',
        lineHeight:'1', whiteSpace:'nowrap', width:'auto', height:'auto', boxSizing:'border-box',
        transition:'all 120ms ease' });
      applyStyle();
      btn.addEventListener('click', () => {
        editNotifyTimes = editNotifyTimes.includes(opt.value)
          ? editNotifyTimes.filter(v => v !== opt.value)
          : [...editNotifyTimes, opt.value];
        applyStyle();
      });
      notifyWrap.appendChild(btn);
    });
    body.appendChild(fld('알림 시간', notifyWrap));

    const footer = el('div', { display:'flex', gap:'8px', justifyContent:'flex-end', paddingTop:'4px' });
    footer.appendChild(btnGhost('취소', () => overlay.remove()));
    const saveB = btnPrimary('저장', async () => {
      const dd = dateInp.value, dt = timeInp.value;
      if (!dd || !dt || !titleInp.value.trim()) return;
      await relayFetch(`${API_BASE}/api/deploy-schedules/${r.id}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ deploy_at:`${dd}T${dt}:00+09:00`, ticket_no:ticketInp.value||null,
          hub_name:hubInp.value||null, title:titleInp.value.trim(), notify_times:editNotifyTimes }),
      });
      overlay.remove(); onSaved?.();
    });
    footer.appendChild(saveB);
    body.appendChild(footer);

    // 패널 내 닫기 버튼 → overlay 닫기
    modal.querySelector('button').addEventListener('click', () => overlay.remove(), { once:true });

    ['click', 'mousedown', 'pointerdown'].forEach(type => {
      overlay.addEventListener(type, e => { if (e.target === overlay) return; e.stopPropagation(); });
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // ─── FAB 메뉴 툴팁 ──────────────────────────────────────
  let _tooltip = null;
  let _tooltipRaf = null;
  function getTooltip() {
    if (_tooltip) return _tooltip;
    _tooltip = el('div', {
      position:'fixed', zIndex:'2147483650',
      background:'rgba(15,23,42,0.88)', color:'#f1f5f9',
      fontSize:'12px', fontWeight:'400', lineHeight:'1.5',
      padding:'6px 10px', borderRadius:'7px',
      whiteSpace:'nowrap', pointerEvents:'none',
      opacity:'0', display:'none', transition:'opacity 0.12s',
      fontFamily:"'Pretendard','Segoe UI',system-ui,sans-serif",
      boxShadow:'0 4px 12px rgba(15,23,42,0.2)',
    });
    document.body.appendChild(_tooltip);
    return _tooltip;
  }
  function showTooltip(text, targetEl) {
    const t = getTooltip();
    if (_tooltipRaf) { cancelAnimationFrame(_tooltipRaf); _tooltipRaf = null; }
    t.textContent = text;
    t.style.display = 'block';
    t.style.opacity = '0';
    const r = targetEl.getBoundingClientRect();
    t.style.top   = (r.top + r.height / 2 - 14) + 'px';
    t.style.left  = '';
    t.style.right = (window.innerWidth - r.left + 8) + 'px';
    _tooltipRaf = requestAnimationFrame(() => { t.style.opacity = '1'; _tooltipRaf = null; });
  }
  function hideTooltip() {
    if (_tooltipRaf) { cancelAnimationFrame(_tooltipRaf); _tooltipRaf = null; }
    if (_tooltip) { _tooltip.style.opacity = '0'; _tooltip.style.display = 'none'; }
  }

  // ─── 플로팅 버튼 (핀 고정) ───────────────────────────────
  const floatCloseBtns = new Map(); // key → closeBtn element

  function loadPinned() {
    try { return JSON.parse(localStorage.getItem('us-pinned-btns') || '{}'); } catch { return {}; }
  }
  function savePinned(data) {
    localStorage.setItem('us-pinned-btns', JSON.stringify(data));
  }

  const COLLAPSE_WIDTH_KEY = 'us-collapse-width';
  function loadCollapseWidth() { const v = parseInt(localStorage.getItem(COLLAPSE_WIDTH_KEY)); return isNaN(v) ? 1280 : v; }
  function saveCollapseWidth(w) { localStorage.setItem(COLLAPSE_WIDTH_KEY, String(w)); }

  // % ↔ px 변환 (x > 100이면 구버전 px 데이터로 간주해 그대로 사용)
  function pctToPos(saved) {
    const x = saved.x <= 100 ? saved.x / 100 * window.innerWidth  : saved.x;
    const y = saved.y <= 100 ? saved.y / 100 * window.innerHeight : saved.y;
    return { x, y };
  }
  function pxToPct(px) {
    return {
      x: parseFloat((px.x / window.innerWidth  * 100).toFixed(3)),
      y: parseFloat((px.y / window.innerHeight * 100).toFixed(3)),
    };
  }

  function updatePinIcon(key, isPinned) {
    const p = document.getElementById('us-pin-' + key);
    if (!p) return;
    p.style.color       = isPinned ? P       : '#64748b';
    p.style.background  = isPinned ? THEME.tint : '#fff';
    p.style.borderColor = isPinned ? P       : THEME.line;
    p.title = isPinned ? '고정 해제' : '화면에 고정';
  }

  function removeFloatingBtn(key) {
    document.getElementById('us-float-' + key)?.remove();
    floatCloseBtns.delete(key);
    const data = loadPinned(); delete data[key]; savePinned(data);
    updatePinIcon(key, false);
  }

  function createFloatingBtn(item, savedPos) {
    const id = 'us-float-' + item.key;
    if (document.getElementById(id)) return;

    const data    = loadPinned();
    const rawSaved = savedPos || data[item.key];
    const initPx = rawSaved
      ? pctToPos(rawSaved)
      : { x: Math.round(window.innerWidth / 2), y: Math.round(window.innerHeight / 2) };
    const initPct = rawSaved || pxToPct(initPx);

    const wrap = el('div', {
      position:'fixed', right:initPx.x+'px', bottom:initPx.y+'px',
      zIndex:'2147483590', userSelect:'none', pointerEvents:'auto',
      fontFamily:"'Pretendard','Segoe UI',system-ui,sans-serif",
    });
    wrap.id = id;

    const _fc = getBtnColor(item.key);
    const btn = el('button', {
      display:'flex', alignItems:'center', gap:'7px', height:'36px', padding:'0 12px 0 8px',
      background:_fc.bg, color:'#0f172a', border:'1.5px solid '+THEME.line, borderRadius:'18px',
      boxShadow:'0 4px 16px -4px rgba(15,23,42,0.18), 0 1px 3px rgba(15,23,42,0.08)',
      cursor:'grab', fontFamily:'inherit', fontSize:'12.5px', fontWeight:'500',
      whiteSpace:'nowrap', letterSpacing:'-0.005em', outline:'none',
      transition:'border-color 0.15s, background 0.15s',
    });
    btn.className = 'us-float-btn';
    btn.dataset.colorBg = _fc.bg;
    btn.dataset.colorIcon = _fc.icon;

    const iconWrap = el('span', {
      width:'22px', height:'22px', borderRadius:'6px',
      background:_fc.icon, color:'#fff',
      display:'flex', alignItems:'center', justifyContent:'center', flexShrink:'0',
    });
    iconWrap.className = 'us-float-icon';
    iconWrap.innerHTML = IC[item.key] || '';
    btn.appendChild(iconWrap);
    btn.appendChild(document.createTextNode(item.label));

    btn.addEventListener('mouseenter', () => { if (!btn._drag) { btn.style.borderColor = btn.dataset.colorIcon; } });
    btn.addEventListener('mouseleave', () => { if (!btn._drag) { btn.style.background = btn.dataset.colorBg; btn.style.borderColor = THEME.line; } });
    btn.addEventListener('click', () => { if (!btn._moved) { item.fn(); } });

    // × 버튼 (F8로 토글)
    const closeBtn = el('button', {
      position:'absolute', top:'-7px', right:'-7px',
      width:'18px', height:'18px', borderRadius:'50%',
      background:'#64748b', color:'#fff', border:'none',
      display:'none', alignItems:'center', justifyContent:'center',
      cursor:'pointer', fontSize:'11px', fontWeight:'700',
      lineHeight:'1', padding:'0', pointerEvents:'auto',
    });
    closeBtn.className = 'us-float-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', e => { e.stopPropagation(); removeFloatingBtn(item.key); });

    floatCloseBtns.set(item.key, closeBtn);
    wrap.appendChild(btn);
    wrap.appendChild(closeBtn);
    document.body.appendChild(wrap);

    // 드래그
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    btn.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      dragging = true; btn._moved = false; btn._drag = true;
      sx = e.clientX; sy = e.clientY;
      ox = parseInt(wrap.style.right); oy = parseInt(wrap.style.bottom);
      btn.style.cursor = 'grabbing';
      try { btn.setPointerCapture(e.pointerId); } catch(_) {}
      e.preventDefault();
    });
    btn.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (!btn._moved && Math.hypot(dx, dy) > 4) btn._moved = true;
      if (btn._moved) {
        wrap.style.right  = Math.max(4, Math.min(window.innerWidth  - 150, ox - dx)) + 'px';
        wrap.style.bottom = Math.max(4, Math.min(window.innerHeight -  44, oy - dy)) + 'px';
      }
    });
    const endDrag = () => {
      if (!dragging) return; dragging = false; btn._drag = false;
      btn.style.cursor = 'grab';
      if (btn._moved) {
        const d = loadPinned();
        d[item.key] = pxToPct({ x: parseInt(wrap.style.right), y: parseInt(wrap.style.bottom) });
        savePinned(d);
      }
      setTimeout(() => { btn._moved = false; }, 0);
    };
    btn.addEventListener('pointerup', endDrag);
    btn.addEventListener('pointercancel', endDrag);

    // 저장 (% 형식으로)
    const d = loadPinned(); d[item.key] = initPct; savePinned(d);
    updatePinIcon(item.key, true);
  }

  function restorePinnedButtons() {
    const data = loadPinned();
    MENU.forEach(item => { if (data[item.key]) createFloatingBtn(item, data[item.key]); });
  }

  // ─── AI 유사사례 패널 ──────────────────────────────────────
  function renderAIPanel() {
    const AI_BASE = 'http://192.168.10.54:8000';
    const { panel, body } = createPanel('AI 유사사례', '현재 문의와 유사한 과거 처리 사례를 검색합니다', 520);

    function findInPage(selector) {
      const m = document.querySelector(selector);
      if (m) return m;
      for (const f of document.querySelectorAll('iframe')) {
        try { const r = f.contentDocument?.querySelector(selector); if (r) return r; } catch (_) {}
      }
      return null;
    }

    // 현재 페이지에서 문의 제목 + 내용 자동 추출 (HTML 태그 제거)
    const autoQuery = (() => {
      const title = findInPage('#REQ_TITLE')?.value?.trim() || findInPage('#REQ_TITLE')?.textContent?.trim() || '';
      const rawBody = findInPage('#REQ_TEXT')?.value || findInPage('#REQ_TEXT')?.innerHTML || '';
      const tmp = document.createElement('div');
      tmp.innerHTML = rawBody;
      const body = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
      return [title, body].filter(Boolean).join('\n');
    })();

    const queryInp = document.createElement('textarea');
    queryInp.value = autoQuery;
    queryInp.placeholder = '문의 내용을 입력하세요 (제목 + 본문)';
    css(queryInp, {
      width: '100%', boxSizing: 'border-box', resize: 'vertical',
      padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
      outline: 'none', fontSize: '13px', color: '#0f172a', background: '#f8fafc',
      fontFamily: 'inherit', transition: 'border-color 0.15s', minHeight: '72px',
    });
    queryInp.addEventListener('focus', () => { queryInp.style.borderColor = P; queryInp.style.background = '#fff'; });
    queryInp.addEventListener('blur',  () => { queryInp.style.borderColor = '#e2e8f0'; queryInp.style.background = '#f8fafc'; });

    const queryWrap = el('div', { display: 'flex', flexDirection: 'column', gap: '5px' });
    queryWrap.innerHTML = '<span style="font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em">문의 내용</span>';
    queryWrap.appendChild(queryInp);
    body.appendChild(queryWrap);

    // 이미지 내용 직접 입력 (토글)
    let imgOpen = false;
    const imgToggle = el('div', {
      fontSize: '11px', fontWeight: '600', color: '#64748b', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '4px', userSelect: 'none',
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }, '＋ 이미지 내용 직접 입력');
    const imgInp = document.createElement('textarea');
    css(imgInp, {
      width: '100%', boxSizing: 'border-box', padding: '8px 10px',
      fontSize: '12px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
      background: '#f8fafc', color: '#1e293b', resize: 'vertical',
      fontFamily: 'inherit', minHeight: '60px', display: 'none',
    });
    imgInp.placeholder = 'SAP 오류메세지, 화면 내용 등 이미지에서 확인한 내용을 입력하세요';
    imgInp.addEventListener('focus', () => { imgInp.style.borderColor = P; imgInp.style.background = '#fff'; });
    imgInp.addEventListener('blur',  () => { imgInp.style.borderColor = '#e2e8f0'; imgInp.style.background = '#f8fafc'; });
    imgToggle.addEventListener('click', () => {
      imgOpen = !imgOpen;
      imgInp.style.display = imgOpen ? 'block' : 'none';
      imgToggle.firstChild.textContent = (imgOpen ? '－' : '＋') + ' 이미지 내용 직접 입력';
    });
    const imgWrap = el('div', { display: 'flex', flexDirection: 'column', gap: '5px' });
    imgWrap.appendChild(imgToggle);
    imgWrap.appendChild(imgInp);
    body.appendChild(imgWrap);

    // 컬렉션 토글
    let selectedCol = 'support_cases_hyde';
    const toggleWrap = el('div', { display: 'flex', gap: '6px' });
    const colOptions = [
      { key: 'support_cases_hyde',     label: '문의' },
      { key: 'support_answers_hybrid', label: '처리내역' },
    ];
    colOptions.forEach(({ key, label }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.className = 'us-btn';
      css(btn, {
        flex: '1', padding: '5px 0', fontSize: '12px', fontWeight: '600',
        border: `1.5px solid ${key === selectedCol ? P : '#e2e8f0'}`,
        background: key === selectedCol ? P : '#f8fafc',
        color: key === selectedCol ? '#fff' : '#64748b',
        borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s',
      });
      btn.addEventListener('click', () => {
        selectedCol = key;
        toggleWrap.querySelectorAll('button').forEach((b, i) => {
          const active = colOptions[i].key === selectedCol;
          css(b, {
            border: `1.5px solid ${active ? P : '#e2e8f0'}`,
            background: active ? P : '#f8fafc',
            color: active ? '#fff' : '#64748b',
          });
        });
      });
      toggleWrap.appendChild(btn);
    });
    body.appendChild(toggleWrap);

    const searchBtn = btnPrimary('검색');
    searchBtn.style.width = '100%';
    body.appendChild(searchBtn);

    const resultWrap = el('div', { display: 'flex', flexDirection: 'column', gap: '8px' });
    body.appendChild(resultWrap);

    let lastRefinedQuery = '';
    let lastRawQuery     = '';

    async function sendFeedback(caseId, positive) {
      try {
        await fetch(`${API}/feedback`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ case_id: caseId, positive, query: lastRawQuery, refined_query: lastRefinedQuery }),
        });
      } catch (e) { console.warn('피드백 전송 실패', e); }
    }

    function renderResults(cases, refinedQuery = '') {
      resultWrap.innerHTML = '';
      if (refinedQuery) {
        resultWrap.appendChild(el('div', {
          fontSize: '11px', color: '#64748b', background: '#f1f5f9',
          borderRadius: '6px', padding: '6px 10px', marginBottom: '4px',
        }, `검색 키워드: ${refinedQuery}`));
      }
      if (!cases.length) {
        resultWrap.appendChild(el('div', { color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '16px' }, '유사 사례를 찾지 못했습니다.'));
        return;
      }
      cases.forEach(c => {
        const card = el('div', {
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
          padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px',
        });

        // 헤더
        const hdr = el('div', { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' });
        hdr.appendChild(el('span', {
          background: P, color: '#fff', borderRadius: '6px',
          padding: '1px 8px', fontSize: '12px', fontWeight: '700',
        }, `#${c.rank}`));

        // support_answers_hybrid는 case_id가 SRP_IDX라 sr_idx(SR_IDX) 우선 사용
        const srIdx = c.sr_idx || c.case_id;

        const caseLink = el('span', {
          fontSize: '13px', fontWeight: '600', color: P,
          cursor: 'pointer', textDecoration: 'underline',
        }, String(srIdx));
        caseLink.addEventListener('click', () => {
          const t = findInPage('#TITLE_BAR .up-title-text')?.textContent?.trim() || '';
          const originId = (t.match(/접수번호\s*:\s*(\S+)/) || [])[1];
          if (originId) localStorage.setItem(US_BACK_KEY, originId);
          top.pageRedirectByProgramId?.('upOperWork01011', { SR_IDX: srIdx });
        });
        hdr.appendChild(caseLink);

        const detailBtn = el('button', {
          fontSize: '11px', fontWeight: '600', padding: '1px 8px',
          background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569',
          borderRadius: '5px', cursor: 'pointer',
        }, '처리내역');
        detailBtn.addEventListener('click', () => {
          top.uniPopup?.openPopupByProgramId('upOperWork01016', 850, 800, { popupFlag: true, SR_IDX: srIdx });
        });
        hdr.appendChild(detailBtn);

        const draftBtn = el('button', {
          fontSize: '11px', fontWeight: '600', padding: '1px 8px',
          background: '#eef2ff', border: '1px solid #c7d2fe', color: P,
          borderRadius: '5px', cursor: 'pointer',
        }, '초안 생성');
        hdr.appendChild(draftBtn);

        const score = Math.round(c.score * 1000) / 10;
        const [scoreBg, scoreColor] = score >= 70 ? ['#dcfce7','#15803d'] : score >= 50 ? ['#fef9c3','#a16207'] : ['#f1f5f9','#64748b'];
        hdr.appendChild(el('span', {
          background: scoreBg, color: scoreColor, borderRadius: '20px',
          padding: '1px 8px', fontSize: '11.5px', fontWeight: '600',
        }, `유사도 ${score.toFixed(1)}%`));
        hdr.appendChild(el('span', { fontSize: '11px', color: '#94a3b8', marginLeft: 'auto' }, (c.created_at || '').slice(0, 10)));
        card.appendChild(hdr);

        // 문의 내용 스니펫
        if (c.doc) {
          const docEl = el('div', {
            fontSize: '12.5px', color: '#334155', lineHeight: '1.6',
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '6px',
            padding: '8px 10px', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
          });
          docEl.textContent = c.doc.slice(0, 200) + (c.doc.length > 200 ? '…' : '');
          card.appendChild(docEl);
        }

        // 👍/👎 피드백 버튼
        const fbWrap = el('div', { display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' });
        let voted = null;
        const mkBtn = (label, positive) => {
          const btn = el('button', {
            fontSize: '11px', padding: '2px 10px', borderRadius: '12px', cursor: 'pointer',
            border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b',
          }, label);
          btn.addEventListener('click', async () => {
            if (voted !== null) return;
            voted = positive;
            await sendFeedback(c.case_id, positive);
            btn.style.background   = positive ? '#dcfce7' : '#fee2e2';
            btn.style.color        = positive ? '#16a34a' : '#dc2626';
            btn.style.borderColor  = positive ? '#86efac' : '#fca5a5';
          });
          return btn;
        };
        fbWrap.appendChild(mkBtn('👍 도움됨', true));
        fbWrap.appendChild(mkBtn('👎 아님',  false));
        card.appendChild(fbWrap);

        // 초안 생성 결과 영역 (기본 숨김)
        const draftWrap = el('div', { display: 'none', flexDirection: 'column', gap: '6px' });
        const draftArea = document.createElement('textarea');
        css(draftArea, {
          width: '100%', boxSizing: 'border-box', resize: 'vertical', minHeight: '120px',
          padding: '8px 10px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
          outline: 'none', fontSize: '12.5px', color: '#0f172a', background: '#fff',
          fontFamily: 'inherit', lineHeight: '1.6',
        });
        const draftActions = el('div', { display: 'flex', justifyContent: 'flex-end' });
        const copyBtn = el('button', {
          fontSize: '11px', fontWeight: '600', padding: '3px 10px',
          background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569',
          borderRadius: '6px', cursor: 'pointer',
        }, '복사');
        copyBtn.addEventListener('click', () => {
          navigator.clipboard.writeText(draftArea.value).then(() => {
            copyBtn.textContent = '복사됨';
            setTimeout(() => { copyBtn.textContent = '복사'; }, 1200);
          });
        });
        draftActions.appendChild(copyBtn);
        draftWrap.appendChild(draftArea);
        draftWrap.appendChild(draftActions);
        card.appendChild(draftWrap);

        draftBtn.addEventListener('click', async () => {
          if (draftWrap.style.display === 'flex') { draftWrap.style.display = 'none'; return; }
          draftBtn.disabled = true;
          draftBtn.textContent = '생성 중...';
          try {
            const res = await relayFetch(`${AI_BASE}/draft`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query: lastRawQuery, case_id: c.case_id, collection: selectedCol }),
              timeout: 30000,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || '초안 생성 실패');
            draftArea.value = data.draft || '';
            draftWrap.style.display = 'flex';
          } catch (e) {
            draftArea.value = `오류: ${e.message}`;
            draftWrap.style.display = 'flex';
          } finally {
            draftBtn.disabled = false;
            draftBtn.textContent = '초안 생성';
          }
        });

        resultWrap.appendChild(card);
      });
    }

    async function doSearch() {
      const imgText = imgInp.value.trim();
      const query = imgText
        ? `${queryInp.value.trim()}\n\n[이미지 내용]\n${imgText}`
        : queryInp.value.trim();
      if (!query) {
        resultWrap.innerHTML = '<div style="color:#94a3b8;font-size:13px;text-align:center;padding:16px">문의 내용을 입력해주세요.</div>';
        return;
      }
      resultWrap.innerHTML = '<div style="color:#94a3b8;font-size:13px;text-align:center;padding:16px">검색 중...</div>';
      searchBtn.disabled = true;
      searchBtn.textContent = '검색 중...';
      const hubEl = findInPage('#HUB_NAME');
      const company = hubEl?.value?.trim() || hubEl?.textContent?.trim() || '';
      try {
        const res = await relayFetch(`${AI_BASE}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, company, collection: selectedCol }),
          timeout: 30000,
        });
        const data = await res.json();
        lastRawQuery     = query;
        lastRefinedQuery = data.refined_query || '';
        renderResults(data.cases || [], data.refined_query || '');
      } catch (e) {
        resultWrap.innerHTML = `<div style="color:#dc2626;font-size:13px;padding:12px">오류: ${e.message}</div>`;
      } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = '검색';
      }
    }

    searchBtn.addEventListener('click', doSearch);

    return { panel };
  }

  // ─── FAB 빌드 ────────────────────────────────────────────
  function buildFAB() {
    if (!isTargetPage()) return;
    if (document.getElementById('us-fab-root')) return;

    const root = el('div', { position:'fixed', right:pos.x+'px', bottom:pos.y+'px',
      zIndex:'2147483600', display:'flex', flexDirection:'column', alignItems:'flex-end',
      gap:'10px', pointerEvents:'none', userSelect:'none',
      fontFamily:"'Pretendard','Segoe UI',system-ui,sans-serif" });
    root.id = 'us-fab-root';

    const menu = el('div', { display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px', pointerEvents:'none', alignSelf:'flex-end' });
    menu.id = 'us-fab-menu';

    MENU.forEach(item => {
      // 아이템 래퍼 (애니메이션 단위)
      const wrap = el('div', {
        display:'none', alignItems:'center', gap:'4px',
        transform:'translateY(10px) scale(0.96)', opacity:'0',
        transition:'transform 240ms cubic-bezier(.2,.8,.2,1), opacity 200ms ease',
      });
      wrap.className = 'us-fab-item';

      // 액션 버튼
      const _c = getBtnColor(item.key);
      const btn = el('button', {
        display:'flex', alignItems:'center', gap:'10px', height:'40px',
        padding:'0 12px 0 10px', background:_c.bg, color:'#0f172a',
        border:'1px solid '+THEME.line, borderRadius:'20px',
        boxShadow:'0 8px 24px -8px rgba(15,23,42,0.18), 0 1px 2px rgba(15,23,42,0.06)',
        cursor:'pointer', fontFamily:'inherit', fontSize:'13px', fontWeight:'500',
        whiteSpace:'nowrap', letterSpacing:'-0.005em', outline:'none', pointerEvents:'auto',
      });
      btn.id = 'us-btn-' + item.key;
      btn.dataset.colorBg = _c.bg;
      btn.dataset.colorIcon = _c.icon;

      const iconWrap = el('span', { width:'26px', height:'26px', borderRadius:'8px',
        background:_c.icon, color:'#fff',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:'0' });
      iconWrap.id = 'us-icon-' + item.key;
      iconWrap.innerHTML = IC[item.key] || '';
      btn.appendChild(iconWrap);
      btn.appendChild(document.createTextNode(item.label));

      btn.addEventListener('mouseenter', () => { btn.style.borderColor = btn.dataset.colorIcon; if (item.desc) showTooltip(item.desc, btn); });
      btn.addEventListener('mouseleave', () => { btn.style.borderColor = THEME.line; hideTooltip(); });
      btn.addEventListener('click', () => { hideTooltip(); toggleOpen(false); item.fn(); });

      // 핀 버튼
      const isPinned = !!loadPinned()[item.key];
      const pinBtn = el('button', {
        width:'36px', height:'36px', borderRadius:'8px',
        border:'1.5px solid ' + (isPinned ? P : THEME.line),
        background: isPinned ? THEME.tint : '#fff',
        color: isPinned ? P : '#64748b',
        display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', flexShrink:'0', pointerEvents:'auto',
        transition:'color 0.15s, background 0.15s, border-color 0.15s',
      });
      pinBtn.id = 'us-pin-' + item.key;
      pinBtn.title = isPinned ? '고정 해제' : '화면에 고정';
      pinBtn.innerHTML = IC.pin;
      pinBtn.addEventListener('mouseenter', () => {
        if (!document.getElementById('us-float-' + item.key)) { pinBtn.style.background = THEME.tint; pinBtn.style.borderColor = P; pinBtn.style.color = P; }
      });
      pinBtn.addEventListener('mouseleave', () => {
        if (!document.getElementById('us-float-' + item.key)) { pinBtn.style.background = '#fff'; pinBtn.style.borderColor = THEME.line; pinBtn.style.color = '#64748b'; }
      });
      pinBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (document.getElementById('us-float-' + item.key)) removeFloatingBtn(item.key);
        else createFloatingBtn(item);
      });

      wrap.appendChild(btn);
      wrap.appendChild(pinBtn);
      menu.appendChild(wrap);
    });

    const fab = el('button', { width:'56px', height:'56px', borderRadius:'50%', border:'none',
      background:`linear-gradient(180deg, ${PL} 0%, ${P} 55%, ${PD} 100%)`,
      color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'grab', touchAction:'none', position:'relative', pointerEvents:'auto',
      boxShadow:`0 18px 36px -10px ${THEME.shadow}, 0 6px 14px -4px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(15,23,42,0.12)`,
      transition:'transform 220ms cubic-bezier(.2,.8,.2,1)', fontFamily:'inherit', outline:'none' });
    fab.id = 'us-fab-btn';
    fab.innerHTML = IC.plus;

    const badge = el('span', { position:'absolute', right:'-2px', bottom:'-2px',
      width:'18px', height:'18px', borderRadius:'50%', background:'#fff', color:PD,
      fontSize:'9px', fontWeight:'700', letterSpacing:'-0.04em',
      display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:`0 2px 6px rgba(15,23,42,0.18), inset 0 0 0 1px ${THEME.line}`,
      pointerEvents:'none' }, 'us');
    fab.appendChild(badge);

    setupDrag(fab, root);
    fab.addEventListener('click', () => { if (fab._moved) return; toggleOpen(!isOpen); });
    fab.addEventListener('mouseenter', () => { if (!fab._dragging) fab.style.transform = isOpen ? 'rotate(45deg) scale(1.04)' : 'scale(1.04)'; });
    fab.addEventListener('mouseleave', () => { if (!fab._dragging) fab.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0)'; });

    root.appendChild(menu);
    root.appendChild(fab);
    document.body.appendChild(root);

    document.addEventListener('mousedown', (e) => {
      if (!isOpen) return;
      const r = document.getElementById('us-fab-root');
      if (r && !r.contains(e.target)) toggleOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { if (activePanelKey) hidePanel(); else if (isOpen) toggleOpen(false); }
    });
  }

  function toggleOpen(val) {
    isOpen = val;
    if (!isOpen) hideTooltip();
    const menu = document.getElementById('us-fab-menu');
    const fab  = document.getElementById('us-fab-btn');
    if (!menu || !fab) return;
    const items = menu.querySelectorAll('.us-fab-item');
    const total = items.length;

    if (isOpen) {
      // 열릴 때: 먼저 display 복원 후 애니메이션
      items.forEach((item, i) => {
        item.style.display = 'flex';
        const delay = (total-1-i)*28;
        item.style.transition = `transform 240ms cubic-bezier(.2,.8,.2,1) ${delay}ms, opacity 200ms ease ${delay}ms`;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          item.style.transform = 'translateY(0) scale(1)';
          item.style.opacity   = '1';
        }));
      });
    } else {
      // 닫힐 때: 애니메이션 후 display:none
      const maxDelay = (total-1)*14 + 200;
      items.forEach((item, i) => {
        const delay = i*14;
        item.style.transition = `transform 240ms cubic-bezier(.4,0,1,1) ${delay}ms, opacity 200ms ease ${delay}ms`;
        item.style.transform = 'translateY(10px) scale(0.96)';
        item.style.opacity   = '0';
        setTimeout(() => { item.style.display = 'none'; }, maxDelay);
      });
    }

    fab.style.transform = isOpen ? 'rotate(45deg)' : 'rotate(0)';
  }

  // ─── 드래그 ──────────────────────────────────────────────
  function setupDrag(fab, root) {
    let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0;
    fab.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true; fab._moved = false; fab._dragging = true;
      sx = e.clientX; sy = e.clientY; ox = pos.x; oy = pos.y;
      fab.style.cursor = 'grabbing';
      try { fab.setPointerCapture(e.pointerId); } catch(_) {}
      e.preventDefault();
    });
    fab.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX-sx, dy = e.clientY-sy;
      if (!fab._moved && Math.hypot(dx,dy) > 4) fab._moved = true;
      if (fab._moved) {
        const vw = window.innerWidth, vh = window.innerHeight;
        pos.x = Math.max(12, Math.min(vw-80, ox-dx));
        pos.y = Math.max(12, Math.min(vh-80, oy-dy));
        root.style.right = pos.x+'px'; root.style.bottom = pos.y+'px';
        updatePanelContainerPos();
      }
    });
    const end = () => { dragging = false; fab._dragging = false; fab.style.cursor = 'grab'; setTimeout(() => { fab._moved = false; }, 0); };
    fab.addEventListener('pointerup', end);
    fab.addEventListener('pointercancel', end);
  }

  // ─── 리사이즈: 클램핑 + 반응형 숨김 ──────────────────────
  window.addEventListener('resize', () => { clampFloatingBtns(); syncFloatingVisibility(); });

  // ─── SPA 네비게이션 감지 ─────────────────────────────────
  window.addEventListener('popstate', () => {
    if (!isTargetPage()) { removeFAB(); } else if (!document.getElementById('us-fab-root')) { buildFAB(); }
  });

  // ─── 플로팅 버튼 탭 연동 ────────────────────────────────
  function isFloatTargetTab() {
    return !!document.querySelector('li.ui-tabs-active[name*="요청내역관리"]');
  }

  function syncFloatingVisibility() {
    const show = isFloatTargetTab();
    const collapsed = window.innerWidth < loadCollapseWidth();
    MENU.forEach(item => {
      const el = document.getElementById('us-float-' + item.key);
      if (el) el.style.display = (show && !collapsed) ? '' : 'none';
    });
  }

  function resolveFloatOverlaps() {
    const pins = [];
    MENU.forEach(item => {
      const wrap = document.getElementById('us-float-' + item.key);
      if (!wrap || wrap.style.display === 'none') return;
      pins.push({ wrap, r: parseInt(wrap.style.right)||0, b: parseInt(wrap.style.bottom)||0,
        w: Math.max(wrap.offsetWidth, 80), h: Math.max(wrap.offsetHeight, 36) });
    });
    pins.sort((a, b) => a.b - b.b);
    for (let i = 1; i < pins.length; i++) {
      for (let j = 0; j < i; j++) {
        const a = pins[j], p = pins[i];
        const aL = window.innerWidth - a.r - a.w, pL = window.innerWidth - p.r - p.w;
        const hOvlp = aL < pL + p.w + 4 && pL < aL + a.w + 4;
        const vOvlp = a.b < p.b + p.h + 4 && p.b < a.b + a.h + 4;
        if (hOvlp && vOvlp) { pins[i].b = a.b + a.h + 8; pins[i].wrap.style.bottom = pins[i].b + 'px'; }
      }
    }
  }

  function clampFloatingBtns() {
    const data = loadPinned();
    // 저장된 % 위치를 px로 변환 후 클램핑 — DOM 이동만, localStorage엔 저장 안 함
    MENU.forEach(item => {
      const wrap = document.getElementById('us-float-' + item.key);
      if (!wrap) return;
      const bw = Math.max(wrap.offsetWidth, 80), bh = Math.max(wrap.offsetHeight, 36);
      const saved = data[item.key];
      const ref = saved ? pctToPos(saved) : { x: parseInt(wrap.style.right)||0, y: parseInt(wrap.style.bottom)||0 };
      wrap.style.right  = Math.max(4, Math.min(window.innerWidth  - bw - 4, ref.x)) + 'px';
      wrap.style.bottom = Math.max(4, Math.min(window.innerHeight - bh - 4, ref.y)) + 'px';
    });
    resolveFloatOverlaps();
    // FAB 자체도 클램핑
    const root = document.getElementById('us-fab-root');
    if (root) {
      pos.x = Math.max(12, Math.min(window.innerWidth  - 80, pos.x));
      pos.y = Math.max(12, Math.min(window.innerHeight - 80, pos.y));
      root.style.right = pos.x + 'px'; root.style.bottom = pos.y + 'px';
      updatePanelContainerPos();
    }
  }

  // 탭 전환 감지 (클래스 변화 관찰)
  new MutationObserver(syncFloatingVisibility)
    .observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });

  // ─── 초기화 ──────────────────────────────────────────────
  injectStyles();
  buildFAB();
  restorePinnedButtons();
  syncFloatingVisibility();

  // F8: 플로팅 버튼 × 표시 토글
  let editMode = false;
  const attachedF8 = new WeakSet();

  function attachF8(target) {
    if (!target || attachedF8.has(target)) return;
    attachedF8.add(target);
    target.addEventListener('keydown', e => {
      if (e.code !== 'F8') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      editMode = !editMode;
      floatCloseBtns.forEach(c => { c.style.display = editMode ? 'flex' : 'none'; });
    }, true);
  }

  attachF8(window);

  // iframe 포커스 시에도 F8 동작하도록
  new MutationObserver(() => {
    document.querySelectorAll('iframe').forEach(f => {
      try { if (f.contentWindow) attachF8(f.contentWindow); } catch(_) {}
      try { attachBackObserver(f.contentDocument); } catch(_) {}
    });
  }).observe(document.body, { childList: true, subtree: true });
  new MutationObserver(() => {
    if (!isTargetPage()) { removeFAB(); return; }
    if (!document.getElementById('us-fab-root')) buildFAB();
    injectBackButton();
  }).observe(document.body, { childList:true, subtree:false });

  function findTitleBar() {
    // 메인 doc + 전체 iframe 탐색
    const direct = document.getElementById('TITLE_BAR');
    if (direct) return direct;
    for (const f of document.querySelectorAll('iframe')) {
      try {
        const t = f.contentDocument?.getElementById('TITLE_BAR');
        if (t) return t;
      } catch(_) {}
    }
    return null;
  }

  function injectBackButton() {
    const originId = localStorage.getItem(US_BACK_KEY);
    if (!originId) return;
    const titleBar = findTitleBar();
    if (!titleBar) return;
    if (titleBar.querySelector('#us-back-btn')) return;

    // 반짝임 keyframe 주입 (중복 방지)
    const iframeDoc = findTitleBar()?.ownerDocument || document;
    if (!iframeDoc.getElementById('us-back-btn-style')) {
      const s = iframeDoc.createElement('style');
      s.id = 'us-back-btn-style';
      s.textContent = `
        @keyframes us-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(37,99,235,0.5); }
          50%      { box-shadow: 0 0 0 6px rgba(37,99,235,0); }
        }
        #us-back-btn { animation: us-pulse 1.4s ease-in-out infinite; }
        #us-back-btn:hover { background: #eff6ff !important; animation: none !important; }
      `;
      (iframeDoc.head || iframeDoc.documentElement).appendChild(s);
    }

    const btn = iframeDoc.createElement('button');
    btn.id = 'us-back-btn';
    btn.textContent = '← 원래 문의로';
    Object.assign(btn.style, {
      fontSize: '12px', fontWeight: '600', padding: '3px 10px',
      background: '#fff', border: '1.5px solid ' + P, color: P,
      borderRadius: '6px', cursor: 'pointer', marginRight: '8px',
      verticalAlign: 'middle', lineHeight: '1.4',
    });
    btn.addEventListener('click', () => {
      localStorage.removeItem(US_BACK_KEY);
      btn.remove();
      top.pageRedirectByProgramId?.('upOperWork01011', { SR_IDX: originId });
    });

    const container = titleBar.querySelector('.up-buttonbar-title-container');
    container ? container.after(btn) : titleBar.prepend(btn);
  }

  // iframe 내부 DOM 변화에도 반응 (TITLE_BAR가 iframe 안에 있는 경우)
  const attachedBackObserver = new WeakMap(); // doc → true
  function attachBackObserver(iframeDoc) {
    if (!iframeDoc || attachedBackObserver.has(iframeDoc)) return;
    attachedBackObserver.set(iframeDoc, true);
    new MutationObserver(() => injectBackButton())
      .observe(iframeDoc.body || iframeDoc.documentElement, { childList: true, subtree: true });
  }

  // iframe load 이벤트 감지 — 페이지 이동 후 document 교체 시 재부착
  function attachIframeLoadListener(iframe) {
    iframe.addEventListener('load', () => {
      try {
        attachedBackObserver.delete(iframe.contentDocument); // 새 doc이므로 초기화
        attachBackObserver(iframe.contentDocument);
        injectBackButton();
      } catch(_) {}
    });
  }

  document.querySelectorAll('iframe').forEach(f => {
    try { attachBackObserver(f.contentDocument); attachIframeLoadListener(f); } catch(_) {}
  });

  // 새로 추가되는 iframe에도 load 리스너 부착
  new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(n => {
      if (n.tagName === 'IFRAME') {
        try { attachBackObserver(n.contentDocument); attachIframeLoadListener(n); } catch(_) {}
      }
    }));
  }).observe(document.body, { childList: true, subtree: true });

  injectBackButton();
})();
