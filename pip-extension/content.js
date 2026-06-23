(function () {
  if (document.getElementById('pip-overlay-root')) return;

  /* ── 스타일 ── */
  const style = document.createElement('style');
  style.id = 'pip-overlay-style';
  style.textContent = `
    #pip-overlay-root {
      position: fixed;
      top: 60px;
      left: 60px;
      width: 640px;
      height: 420px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      opacity: 0.92;
      min-width: 280px;
      min-height: 180px;
    }

    #pip-toolbar {
      background: #1a1a2e;
      padding: 6px 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: move;
      user-select: none;
      flex-shrink: 0;
      height: 36px;
      box-sizing: border-box;
    }

    #pip-url-input {
      flex: 1;
      padding: 3px 8px;
      border-radius: 4px;
      border: 1px solid #0f3460;
      background: #16213e;
      color: #e0e0e0;
      font-size: 12px;
      outline: none;
      cursor: text;
    }
    #pip-url-input:focus { border-color: #4a9eff; }

    .pip-btn {
      background: none;
      border: none;
      color: #ccc;
      cursor: pointer;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 15px;
      line-height: 1;
      flex-shrink: 0;
    }
    .pip-btn:hover { background: rgba(255,255,255,0.15); color: white; }
    #pip-close-btn:hover { background: #c0392b; color: white; }

    #pip-iframe-wrap {
      flex: 1;
      position: relative;
      overflow: hidden;
    }

    #pip-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      background: white;
    }

    #pip-mouse-blocker {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: none;
    }

    #pip-bottom-bar {
      background: #1a1a2e;
      padding: 4px 10px;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      height: 30px;
      box-sizing: border-box;
    }

    #pip-opacity-label {
      color: #aaa;
      font-size: 11px;
      white-space: nowrap;
    }

    #pip-opacity-slider {
      flex: 1;
      cursor: pointer;
      accent-color: #4a9eff;
    }

    #pip-opacity-value {
      color: #ccc;
      font-size: 11px;
      width: 32px;
      text-align: right;
    }

    #pip-resize-handle {
      width: 16px;
      height: 16px;
      cursor: se-resize;
      color: #555;
      font-size: 13px;
      line-height: 1;
      text-align: center;
      flex-shrink: 0;
    }
    #pip-resize-handle:hover { color: #aaa; }
  `;
  document.head.appendChild(style);

  /* ── DOM ── */
  const root = document.createElement('div');
  root.id = 'pip-overlay-root';
  root.innerHTML = `
    <div id="pip-toolbar">
      <span style="font-size:15px;flex-shrink:0;">🪟</span>
      <input id="pip-url-input" type="text" placeholder="URL 입력 후 Enter…" spellcheck="false" />
      <button class="pip-btn" id="pip-back-btn" title="뒤로">‹</button>
      <button class="pip-btn" id="pip-reload-btn" title="새로고침">↺</button>
      <button class="pip-btn" id="pip-close-btn" title="닫기">✕</button>
    </div>
    <div id="pip-iframe-wrap">
      <iframe id="pip-iframe" src="about:blank"
        allow="autoplay; fullscreen; encrypted-media"
        allowfullscreen></iframe>
      <div id="pip-mouse-blocker"></div>
    </div>
    <div id="pip-bottom-bar">
      <span id="pip-opacity-label">투명도</span>
      <input id="pip-opacity-slider" type="range" min="10" max="100" value="92" />
      <span id="pip-opacity-value">92%</span>
      <div id="pip-resize-handle" title="리사이즈">⊿</div>
    </div>
  `;
  document.body.appendChild(root);

  /* ── 참조 ── */
  const iframe       = document.getElementById('pip-iframe');
  const urlInput     = document.getElementById('pip-url-input');
  const toolbar      = document.getElementById('pip-toolbar');
  const blocker      = document.getElementById('pip-mouse-blocker');
  const opacitySlider = document.getElementById('pip-opacity-slider');
  const opacityValue = document.getElementById('pip-opacity-value');
  const resizeHandle = document.getElementById('pip-resize-handle');

  /* ── 네비게이션 ── */
  function navigate(url) {
    if (!url.trim()) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url.trim();
    iframe.src = url;
    urlInput.value = url;
  }

  urlInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') navigate(urlInput.value);
    e.stopPropagation();
  });
  urlInput.addEventListener('mousedown', e => e.stopPropagation());

  document.getElementById('pip-reload-btn').addEventListener('click', () => {
    try { iframe.contentWindow.location.reload(); } catch { iframe.src = iframe.src; }
  });
  document.getElementById('pip-back-btn').addEventListener('click', () => {
    try { iframe.contentWindow.history.back(); } catch {}
  });
  document.getElementById('pip-close-btn').addEventListener('click', () => {
    root.style.display = 'none';
  });

  // 토글 함수
  function toggleOverlay() {
    root.style.display = root.style.display === 'none' ? 'flex' : 'none';
  }

  /* ── 투명도 ── */
  opacitySlider.addEventListener('input', () => {
    const val = opacitySlider.value;
    root.style.opacity = val / 100;
    opacityValue.textContent = val + '%';
  });

  /* ── 드래그 ── */
  let isDragging = false;
  let dragStartX, dragStartY, startLeft, startTop;

  toolbar.addEventListener('mousedown', e => {
    if (e.target.closest('.pip-btn') || e.target === urlInput) return;
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    const rect = root.getBoundingClientRect();
    startLeft = rect.left;
    startTop  = rect.top;
    blocker.style.display = 'block';
    e.preventDefault();
  });

  /* ── 리사이즈 ── */
  let isResizing = false;
  let resizeStartX, resizeStartY, resizeStartW, resizeStartH;

  resizeHandle.addEventListener('mousedown', e => {
    isResizing = true;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    const rect = root.getBoundingClientRect();
    resizeStartW = rect.width;
    resizeStartH = rect.height;
    blocker.style.display = 'block';
    e.preventDefault();
    e.stopPropagation();
  });

  /* ── 공통 mousemove / mouseup ── */
  document.addEventListener('mousemove', e => {
    if (isDragging) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      root.style.left = Math.max(0, startLeft + dx) + 'px';
      root.style.top  = Math.max(0, startTop  + dy) + 'px';
    }
    if (isResizing) {
      const dx = e.clientX - resizeStartX;
      const dy = e.clientY - resizeStartY;
      root.style.width  = Math.max(280, resizeStartW + dx) + 'px';
      root.style.height = Math.max(180, resizeStartH + dy) + 'px';
    }
  }, true);

  document.addEventListener('mouseup', () => {
    isDragging = false;
    isResizing = false;
    blocker.style.display = 'none';
  }, true);

  /* ── 외부 메시지 수신 ── */
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'NAVIGATE') navigate(msg.url);
    if (msg.type === 'TOGGLE_OVERLAY') toggleOverlay();
  });

})();
