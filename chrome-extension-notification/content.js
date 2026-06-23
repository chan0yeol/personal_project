const API_BASE = 'http://localhost:3001';

let membersData = [];

// members.json 기반 팀별 멤버 데이터 로드
async function loadMembers() {
  try {
    const res = await fetch(`${API_BASE}/api/members`);
    membersData = await res.json();
  } catch (e) {
    console.error('[반영일정] 멤버 로드 실패:', e);
  }
}

// #TITLE_BAR에 버튼 주입
function injectButton() {
  const titleBar = document.getElementById('TITLE_BAR');
  if (!titleBar || document.getElementById('dna-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'dna-btn';
  btn.textContent = '반영일정 등록';
  btn.addEventListener('click', openModal);
  titleBar.appendChild(btn);
}

// SPA 대응: #TITLE_BAR가 늦게 생성될 경우 MutationObserver로 감지
function waitForTitleBar() {
  injectButton();
  if (document.getElementById('dna-btn')) return;

  const observer = new MutationObserver(() => {
    if (document.getElementById('TITLE_BAR')) {
      injectButton();
      if (document.getElementById('dna-btn')) observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// 팀 목록 추출 (중복 제거)
function getTeams() {
  return [...new Set(membersData.map(m => m.teamName))].filter(Boolean);
}

// 특정 팀의 멤버 목록
function getMembersByTeam(teamName) {
  return membersData.filter(m => m.teamName === teamName);
}

// 모달 열기
async function openModal() {
  if (document.getElementById('dna-overlay')) return;
  await loadMembers();

  const overlay = document.createElement('div');
  overlay.id = 'dna-overlay';
  overlay.innerHTML = `
    <div id="dna-modal">
      <h2>반영일정 등록</h2>

      <div class="dna-field">
        <label>팀 선택</label>
        <select id="dna-team">
          <option value="">-- 팀 선택 --</option>
          ${getTeams().map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
      </div>

      <div class="dna-field">
        <label>담당자</label>
        <select id="dna-member" disabled>
          <option value="">팀을 먼저 선택하세요</option>
        </select>
      </div>

      <div class="dna-field">
        <label>반영일시</label>
        <input type="datetime-local" id="dna-deploy-at" />
      </div>

      <div class="dna-field">
        <label>접수번호</label>
        <input type="text" id="dna-ticket-no" placeholder="예: REQ-2024-001" />
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

  // 팀 선택 시 담당자 목록 갱신
  document.getElementById('dna-team').addEventListener('change', (e) => {
    const memberSelect = document.getElementById('dna-member');
    const members = getMembersByTeam(e.target.value);
    memberSelect.disabled = members.length === 0;
    memberSelect.innerHTML = members.length
      ? members.map(m => `<option value="${m.slackId}" data-name="${m.name}">${m.name}</option>`).join('')
      : '<option value="">팀을 먼저 선택하세요</option>';
  });

  // 취소
  document.getElementById('dna-cancel').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  // 등록
  document.getElementById('dna-submit').addEventListener('click', submitSchedule);
}

function closeModal() {
  const overlay = document.getElementById('dna-overlay');
  if (overlay) overlay.remove();
}

async function submitSchedule() {
  const teamVal    = document.getElementById('dna-team').value;
  const memberSel  = document.getElementById('dna-member');
  const slackId    = memberSel.value;
  const memberName = memberSel.options[memberSel.selectedIndex]?.dataset?.name || '';
  const deployAt   = document.getElementById('dna-deploy-at').value;
  const ticketNo   = document.getElementById('dna-ticket-no').value.trim();
  const title      = document.getElementById('dna-title').value.trim();
  const msgEl      = document.getElementById('dna-msg');
  const submitBtn  = document.getElementById('dna-submit');

  // 유효성 검사
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
    // datetime-local 값에 서울 시간대 명시
    const deployAtISO = deployAt + ':00+09:00';

    const res = await fetch(`${API_BASE}/api/deploy-schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deploy_at: deployAtISO,
        ticket_no: ticketNo || null,
        title,
        registrant_name: memberName,
        registrant_slack_id: slackId,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || '등록 실패');

    msgEl.className = 'success';
    msgEl.textContent = '반영일정이 등록되었습니다. 30분/15분 전에 Slack DM으로 알림이 발송됩니다.';
    setTimeout(closeModal, 2000);
  } catch (e) {
    msgEl.className = 'error';
    msgEl.textContent = `오류: ${e.message}`;
    submitBtn.disabled = false;
    submitBtn.textContent = '등록';
  }
}

// 초기화
waitForTitleBar();
