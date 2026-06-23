// relay.js — ISOLATED world
// MAIN world(content-notify.js, fab.js)에서 postMessage로 요청을 받아
// chrome.runtime.sendMessage로 background service worker에 전달 후 결과를 반환

window.addEventListener('message', (e) => {
  if (e.source !== window || !e.data?.__us_fetch) return;

  const { id, url, method, headers, body } = e.data;

  function postError(msg) {
    window.postMessage({ __us_fetch_resp: true, id, ok: false, status: 0, error: msg }, '*');
  }

  try {
    chrome.runtime.sendMessage(
      { type: 'US_FETCH', url, method, headers, body },
      (resp) => {
        if (chrome.runtime.lastError) {
          postError('익스텐션이 재로드됐습니다. 페이지를 새로고침해주세요.');
          return;
        }
        window.postMessage({ __us_fetch_resp: true, id, ...resp }, '*');
      }
    );
  } catch (_) {
    // Extension context invalidated — 익스텐션 리로드 후 탭 새로고침 필요
    postError('익스텐션이 재로드됐습니다. 페이지를 새로고침해주세요.');
  }
});
