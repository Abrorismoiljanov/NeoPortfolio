<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';

  let t = $derived(themes[$currentTheme]);

  let tabs = $state([
    { id: 1, title: 'New Tab', url: 'https://lite.duckduckgo.com/lite/', loading: false, error: false }
  ]);
  let activeTabId = $state(1);
  let urlInput = $state('https://lite.duckduckgo.com/lite/');
  let nextTabId = $state(2);

  let activeTab = $derived(tabs.find(t => t.id === activeTabId));

  function switchTab(id) {
    activeTabId = id;
    urlInput = tabs.find(t => t.id === id)?.url || '';
  }

  function addTab() {
    const id = nextTabId++;
    tabs = [...tabs, { id, title: 'New Tab', url: 'https://lite.duckduckgo.com/lite/', loading: false, error: false }];
    activeTabId = id;
    urlInput = 'https://lite.duckduckgo.com/lite/';
  }

  function closeTab(id, e) {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const idx = tabs.findIndex(t => t.id === id);
    tabs = tabs.filter(t => t.id !== id);
    if (activeTabId === id) {
      activeTabId = tabs[Math.min(idx, tabs.length - 1)].id;
      urlInput = tabs.find(t => t.id === activeTabId)?.url || '';
    }
  }

  function navigate(url) {
    if (!url) return;
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.includes('.') && !url.includes(' ')) {
        finalUrl = 'https://' + url;
      } else {
        finalUrl = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(url)}`;
      }
    }
    tabs = tabs.map(tab => tab.id === activeTabId ? { ...tab, url: finalUrl, loading: true, error: false } : tab);
    urlInput = finalUrl;
  }

  function onUrlKeydown(e) {
    if (e.key === 'Enter') {
      navigate(urlInput);
    }
  }

  function goBack() {
    const iframe = document.querySelector(`iframe[data-tab-id="${activeTabId}"]`);
    if (iframe) try { iframe.contentWindow.history.back(); } catch {}
  }

  function goForward() {
    const iframe = document.querySelector(`iframe[data-tab-id="${activeTabId}"]`);
    if (iframe) try { iframe.contentWindow.history.forward(); } catch {}
  }

  function refresh() {
    tabs = tabs.map(tab => tab.id === activeTabId ? { ...tab, loading: true, error: false, url: tab.url + ' ' } : tab);
    setTimeout(() => {
      tabs = tabs.map(tab => tab.id === activeTabId ? { ...tab, url: tab.url.trim() } : tab);
    }, 50);
  }

  function onFrameLoad(e, tabId) {
    const iframe = e.target;
    let title = 'Untitled';
    try { title = iframe.contentDocument?.title || 'Untitled'; } catch { title = 'Cross-origin'; }
    tabs = tabs.map(tab => tab.id === tabId ? { ...tab, title, loading: false } : tab);
    if (tabId === activeTabId) {
      try { urlInput = iframe.contentWindow?.location?.href || tab.url; } catch {}
    }
  }

  function onFrameError(tabId) {
    tabs = tabs.map(tab => tab.id === tabId ? { ...tab, loading: false, error: true } : tab);
  }

  function onHome() {
    navigate('https://lite.duckduckgo.com/lite/');
  }
</script>

<div class="browser" style="--bg: {t.bgDark}; --fg: {t.fg}; --accent: {t.blue}; --dim: {t.fgDim}; --border: {t.border}; --surface: {t.bgLight};">
  <div class="tab-bar">
    <div class="tabs">
      {#each tabs as tab (tab.id)}
        <button
          class="tab"
          class:active={tab.id === activeTabId}
          style={tab.id === activeTabId ? `--tab-accent: ${t.blue}; --tab-bg: rgba(255,255,255,0.06);` : `--tab-bg: transparent;`}
          onclick={() => switchTab(tab.id)}
        >
          {#if tab.loading}
            <span class="tab-spinner" style="border-top-color: {t.blue};"></span>
          {:else}
            <svg class="tab-icon" viewBox="0 0 16 16" width="12" height="12" fill="{t.fgDim}">
              <circle cx="8" cy="8" r="6" fill="none" stroke="{t.fgDim}" stroke-width="1.5"/>
              <line x1="8" y1="2" x2="8" y2="14" stroke="{t.fgDim}" stroke-width="1"/>
              <ellipse cx="8" cy="8" rx="3" ry="6" fill="none" stroke="{t.fgDim}" stroke-width="1"/>
            </svg>
          {/if}
          <span class="tab-title">{tab.title}</span>
          {#if tabs.length > 1}
            <span class="tab-close" onclick={(e) => closeTab(tab.id, e)} role="button" tabindex="-1">&times;</span>
          {/if}
        </button>
      {/each}
    </div>
    <button class="tab-add" onclick={addTab} style="color: {t.fgDim};">+</button>
  </div>

  <div class="nav-bar">
    <div class="nav-buttons">
      <button class="nav-btn" onclick={goBack} title="Back" style="color: {t.fgDim};">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="10,3 5,8 10,13"/></svg>
      </button>
      <button class="nav-btn" onclick={goForward} title="Forward" style="color: {t.fgDim};">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6,3 11,8 6,13"/></svg>
      </button>
      <button class="nav-btn" onclick={refresh} title="Refresh" style="color: {t.fgDim};">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 8a5 5 0 1 1-1.5-3.5"/><polyline points="13,1 13,4.5 9.5,4.5"/></svg>
      </button>
      <button class="nav-btn" onclick={onHome} title="Home" style="color: {t.fgDim};">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8l6-5.5L14 8"/><path d="M4 7v6h3v-4h2v4h3V7"/></svg>
      </button>
    </div>
    <div class="url-bar-wrapper">
      <div class="url-bar" style="background: rgba(0,0,0,0.3); border-color: {t.border};">
        <svg class="url-icon" viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="{t.fgDim}" stroke-width="1.5">
          <circle cx="6.5" cy="6.5" r="4.5"/>
          <line x1="10" y1="10" x2="14" y2="14" stroke-linecap="round"/>
        </svg>
        <input
          class="url-input"
          bind:value={urlInput}
          onkeydown={onUrlKeydown}
          placeholder="Search DuckDuckGo or enter URL..."
          style="color: {t.fg};"
          spellcheck="false"
        />
        {#if activeTab?.loading}
          <span class="url-spinner" style="border-top-color: {t.blue};"></span>
        {/if}
      </div>
    </div>
  </div>

  <div class="content">
    {#each tabs as tab (tab.id)}
      {#if tab.id === activeTabId}
        {#if tab.error}
          <div class="error-page" style="color: {t.fg};">
            <svg viewBox="0 0 16 16" width="48" height="48" fill="none" stroke="{t.fgDim}" stroke-width="1.5">
              <circle cx="8" cy="8" r="7"/>
              <line x1="8" y1="5" x2="8" y2="9"/>
              <circle cx="8" cy="11.5" r="0.5" fill="{t.fgDim}"/>
            </svg>
            <h2 style="color: {t.fg};">Page couldn't load</h2>
            <p style="color: {t.fgDim};">{tab.url}</p>
            <p style="color: {t.fgDim};">This page may not allow being loaded in an embedded browser.</p>
            <button class="retry-btn" style="background: {t.blue}; color: {t.bgDark};" onclick={refresh}>Try again</button>
          </div>
        {:else}
          <iframe
            data-tab-id={tab.id}
            src={tab.url}
            title={tab.title}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope"
            onload={(e) => onFrameLoad(e, tab.id)}
            onerror={() => onFrameError(tab.id)}
          ></iframe>
        {/if}
      {/if}
    {/each}
  </div>
</div>

<style>
  .browser {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: transparent;
    color: var(--fg);
    font-family: 'Inter', system-ui, sans-serif;
    overflow: hidden;
  }

  .tab-bar {
    display: flex;
    align-items: center;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid var(--border);
    padding: 0 4px;
    height: 36px;
    gap: 2px;
    min-height: 36px;
  }

  .tabs {
    display: flex;
    flex: 1;
    overflow-x: auto;
    gap: 2px;
    scrollbar-width: none;
  }
  .tabs::-webkit-scrollbar { display: none; }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: none;
    background: var(--tab-bg);
    color: var(--fg);
    border-radius: 6px;
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    white-space: nowrap;
    max-width: 200px;
    min-width: 0;
    transition: background 0.15s;
  }
  .tab:hover { background: rgba(255,255,255,0.08); }
  .tab.active {
    background: var(--tab-bg);
    box-shadow: inset 0 -2px 0 var(--tab-accent);
  }

  .tab-icon { flex-shrink: 0; }
  .tab-spinner {
    width: 12px;
    height: 12px;
    border: 2px solid transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  .tab-title {
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
  }

  .tab-close {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-size: 14px;
    opacity: 0.5;
    cursor: pointer;
    transition: opacity 0.1s, background 0.1s;
  }
  .tab-close:hover { opacity: 1; background: rgba(255,255,255,0.15); }

  .tab-add {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-size: 18px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .tab-add:hover { background: rgba(255,255,255,0.1); }

  .nav-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    background: rgba(255,255,255,0.03);
    border-bottom: 1px solid var(--border);
  }

  .nav-buttons {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  .nav-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .nav-btn:hover { background: rgba(255,255,255,0.1); }

  .url-bar-wrapper { flex: 1; }

  .url-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    border: 1px solid;
    border-radius: 20px;
    height: 30px;
  }

  .url-icon { flex-shrink: 0; }

  .url-input {
    flex: 1;
    background: transparent;
    border: none;
    font-family: inherit;
    font-size: 13px;
    outline: none;
    min-width: 0;
  }

  .url-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    flex-shrink: 0;
  }

  .content {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .content iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: white;
  }

  .error-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    gap: 12px;
    text-align: center;
    padding: 24px;
  }
  .error-page h2 { margin: 0; font-size: 18px; }
  .error-page p { margin: 0; font-size: 13px; }

  .retry-btn {
    margin-top: 8px;
    padding: 8px 20px;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    font-weight: 500;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
</style>
