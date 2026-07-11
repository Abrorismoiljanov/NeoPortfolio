<script>
  import { closeWindow, focusWindow, minimizeWindow, updateWindowPosition, updateWindowSize, toggleFullscreen, activeWindowId, minimizedIds } from '../stores/windows.js';
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { onMount } from 'svelte';

  let { id, title, component, x, y, width, height, minWidth = 300, minHeight = 200 } = $props();

  let isActive = $derived($activeWindowId === id);
  let isMinimized = $derived($minimizedIds.has(id));
  let t = $derived(themes[$currentTheme]);
  let titleFg = $derived(isActive ? t.activeTitleFg : t.titleFg);

  let dragging = $state(false);
  let resizing = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let resizeDir = '';
  let winEl;
  let opened = $state(false);
  let showSnapPreview = $state(false);
  let snapSide = $state('');
  let snapPreviewStyle = $state('');
  let isFullscreen = $state(false);

  onMount(() => {
    requestAnimationFrame(() => { opened = true; });
  });

  function onTitleMouseDown(e) {
    if (e.target.closest('.win-btn')) return;
    dragging = true;
    dragOffsetX = e.clientX - x;
    dragOffsetY = e.clientY - y;
    focusWindow(id);
    e.preventDefault();
  }

  function onTitleDblClick(e) {
    if (e.target.closest('.win-btn')) return;
    toggleFullscreen(id);
    isFullscreen = !isFullscreen;
  }

  function onResizeMouseDown(e, dir) {
    resizing = true;
    resizeDir = dir;
    dragOffsetX = e.clientX;
    dragOffsetY = e.clientY;
    focusWindow(id);
    e.preventDefault();
    e.stopPropagation();
  }

  function onMouseMove(e) {
    if (dragging) {
      const nx = e.clientX - dragOffsetX;
      const ny = e.clientY - dragOffsetY;
      updateWindowPosition(id, nx, ny);

      const screenW = window.innerWidth;
      const screenH = window.innerHeight - 44;
      const threshold = 20;

      if (e.clientX <= threshold) {
        snapSide = 'left';
        showSnapPreview = true;
        snapPreviewStyle = `left: 0; top: 0; width: ${screenW / 2}px; height: ${screenH}px;`;
      } else if (e.clientX >= screenW - threshold) {
        snapSide = 'right';
        showSnapPreview = true;
        snapPreviewStyle = `left: ${screenW / 2}px; top: 0; width: ${screenW / 2}px; height: ${screenH}px;`;
      } else if (e.clientY <= threshold) {
        snapSide = 'maximize';
        showSnapPreview = true;
        snapPreviewStyle = `left: 0; top: 0; width: ${screenW}px; height: ${screenH}px;`;
      } else {
        showSnapPreview = false;
        snapSide = '';
      }
    }

    if (resizing) {
      let dx = e.clientX - dragOffsetX;
      let dy = e.clientY - dragOffsetY;
      dragOffsetX = e.clientX;
      dragOffsetY = e.clientY;

      let nw = width, nh = height, nx = x, ny = y;
      if (resizeDir.includes('e')) nw = width + dx;
      if (resizeDir.includes('s')) nh = height + dy;
      if (resizeDir.includes('w')) { nw = width - dx; nx = x + dx; }
      if (resizeDir.includes('n')) { nh = height - dy; ny = y + dy; }

      if (nw >= minWidth && nh >= minHeight) {
        updateWindowSize(id, nw, nh);
        if (resizeDir.includes('w') || resizeDir.includes('n')) {
          updateWindowPosition(id, nx, ny);
        }
      }
    }
  }

  function onMouseUp() {
    if (dragging && showSnapPreview) {
      const screenW = window.innerWidth;
      const screenH = window.innerHeight - 44;
      if (snapSide === 'left') {
        updateWindowPosition(id, 0, 0);
        updateWindowSize(id, screenW / 2, screenH);
      } else if (snapSide === 'right') {
        updateWindowPosition(id, screenW / 2, 0);
        updateWindowSize(id, screenW / 2, screenH);
      } else if (snapSide === 'maximize') {
        updateWindowPosition(id, 0, 0);
        updateWindowSize(id, screenW, screenH);
      }
    }
    dragging = false;
    resizing = false;
    showSnapPreview = false;
    snapSide = '';
  }

  function handleClose() {
    opened = false;
    setTimeout(() => closeWindow(id), 200);
  }

  function handleMinimize() {
    opened = false;
    setTimeout(() => minimizeWindow(id), 200);
  }

  function preventContextMenu(e) {
    e.preventDefault();
  }
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={onMouseUp} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="window"
  class:active={isActive}
  class:opened
  class:minimized={isMinimized}
  class:closing={!opened}
  class:wobbling={dragging}
  class:fullscreen={isFullscreen}
  style={isFullscreen
    ? `left: 0; top: 0; width: 100%; height: calc(100vh - 44px); z-index: ${isActive ? 1000 : 100}; --bg: ${t.bg}; --bg-light: ${t.bgLight}; --fg: ${t.fg}; --fg-dim: ${t.fgDim}; --border: ${t.border}; --title-bg: ${t.titleBg}; --title-fg: ${titleFg}; --active-title-bg: ${t.activeTitleBg}; --active-title-fg: ${t.activeTitleFg}; --shadow: ${t.shadow}; --panel-bg: ${t.panelBg}; --accent: ${t.accent};`
    : `left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px; z-index: ${isActive ? 1000 : 100}; --bg: ${t.bg}; --bg-light: ${t.bgLight}; --fg: ${t.fg}; --fg-dim: ${t.fgDim}; --border: ${t.border}; --title-bg: ${t.titleBg}; --title-fg: ${titleFg}; --active-title-bg: ${t.activeTitleBg}; --active-title-fg: ${t.activeTitleFg}; --shadow: ${t.shadow}; --panel-bg: ${t.panelBg}; --accent: ${t.accent};`
  }
  onmousedown={() => focusWindow(id)}
  oncontextmenu={preventContextMenu}
  role="dialog"
  aria-label={title}
  tabindex="-1"
  bind:this={winEl}
>
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="title-bar" onmousedown={onTitleMouseDown} ondblclick={onTitleDblClick} role="banner">
    <span class="title-text">{title}</span>
    <div class="title-buttons">
      <button class="win-btn minimize" onmousedown={(e) => { e.stopPropagation(); handleMinimize(); }} aria-label="Minimize">
        <svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="5" width="8" height="2" fill="currentColor"/></svg>
      </button>
      <button class="win-btn maximize" onmousedown={(e) => { e.stopPropagation(); toggleFullscreen(id); isFullscreen = !isFullscreen; }} aria-label={isFullscreen ? 'Restore' : 'Fullscreen'}>
        {#if isFullscreen}
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="3" y="3" width="6" height="6" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="1,4 1,1 4,1" fill="none" stroke="currentColor" stroke-width="1.5"/><polyline points="8,11 11,11 11,8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
        {:else}
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="2" width="8" height="8" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
        {/if}
      </button>
      <button class="win-btn close" onmousedown={(e) => { e.stopPropagation(); handleClose(); }} aria-label="Close">
        <svg width="12" height="12" viewBox="0 0 12 12"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" stroke-width="1.5"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
    </div>
  </div>

  <div class="win-content">
    {@render component({ windowId: id })}
  </div>

  {#if !isFullscreen}
    <!-- Resize handles -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-handle e" onmousedown={(e) => onResizeMouseDown(e, 'e')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-handle s" onmousedown={(e) => onResizeMouseDown(e, 's')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-handle w" onmousedown={(e) => onResizeMouseDown(e, 'w')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-handle n" onmousedown={(e) => onResizeMouseDown(e, 'n')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-handle se" onmousedown={(e) => onResizeMouseDown(e, 'se')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-handle sw" onmousedown={(e) => onResizeMouseDown(e, 'sw')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-handle ne" onmousedown={(e) => onResizeMouseDown(e, 'ne')}></div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-handle nw" onmousedown={(e) => onResizeMouseDown(e, 'nw')}></div>
  {/if}
</div>

{#if showSnapPreview}
  <div class="snap-preview" style="{snapPreviewStyle} background: {t.accent}20; border: 2px solid {t.accent}60; border-radius: 8px; z-index: 999;"></div>
{/if}

<style>
  .window {
    position: absolute;
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 8px 32px var(--shadow);
    border: 1px solid var(--border);
    transition: box-shadow 0.2s ease, opacity 0.2s ease, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 0.2s ease;
    opacity: 0;
    transform: scale(0.92) translateY(10px);
  }
  .window.opened {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  .window.closing {
    opacity: 0;
    transform: scale(0.92) translateY(10px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .window.minimized {
    opacity: 0;
    transform: scale(0.6) translateY(60px);
    pointer-events: none;
    transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .window.active {
    box-shadow: 0 12px 48px var(--shadow);
  }
  .window.fullscreen {
    border-radius: 0;
    border: none;
    transition: left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), border-radius 0.2s ease, box-shadow 0.2s ease;
  }
  .window.wobbling {
    box-shadow: 0 16px 56px var(--shadow);
    transform: scale(1.01);
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }

  .title-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px 0 12px;
    height: 32px;
    background: var(--title-bg);
    color: var(--title-fg);
    cursor: grab;
    user-select: none;
    flex-shrink: 0;
    transition: background 0.2s;
  }
  .active .title-bar {
    background: var(--active-title-bg);
    color: var(--active-title-fg);
  }

  .title-text {
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title-buttons {
    display: flex;
    gap: 4px;
  }
  .win-btn {
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: inherit;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.7;
    transition: opacity 0.15s, background 0.15s, transform 0.1s;
  }
  .win-btn:hover {
    opacity: 1;
    background: rgba(255,255,255,0.15);
  }
  .win-btn:active {
    transform: scale(0.9);
  }
  .win-btn.close:hover {
    background: #e81123;
    color: white;
  }

  .win-content {
    flex: 1;
    overflow: auto;
    background: var(--bg);
    color: var(--fg);
  }

  .resize-handle { position: absolute; }
  .resize-handle.e { right: -3px; top: 0; width: 6px; height: 100%; cursor: e-resize; }
  .resize-handle.s { bottom: -3px; left: 0; height: 6px; width: 100%; cursor: s-resize; }
  .resize-handle.w { left: -3px; top: 0; width: 6px; height: 100%; cursor: w-resize; }
  .resize-handle.n { top: -3px; left: 0; height: 6px; width: 100%; cursor: n-resize; }
  .resize-handle.se { right: -3px; bottom: -3px; width: 12px; height: 12px; cursor: se-resize; }
  .resize-handle.sw { left: -3px; bottom: -3px; width: 12px; height: 12px; cursor: sw-resize; }
  .resize-handle.ne { right: -3px; top: -3px; width: 12px; height: 12px; cursor: ne-resize; }
  .resize-handle.nw { left: -3px; top: -3px; width: 12px; height: 12px; cursor: nw-resize; }

  .snap-preview {
    position: fixed;
    pointer-events: none;
    transition: all 0.2s ease;
    animation: snapFadeIn 0.15s ease;
  }

  @keyframes snapFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
