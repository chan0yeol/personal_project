chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existing.map(r => r.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingIds,
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'X-Frame-Options', operation: 'remove' },
            { header: 'x-frame-options', operation: 'remove' },
            { header: 'Content-Security-Policy', operation: 'remove' },
            { header: 'content-security-policy', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: '|http',
          resourceTypes: ['sub_frame']
        }
      }
    ]
  });
});

// F2 단축키 리스너
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-overlay') {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { type: 'TOGGLE_OVERLAY' }).catch(() => {
        // content script 미로드 상태 무시
      });
    }
  }
});
