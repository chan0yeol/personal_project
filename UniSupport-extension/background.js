// background.js — service worker
// HTTPS 페이지에서 HTTP API를 직접 호출하면 Mixed Content로 차단되므로
// MAIN world content script → relay.js(ISOLATED) → 여기서 실제 fetch 실행

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'US_FETCH') return false;

  const opts = { method: msg.method || 'GET' };
  if (msg.headers) opts.headers = msg.headers;
  if (msg.body)    opts.body    = msg.body;

  fetch(msg.url, opts)
    .then(async r => {
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); }
      catch (_) { data = { error: `서버 응답 오류 (${r.status}): ${text.slice(0, 120)}` }; }
      sendResponse({ ok: r.ok, status: r.status, data });
    })
    .catch(e => sendResponse({ ok: false, status: 0, error: e.message }));

  return true; // 비동기 응답을 위해 채널 유지
});
