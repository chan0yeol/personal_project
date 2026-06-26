// API_BASE는 config.js에서 전역으로 정의됩니다.

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
