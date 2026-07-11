<script>
  import { windows, activeWindowId, visibleWindows, minimizedIds, focusWindow, restoreWindow, minimizeWindow } from '../stores/windows.js';
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { onDestroy } from 'svelte';

  let t = $derived(themes[$currentTheme]);
  let now = $state(new Date());
  let startMenuOpen = $state(false);
  let batteryLevel = $state(87);
  let wifiStrength = $state(3);

  const clockInterval = setInterval(() => { now = new Date(); }, 1000);
  onDestroy(() => clearInterval(clockInterval));

  function handleTaskbarClick(win) {
    if (win.id === $activeWindowId && !$minimizedIds.has(win.id)) {
      minimizeWindow(win.id);
    } else if ($minimizedIds.has(win.id)) {
      restoreWindow(win.id);
    } else {
      focusWindow(win.id);
    }
  }

  function formatTime(d) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  function formatDate(d) {
    return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }
</script>

<div
  class="taskbar"
  style="--bg: {t.panelBg}; --fg: {t.fg}; --border: {t.border}; --accent: {t.accent}; --active-bg: {t.activeTitleBg}; --hover: {t.hoverBg}; --bg-dark: {t.bgDark};"
>
  <button class="start-btn" onmousedown={() => startMenuOpen = !startMenuOpen} aria-label="Start menu">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/>
    </svg>
  </button>

  <div class="taskbar-items">
    {#each $windows as win (win.id)}
      <button
        class="taskbar-item"
        class:active={win.id === $activeWindowId && !$minimizedIds.has(win.id)}
        class:minimized={$minimizedIds.has(win.id)}
        onmousedown={() => handleTaskbarClick(win)}
        title={win.title}
      >
        <span class="taskbar-indicator" class:visible={win.id === $activeWindowId && !$minimizedIds.has(win.id)} style="background: {t.accent};"></span>
        <span class="taskbar-icon" style="color: {win.iconColor};">{win.icon}</span>
      </button>
    {/each}
  </div>

  <div class="system-tray">
    <div class="tray-icons">
      <svg class="tray-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
      </svg>
      <span class="battery">
        <svg width="20" height="12" viewBox="0 0 20 12">
          <rect x="0" y="1" width="17" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <rect x="17" y="3.5" width="2" height="5" rx="1" fill="currentColor" opacity="0.5"/>
          <rect x="1.5" y="2.5" width={14 * (batteryLevel / 100)} height="7" rx="1" fill="{batteryLevel > 20 ? t.green : t.red}"/>
        </svg>
        <span class="battery-text">{batteryLevel}%</span>
      </span>
    </div>

    <button class="clock-btn" onmousedown={() => startMenuOpen = !startMenuOpen}>
      <span class="time">{formatTime(now)}</span>
      <span class="date">{formatDate(now)}</span>
    </button>
  </div>
</div>

{#if startMenuOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="start-overlay" onmousedown={() => startMenuOpen = false}></div>
  <div class="start-menu" style="--bg: {t.bgDark}; --fg: {t.fg}; --border: {t.border}; --hover: {t.hoverBg}; --accent: {t.accent}; --bg-light: {t.bgLight};">
    <div class="start-header">
      <div class="start-logo" style="color: {t.accent};">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/>
        </svg>
      </div>
      <span style="font-weight: 600; font-size: 14px;">WebOS</span>
    </div>
    <div class="start-search">
      <input placeholder="Search apps..." style="background: {t.bgLight}; color: {t.fg}; border-color: {t.border};" />
    </div>
    <div class="start-hint" style="color: {t.fgDim};">Double-click desktop icons to open apps</div>
    <div class="start-power">
      <button class="power-btn" style="color: {t.fgDim};" onmousedown={() => { startMenuOpen = false; location.reload(); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/>
        </svg>
        Restart
      </button>
    </div>
  </div>
{/if}

<style>
  .taskbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 44px;
    background: var(--bg);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    padding: 0 8px;
    z-index: 9999;
    backdrop-filter: blur(16px);
    animation: slideUp 0.3s ease 0.5s both;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .start-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: var(--fg);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, transform 0.1s;
    margin-right: 8px;
  }
  .start-btn:hover { background: var(--hover); }
  .start-btn:active { transform: scale(0.92); }

  .taskbar-items {
    flex: 1;
    display: flex;
    gap: 4px;
    overflow-x: auto;
    padding: 0 4px;
  }

  .taskbar-item {
    position: relative;
    height: 32px;
    width: 40px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--fg);
    border-radius: 6px;
    transition: background 0.15s, transform 0.1s;
    opacity: 0.7;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .taskbar-item:hover { background: var(--hover); opacity: 1; }
  .taskbar-item.active {
    background: rgba(255,255,255,0.08);
    opacity: 1;
  }
  .taskbar-item.minimized { opacity: 0.4; }
  .taskbar-item:active { transform: scale(0.96); }

  .taskbar-icon {
    font-size: 16px;
    font-family: monospace;
    font-weight: bold;
    line-height: 1;
  }

  .taskbar-indicator {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    border-radius: 1px;
    transition: width 0.2s ease;
  }
  .taskbar-indicator.visible {
    width: 60%;
  }

  .system-tray {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-left: 12px;
    border-left: 1px solid var(--border);
    margin-left: 8px;
  }

  .tray-icons {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tray-icon { opacity: 0.6; }

  .battery {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .battery-text {
    font-size: 11px;
    font-family: 'Inter', system-ui, sans-serif;
    opacity: 0.7;
  }

  .clock-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.2;
    border: none;
    background: transparent;
    padding: 4px 8px;
    border-radius: 4px;
    transition: background 0.15s;
  }
  .clock-btn:hover { background: var(--hover); }

  .time {
    font-size: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--fg);
  }
  .date {
    font-size: 10px;
    font-family: 'Inter', system-ui, sans-serif;
    color: var(--fg);
    opacity: 0.6;
  }

  .start-overlay {
    position: fixed;
    inset: 0;
    z-index: 9998;
  }

  .start-menu {
    position: fixed;
    bottom: 48px;
    left: 8px;
    width: 300px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.5);
    z-index: 10000;
    padding: 16px;
    animation: menuSlideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes menuSlideUp {
    from { opacity: 0; transform: translateY(8px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .start-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: var(--fg);
  }

  .start-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--bg-light);
  }

  .start-search {
    margin-bottom: 12px;
  }

  .start-search input {
    width: 100%;
    padding: 8px 12px;
    border-radius: 6px;
    border: 1px solid;
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
    outline: none;
    transition: border-color 0.2s;
  }
  .start-search input:focus {
    border-color: var(--accent) !important;
  }

  .start-hint {
    font-size: 12px;
    text-align: center;
    padding: 8px 0;
  }

  .start-power {
    border-top: 1px solid var(--border);
    padding-top: 8px;
    margin-top: 4px;
  }

  .power-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: inherit;
    font-size: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    border-radius: 6px;
    transition: background 0.15s;
  }
  .power-btn:hover { background: var(--hover); }
</style>
