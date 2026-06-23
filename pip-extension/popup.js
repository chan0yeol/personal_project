async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function injectContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js']
  });
}

document.getElementById('open-btn').addEventListener('click', async () => {
  const url = document.getElementById('url-input').value.trim();
  const tab = await getActiveTab();

  await injectContentScript(tab.id);

  if (url) {
    await chrome.tabs.sendMessage(tab.id, { type: 'NAVIGATE', url });
  }

  window.close();
});

document.getElementById('toggle-btn').addEventListener('click', async () => {
  const tab = await getActiveTab();

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const el = document.getElementById('pip-overlay-root');
      if (!el) return;
      el.style.display = el.style.display === 'none' ? 'flex' : 'none';
    }
  });

  window.close();
});
