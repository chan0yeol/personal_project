// 페이지에서 오는 이벤트 수신 → background로 중계
window.addEventListener('message', (e) => {
  if (e.source !== window || !e.data?.__UNI_EV__) return
  try {
    chrome.runtime.sendMessage({ type: 'UNI_EVENT', event: e.data.event })
  } catch (_) {}
})

// 엘리먼트 피커 결과 → background로 중계
window.addEventListener('message', (e) => {
  if (e.source !== window || !e.data?.__UNI_PICK__) return
  try {
    chrome.runtime.sendMessage({ type: 'PICK_RESULT', info: e.data })
  } catch (_) {}
})

// $nst 호출 → background로 중계
window.addEventListener('message', (e) => {
  if (e.source !== window || !e.data?.__UNI_NST__) return
  try {
    chrome.runtime.sendMessage({ type: 'NST_CALL', data: e.data.data })
  } catch (_) {}
})

// 화면 컨텍스트 수집 요청 수신 → injected에 전달 후 응답 반환
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== 'COLLECT_PAGE_CONTEXT') return
  const handler = (e) => {
    if (e.source !== window || !e.data?.__UNI_CTX__) return
    window.removeEventListener('message', handler)
    sendResponse(e.data.context)
  }
  window.addEventListener('message', handler)
  window.postMessage({ __UNI_CTX_REQ__: true }, '*')
  return true
})
