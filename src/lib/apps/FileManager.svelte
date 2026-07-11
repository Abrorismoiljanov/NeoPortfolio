<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';

  let t = $derived(themes[$currentTheme]);

  const fileSystem = {
    '/': [
      { name: 'Desktop', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'Documents', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'Projects', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'RustProj', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'Builds', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: '.config', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: '.ssh', type: 'folder', icon: '\uD83D\uDD11' },
    ],
    '/Projects': [
      { name: 'Genesis-Game-Engine', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'engine', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'cart', type: 'folder', icon: '\uD83D\uDCC2' },
    ],
    '/Projects/Genesis-Game-Engine': [
      { name: 'Editor', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'Runtime', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'DataTypes', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'Shader', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'CMakeLists.txt', type: 'file', icon: '\uD83D\uDCC4' },
      { name: 'README.md', type: 'file', icon: '\uD83D\uDCDD' },
      { name: 'imgui.ini', type: 'file', icon: '\uD83D\uDCC4' },
    ],
    '/Projects/Genesis-Game-Engine/Editor': [
      { name: 'src', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'include', type: 'folder', icon: '\uD83D\uDCC2' },
    ],
    '/Projects/Genesis-Game-Engine/Editor/src': [
      { name: 'app.cpp', type: 'file', icon: '\uD83D\uDCC4' },
      { name: 'CommandSystem.cpp', type: 'file', icon: '\uD83D\uDCC4' },
      { name: 'EditorUI.cpp', type: 'file', icon: '\uD83D\uDCC4' },
      { name: 'Panels.cpp', type: 'file', icon: '\uD83D\uDCC4' },
      { name: 'Renderer.cpp', type: 'file', icon: '\uD83D\uDCC4' },
      { name: 'ViewportPanel.cpp', type: 'file', icon: '\uD83D\uDCC4' },
      { name: 'TerminalPanel.cpp', type: 'file', icon: '\uD83D\uDCC4' },
      { name: 'SceneManager.cpp', type: 'file', icon: '\uD83D\uDCC4' },
    ],
    '/RustProj': [
      { name: 'rune', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'hlidk', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'game', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'wgpu_test', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'mp', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'Sandbox', type: 'folder', icon: '\uD83D\uDCC2' },
    ],
    '/Desktop': [
      { name: 'notes.txt', type: 'file', icon: '\uD83D\uDCDD' },
    ],
    '/Documents': [
      { name: 'Linuks-Kitob', type: 'folder', icon: '\uD83D\uDCC2' },
    ],
    '/Builds': [
      { name: 'amp', type: 'folder', icon: '\uD83D\uDCC2' },
      { name: 'cmatrix', type: 'folder', icon: '\uD83D\uDCC2' },
    ],
  };

  let currentPath = $state('/');
  let selected = $state(null);

  const pathParts = $derived(currentPath.split('/').filter(Boolean));

  function navigate(name) {
    const item = fileSystem[currentPath]?.find(f => f.name === name);
    if (item?.type === 'folder') {
      currentPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
      selected = null;
    }
  }

  function goUp() {
    if (pathParts.length > 0) {
      pathParts.pop();
      currentPath = '/' + pathParts.join('/');
      selected = null;
    }
  }

  function goTo(path) {
    currentPath = path;
    selected = null;
  }

  const items = $derived(fileSystem[currentPath] || []);
</script>

<div class="file-manager" style="--bg: {t.bg}; --bg-dark: {t.bgDark}; --bg-light: {t.bgLight}; --fg: {t.fg}; --fg-dim: {t.fgDim}; --border: {t.border}; --accent: {t.blue}; --hover: {t.hoverBg};">
  <div class="toolbar">
    <button class="nav-btn" onmousedown={goUp} disabled={pathParts.length === 0} aria-label="Go back">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <div class="breadcrumb">
      <button class="crumb" onmousedown={() => goTo('/')}>~</button>
      {#each pathParts as part, i}
        <span class="crumb-sep">/</span>
        <button class="crumb" onmousedown={() => goTo('/' + pathParts.slice(0, i + 1).join('/'))}>{part}</button>
      {/each}
    </div>
  </div>

  <div class="file-list">
    {#each items as item}
      <button
        class="file-item"
        class:selected={selected === item.name}
        class:folder={item.type === 'folder'}
        onmousedown={() => selected = item.name}
        ondblclick={() => navigate(item.name)}
      >
        <span class="file-icon">{item.icon}</span>
        <span class="file-name">{item.name}</span>
        {#if item.type === 'folder'}
          <span class="file-meta" style="color: {t.fgDim};">folder</span>
        {:else}
          <span class="file-meta" style="color: {t.fgDim};">file</span>
        {/if}
      </button>
    {/each}
    {#if items.length === 0}
      <div class="empty" style="color: {t.fgDim};">Empty folder</div>
    {/if}
  </div>

  <div class="statusbar">
    <span style="color: {t.fgDim};">{items.length} items</span>
    <span style="color: {t.fgDim};">{currentPath}</span>
  </div>
</div>

<style>
  .file-manager {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-light);
  }

  .nav-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--fg);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-btn:hover:not(:disabled) { background: var(--hover); }
  .nav-btn:disabled { opacity: 0.3; }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .crumb {
    border: none;
    background: transparent;
    color: var(--accent);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 3px;
  }
  .crumb:hover { background: var(--hover); }
  .crumb-sep { color: var(--fg-dim); }

  .file-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }

  .file-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--fg);
    font-family: inherit;
    font-size: 13px;
    cursor: pointer;
    text-align: left;
    gap: 8px;
  }
  .file-item:hover { background: var(--hover); }
  .file-item.selected { background: var(--accent); color: white; }

  .file-icon { font-size: 16px; width: 24px; text-align: center; }
  .file-name { flex: 1; }
  .file-meta { font-size: 11px; }

  .empty {
    padding: 32px;
    text-align: center;
    font-style: italic;
  }

  .statusbar {
    display: flex;
    justify-content: space-between;
    padding: 6px 12px;
    border-top: 1px solid var(--border);
    background: var(--bg-light);
    font-size: 11px;
  }
</style>
