<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { viewerFile } from '../stores/viewer.js';

  let { windowId } = $props();
  let t = $derived(themes[$currentTheme]);

  let file = $state(null);
  let zoom = $state(1);
  let rotation = $state(0);

  viewerFile.subscribe(v => { if (v?.type === 'image') file = v; });

  function zoomIn() { zoom = Math.min(zoom + 0.25, 5); }
  function zoomOut() { zoom = Math.max(zoom - 0.25, 0.25); }
  function resetView() { zoom = 1; rotation = 0; }
  function rotateLeft() { rotation -= 90; }
  function rotateRight() { rotation += 90; }
</script>

<div class="viewer" style="--bg: {t.bg}; --bg-dark: {t.bgDark}; --fg: {t.fg}; --fg-dim: {t.fgDim}; --border: {t.border}; --accent: {t.accent};">
  <div class="toolbar">
    <button class="tool-btn" onmousedown={zoomOut} title="Zoom out">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </button>
    <span class="zoom-label">{Math.round(zoom * 100)}%</span>
    <button class="tool-btn" onmousedown={zoomIn} title="Zoom in">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
    </button>
    <div class="toolbar-sep"></div>
    <button class="tool-btn" onmousedown={rotateLeft} title="Rotate left">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
    </button>
    <button class="tool-btn" onmousedown={rotateRight} title="Rotate right">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
    </button>
    <div class="toolbar-sep"></div>
    <button class="tool-btn" onmousedown={resetView} title="Reset view">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
    </button>
  </div>

  <div class="canvas">
    {#if file}
      <div class="image-container" style="transform: scale({zoom}) rotate({rotation}deg);">
        {#if file.url}
          <img src={file.url} alt={file.name} class="actual-image" />
        {:else}
          <div class="placeholder-image" style="background: {t.bgLight}; color: {t.fgDim}; border-color: {t.border};">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>{file.name}</span>
            <span class="file-path" style="color: {t.fgDim};">{file.path}</span>
          </div>
        {/if}
      </div>
    {:else}
      <div class="empty" style="color: {t.fgDim};">No image selected</div>
    {/if}
  </div>

  <div class="statusbar" style="border-color: {t.border};">
    <span style="color: {t.fgDim};">{file?.name || '—'}</span>
    {#if file}
      <span style="color: {t.fgDim};">{file.path}</span>
    {/if}
  </div>
</div>

<style>
  .viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Inter', system-ui, sans-serif;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
  }

  .tool-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--fg);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }
  .tool-btn:hover { background: rgba(255,255,255,0.1); }

  .zoom-label {
    font-size: 11px;
    color: var(--fg-dim);
    min-width: 36px;
    text-align: center;
  }

  .toolbar-sep {
    width: 1px;
    height: 16px;
    background: var(--border);
    margin: 0 2px;
  }

  .canvas {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: auto;
    background: var(--bg-dark);
    background-image:
      linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  }

  .image-container {
    transition: transform 0.2s ease;
  }

  .actual-image {
    max-width: 90vw;
    max-height: 80vh;
    display: block;
    border-radius: 4px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
  }

  .placeholder-image {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 48px;
    border: 2px dashed;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 500;
  }

  .file-path {
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
  }

  .empty {
    font-style: italic;
  }

  .statusbar {
    display: flex;
    justify-content: space-between;
    padding: 4px 10px;
    border-top: 1px solid;
    background: rgba(255,255,255,0.04);
    font-size: 11px;
  }
</style>
