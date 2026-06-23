const API_BASE = 'http://192.168.10.54:3001';

// Mixed Content 우회: window.postMessage → relay.js(ISOLATED) → background.js(HTTP fetch)
function relayFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2, 10);

    function onMsg(e) {
      if (!e.data?.__us_fetch_resp || e.data.id !== id) return;
      window.removeEventListener('message', onMsg);
      clearTimeout(timer);
      if (e.data.error) { reject(new Error(e.data.error)); return; }
      resolve({
        ok:   e.data.ok,
        status: e.data.status,
        json: () => Promise.resolve(e.data.data),
      });
    }

    const timer = setTimeout(() => {
      window.removeEventListener('message', onMsg);
      reject(new Error('relayFetch timeout'));
    }, options.timeout || 10000);

    window.addEventListener('message', onMsg);
    window.postMessage({
      __us_fetch: true, id,
      url,
      method:  options.method  || 'GET',
      headers: options.headers || null,
      body:    options.body    || null,
    }, '*');
  });
}

let membersData = [];

async function loadMembers() {
  try {
    const res = await relayFetch(`${API_BASE}/api/members`);
    membersData = await res.json();
  } catch (e) {
    console.error('[반영일정] 멤버 로드 실패:', e);
  }
}

function getNotifyTeams() {
  return [...new Set(membersData.map(m => m.teamName))].filter(Boolean);
}

function getMembersByTeam(teamName) {
  return membersData.filter(m => m.teamName === teamName);
}

loadMembers();


// ─── 반영일정 모달 ────────────────────────────────────────
async function openNotifyModal() {
  if (document.getElementById('dna-overlay')) return;
  await loadMembers();

  // #TITLE_BAR에서 접수번호 자동 추출 (iframe 포함 탐색)
  function getTitleText() {
    let el = document.querySelector('#TITLE_BAR .up-title-text');
    if (!el) {
      for (const iframe of document.querySelectorAll('iframe')) {
        try {
          el = iframe.contentDocument?.querySelector('#TITLE_BAR .up-title-text');
          if (el) break;
        } catch (e) {}
      }
    }
    return el?.textContent?.trim() || '';
  }
  const ticketMatch = getTitleText().match(/접수번호\s*:\s*(\S+)/);
  const autoTicketNo = ticketMatch ? ticketMatch[1] : '';

  // #HUB_NAME에서 고객사 자동 추출 (iframe 포함)
  function getHubName() {
    let el = document.querySelector('#HUB_NAME');
    if (!el) {
      for (const iframe of document.querySelectorAll('iframe')) {
        try {
          el = iframe.contentDocument?.querySelector('#HUB_NAME');
          if (el) break;
        } catch (e) {}
      }
    }
    return el?.value?.trim() || '';
  }
  const autoHubName = getHubName();

  const today = new Date();
  const defaultDate = today.toISOString().slice(0, 10);
  const defaultTime = `${String(today.getHours()).padStart(2,'0')}:00`;

  const overlay = document.createElement('div');
  overlay.id = 'dna-overlay';
  overlay.innerHTML = `
    <div id="dna-modal">
      <div class="dna-modal-header">
        <h2>반영일정 등록</h2>
        <button class="dna-close-x" id="dna-close-x">✕</button>
      </div>

      <div class="dna-notice">
        ※ 본 기능은 업무 편의를 위한 보조 알림 기능입니다.<br>
        알림 누락, 지연 등의 가능성이 있으므로 중요 일정 및 만료 여부는 반드시 별도 확인 부탁드립니다.
      </div>

      <div class="dna-row2">
        <div class="dna-field">
          <label>팀</label>
          <select id="dna-team">
            <option value="">팀 선택</option>
            ${getNotifyTeams().map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div class="dna-field">
          <label>담당자</label>
          <select id="dna-member" disabled>
            <option value="">팀 먼저 선택</option>
          </select>
        </div>
      </div>

      <div class="dna-field">
        <label>반영일시</label>
        <div class="dna-datetime-row">
          <input type="date" id="dna-deploy-date" value="${defaultDate}" />
          <input type="time" id="dna-deploy-time" value="${defaultTime}" />
        </div>
      </div>

      <div class="dna-row2">
        <div class="dna-field">
          <label>고객사</label>
          <input type="text" id="dna-hub-name" value="${autoHubName}" placeholder="고객사명" />
        </div>
        <div class="dna-field">
          <label>접수번호</label>
          <input type="text" id="dna-ticket-no" value="${autoTicketNo}" placeholder="예: 20250997489" />
        </div>
      </div>

      <div class="dna-field">
        <label>제목</label>
        <input type="text" id="dna-title" placeholder="반영 내용을 입력하세요" />
      </div>

      <div id="dna-msg"></div>

      <div id="dna-actions">
        <button id="dna-cancel">취소</button>
        <button id="dna-submit">등록</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('dna-team').addEventListener('change', (e) => {
    const memberSelect = document.getElementById('dna-member');
    const members = getMembersByTeam(e.target.value);
    memberSelect.disabled = members.length === 0;
    memberSelect.innerHTML = members.length
      ? members.map(m => `<option value="${m.slackId}" data-name="${m.name}">${m.name}</option>`).join('')
      : '<option value="">팀을 먼저 선택하세요</option>';
  });

  document.getElementById('dna-cancel').addEventListener('click', closeNotifyModal);
  document.getElementById('dna-close-x').addEventListener('click', closeNotifyModal);
  document.getElementById('dna-submit').addEventListener('click', submitSchedule);
}

function closeNotifyModal() {
  document.getElementById('dna-overlay')?.remove();
}

async function submitSchedule() {
  const teamVal    = document.getElementById('dna-team').value;
  const memberSel  = document.getElementById('dna-member');
  const slackId    = memberSel.value;
  const memberName = memberSel.options[memberSel.selectedIndex]?.dataset?.name || '';
  const deployDate = document.getElementById('dna-deploy-date').value;
  const deployTime = document.getElementById('dna-deploy-time').value;
  const deployAt   = deployDate && deployTime ? `${deployDate}T${deployTime}` : '';
  const hubName    = document.getElementById('dna-hub-name').value.trim();
  const ticketNo   = document.getElementById('dna-ticket-no').value.trim();
  const title      = document.getElementById('dna-title').value.trim();
  const msgEl      = document.getElementById('dna-msg');
  const submitBtn  = document.getElementById('dna-submit');

  if (!teamVal || !slackId || !deployAt || !title) {
    msgEl.className = 'error';
    msgEl.textContent = '팀, 담당자, 반영일시, 제목은 필수입니다.';
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '등록 중...';
  msgEl.style.display = 'none';
  msgEl.className = '';

  try {
    const res = await relayFetch(`${API_BASE}/api/deploy-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deploy_at: deployAt + ':00+09:00',
        ticket_no: ticketNo || null,
        hub_name:  hubName  || null,
        title,
        registrant_name:     memberName,
        registrant_slack_id: slackId,
        create_name: document.querySelector('.userNm')?.title?.trim() || '',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || '등록 실패');

    msgEl.className = 'success';
    msgEl.textContent = '등록 완료. 15분/5분 전 Slack DM으로 알림이 발송됩니다.';
    setTimeout(closeNotifyModal, 2000);
  } catch (e) {
    msgEl.className = 'error';
    msgEl.textContent = `오류: ${e.message}`;
    submitBtn.disabled = false;
    submitBtn.textContent = '등록';
  }
}

// ─── 반영일정 조회 ────────────────────────────────────────
function formatDeployTime(iso) {
  const d = new Date(iso);
  return `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function getTimeRemaining(iso) {
  const diff = new Date(iso) - new Date();
  if (diff <= 0) return '<span class="dnq-done">완료</span>';
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  if (days > 0)  return `<span class="dnq-soon">${days}일 ${hours}시간</span>`;
  if (hours > 0) return `<span class="dnq-warn">${hours}시간 ${mins}분</span>`;
  return `<span class="dnq-urgent">${mins}분</span>`;
}

async function openQueryModal() {
  if (document.getElementById('dnq-overlay')) return;

  const currentUser = document.querySelector('.userNm')?.title?.trim() || '';
  const defaultName = currentUser;

  const overlay = document.createElement('div');
  overlay.id = 'dnq-overlay';
  overlay.innerHTML = `
    <div id="dnq-modal">
      <h2>반영일정 조회</h2>
      <div class="dnq-search-row">
        <div class="dnq-autocomplete-wrap">
          <input type="text" id="dnq-name" value="${defaultName}" placeholder="담당자 이름" autocomplete="off" />
          <div class="dnq-sug-box" id="dnq-name-sug"></div>
        </div>
        <div class="dnq-autocomplete-wrap">
          <input type="text" id="dnq-hub" value="" placeholder="고객사" autocomplete="off" />
          <div class="dnq-sug-box" id="dnq-hub-sug"></div>
        </div>
        <button id="dnq-search-btn">조회</button>
      </div>
      <div id="dnq-grid-wrap">
        <div class="dnq-grid-header">
          <span>접수번호</span><span>고객사명</span><span>내용</span><span>반영일시</span><span>남은시간</span><span></span>
        </div>
        <div id="dnq-grid-body"><div class="dnq-empty">조회 버튼을 눌러주세요</div></div>
      </div>
      <div id="dnq-actions"><button id="dnq-close">닫기</button></div>
    </div>
  `;

  document.body.appendChild(overlay);

  let allSchedules = [];

  // 오토컴플리트 공통 헬퍼
  function bindAutocomplete(inputId, sugId, getItems, onSelect) {
    const input = document.getElementById(inputId);
    const sug   = document.getElementById(sugId);
    input.addEventListener('input', () => {
      const q = input.value.trim();
      sug.innerHTML = '';
      sug.style.display = 'none';
      if (!q) return;
      const matches = getItems().filter(v => v.includes(q)).slice(0, 8);
      if (!matches.length) return;
      sug.innerHTML = matches.map(v => `<div class="dnq-sug-item">${v}</div>`).join('');
      sug.style.display = 'block';
      sug.querySelectorAll('.dnq-sug-item').forEach(item => {
        item.addEventListener('click', () => {
          input.value = item.textContent;
          sug.innerHTML = '';
          sug.style.display = 'none';
          onSelect();
        });
      });
    });
  }

  async function fetchSchedules() {
    const name = document.getElementById('dnq-name').value.trim();
    const hub  = document.getElementById('dnq-hub').value.trim();
    const body = document.getElementById('dnq-grid-body');
    body.innerHTML = `<div class="dnq-empty">불러오는 중...</div>`;

    try {
      const res  = await relayFetch(`${API_BASE}/api/deploy-schedules`);
      allSchedules = await res.json();
      const now  = new Date();

      let filtered = allSchedules;
      if (name) filtered = filtered.filter(r => r.registrant_name?.includes(name));
      if (hub)  filtered = filtered.filter(r => r.hub_name?.includes(hub));

      if (!filtered.length) {
        body.innerHTML = `<div class="dnq-empty">조회 결과 없음</div>`;
        return;
      }

      const upcoming = filtered
        .filter(r => new Date(r.deploy_at) > now)
        .sort((a, b) => new Date(a.deploy_at) - new Date(b.deploy_at));
      const past = filtered
        .filter(r => new Date(r.deploy_at) <= now)
        .sort((a, b) => new Date(b.deploy_at) - new Date(a.deploy_at));

      body.innerHTML = [...upcoming, ...past].map(r => {
        const isPast   = new Date(r.deploy_at) <= now;
        const canEdit  = r.registrant_name === currentUser || r.create_name === currentUser;
        const actionBtns = canEdit
          ? `<button class="dnq-edit-btn" data-id="${r.id}" data-deploy="${r.deploy_at}"
               data-ticket="${r.ticket_no||''}" data-hub="${r.hub_name||''}" data-title="${r.title}">수정</button>
             <button class="dnq-del-btn" data-id="${r.id}">삭제</button>`
          : '';
        return `
          <div class="dnq-grid-row${isPast ? ' dnq-row-past' : ''}">
            <span class="dnq-cell">${r.ticket_no ? `<span class="dnq-ticket-link" data-ticket="${r.ticket_no}">${r.ticket_no}</span>` : '-'}</span>
            <span class="dnq-cell dnq-cell-title" title="${r.hub_name || ''}">${r.hub_name || '-'}</span>
            <span class="dnq-cell dnq-cell-title" title="${r.title}">${r.title}</span>
            <span class="dnq-cell">${formatDeployTime(r.deploy_at)}</span>
            <span class="dnq-cell">${getTimeRemaining(r.deploy_at)}</span>
            <span class="dnq-cell dnq-action-cell">${actionBtns}</span>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.dnq-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset, fetchSchedules));
      });

      document.querySelectorAll('.dnq-ticket-link').forEach(el => {
        el.addEventListener('click', () => {
          top.pageRedirectByProgramId('upOperWork01011', { SR_IDX: el.dataset.ticket });
          overlay.remove();
        });
      });

      document.querySelectorAll('.dnq-del-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('삭제하시겠습니까?')) return;
          await relayFetch(`${API_BASE}/api/deploy-schedules/${btn.dataset.id}`, { method: 'DELETE' });
          fetchSchedules();
        });
      });
    } catch (e) {
      body.innerHTML = `<div class="dnq-empty">오류: ${e.message}</div>`;
    }
  }

  const allNames = [...new Set(membersData.map(m => m.name))].filter(Boolean).sort();
  const getHubNames = () => [...new Set(allSchedules.map(r => r.hub_name).filter(Boolean))].sort();

  bindAutocomplete('dnq-name', 'dnq-name-sug', () => allNames, fetchSchedules);
  bindAutocomplete('dnq-hub',  'dnq-hub-sug',  getHubNames,    fetchSchedules);

  // 바깥 클릭 시 드롭다운 닫기
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dnq-autocomplete-wrap')) {
      document.querySelectorAll('.dnq-sug-box').forEach(b => { b.innerHTML = ''; b.style.display = 'none'; });
    }
  });

  document.getElementById('dnq-search-btn').addEventListener('click', fetchSchedules);
  document.getElementById('dnq-close').addEventListener('click', () => overlay.remove());

  fetchSchedules();
}

// ─── 반영일정 수정 모달 ──────────────────────────────────
function openEditModal(data, onSaved) {
  if (document.getElementById('dne-overlay')) return;

  const d = new Date(data.deploy);
  const dateVal = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const timeVal = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

  const overlay = document.createElement('div');
  overlay.id = 'dne-overlay';
  overlay.innerHTML = `
    <div id="dne-modal">
      <div class="dna-modal-header">
        <h2>반영일정 수정</h2>
        <button class="dna-close-x" id="dne-close-x">✕</button>
      </div>
      <div class="dna-field">
        <label>반영일시</label>
        <div class="dna-datetime-row">
          <input type="date" id="dne-date" value="${dateVal}" />
          <input type="time" id="dne-time" value="${timeVal}" />
        </div>
      </div>
      <div class="dna-row2">
        <div class="dna-field">
          <label>고객사</label>
          <input type="text" id="dne-hub" value="${data.hub}" />
        </div>
        <div class="dna-field">
          <label>접수번호</label>
          <input type="text" id="dne-ticket" value="${data.ticket}" />
        </div>
      </div>
      <div class="dna-field">
        <label>제목</label>
        <input type="text" id="dne-title" value="${data.title}" />
      </div>
      <div id="dne-actions">
        <button id="dne-cancel">취소</button>
        <button id="dne-save">저장</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('dne-close-x').addEventListener('click', () => overlay.remove());
  document.getElementById('dne-cancel').addEventListener('click', () => overlay.remove());

  document.getElementById('dne-save').addEventListener('click', async () => {
    const deployDate = document.getElementById('dne-date').value;
    const deployTime = document.getElementById('dne-time').value;
    const hub        = document.getElementById('dne-hub').value.trim();
    const ticket     = document.getElementById('dne-ticket').value.trim();
    const title      = document.getElementById('dne-title').value.trim();
    if (!deployDate || !deployTime || !title) return;

    await relayFetch(`${API_BASE}/api/deploy-schedules/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deploy_at: `${deployDate}T${deployTime}:00+09:00`,
        ticket_no: ticket || null,
        hub_name:  hub    || null,
        title,
      }),
    });
    overlay.remove();
    onSaved();
  });
}

