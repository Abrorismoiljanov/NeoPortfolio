<script>
  import { windows, activeWindowId, visibleWindows, minimizedIds, focusWindow, restoreWindow, minimizeWindow } from '../stores/windows.js';
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { onDestroy, tick } from 'svelte';
  import { animate, spring } from '@motionone/dom';

  let t = $derived(themes[$currentTheme]);
  let now = $state(new Date());
  let startMenuOpen = $state(false);
  let calendarOpen = $state(false);
  let calMonth = $state(now.getMonth());
  let calYear = $state(now.getFullYear());
  let batteryLevel = $state(87);
  let wifiStrength = $state(3);

  const clockInterval = setInterval(() => { now = new Date(); }, 1000);
  onDestroy(() => clearInterval(clockInterval));

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  let calDays = $derived.by(() => {
    const first = new Date(calYear, calMonth, 1).getDay();
    const total = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  });

  let calToday = $derived({ day: now.getDate(), month: now.getMonth(), year: now.getFullYear() });

  function calPrev() {
    if (calMonth === 0) { calMonth = 11; calYear--; }
    else calMonth--;
  }
  function calNext() {
    if (calMonth === 11) { calMonth = 0; calYear++; }
    else calMonth++;
  }
  function calGoToday() {
    calMonth = now.getMonth();
    calYear = now.getFullYear();
  }

  let isFullscreen = $state(false);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      isFullscreen = true;
    } else {
      document.exitFullscreen();
      isFullscreen = false;
    }
  }

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

  function toggleCalendar() {
    calendarOpen = !calendarOpen;
    startMenuOpen = false;
    if (calendarOpen) {
      tick().then(() => {
        const el = document.querySelector('.calendar-popup');
        if (el) animate(el, { opacity: [0, 1], y: [12, 0], scale: [0.95, 1] }, { duration: 0.3, easing: spring({ stiffness: 500, damping: 30 }) });
      });
    }
  }
  function toggleStartMenu() {
    startMenuOpen = !startMenuOpen;
    calendarOpen = false;
    if (startMenuOpen) {
      tick().then(() => {
        const el = document.querySelector('.start-menu');
        if (el) animate(el, { opacity: [0, 1], y: [16, 0], scale: [0.96, 1] }, { duration: 0.35, easing: spring({ stiffness: 400, damping: 25 }) });
      });
    }
  }
</script>

<div
  class="taskbar"
  style="--bg: {t.panelBg}; --fg: {t.fg}; --border: {t.border}; --accent: {t.accent}; --active-bg: {t.activeTitleBg}; --hover: {t.hoverBg}; --bg-dark: {t.bgDark};"
>
  <button class="start-btn" onmousedown={(e) => { animate(e.currentTarget, { scale: [1, 0.85, 1.05, 1] }, { duration: 0.3, easing: spring({ stiffness: 500, damping: 20 }) }); toggleStartMenu(); }} aria-label="Start menu">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/>
    </svg>
  </button>

  <div class="taskbar-sep" style="background: {t.border};"></div>

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

    <button class="clock-btn" onmousedown={(e) => { animate(e.currentTarget, { scale: [1, 0.93, 1.03, 1] }, { duration: 0.3, easing: spring({ stiffness: 500, damping: 20 }) }); toggleCalendar(); }}>
      <span class="time">{formatTime(now)}</span>
      <span class="date">{formatDate(now)}</span>
    </button>

    <button class="fs-btn" onmousedown={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
      {#if isFullscreen}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>
        </svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 00-2 2v3m18-5h-3m3 0v3m0 12v-3m0 3h-3M3 16v3a2 2 0 002 2h3"/>
        </svg>
      {/if}
    </button>
  </div>
</div>

{#if startMenuOpen || calendarOpen}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="start-overlay" onmousedown={() => { startMenuOpen = false; calendarOpen = false; }}></div>
{/if}

{#if startMenuOpen}
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

{#if calendarOpen}
  <div class="calendar-popup" style="--bg: {t.bgDark}; --fg: {t.fg}; --border: {t.border}; --hover: {t.hoverBg}; --accent: {t.accent}; --bg-light: {t.bgLight};">
    <div class="cal-header">
      <button class="cal-nav" onmousedown={calPrev} style="color: {t.fg};">&lsaquo;</button>
      <button class="cal-title" onmousedown={calGoToday} style="color: {t.fg};" title="Go to today">{MONTHS[calMonth]} {calYear}</button>
      <button class="cal-nav" onmousedown={calNext} style="color: {t.fg};">&rsaquo;</button>
    </div>
    <div class="cal-days-header">
      {#each DAYS as d}
        <span style="color: {t.fgDim};">{d}</span>
      {/each}
    </div>
    <div class="cal-grid">
      {#each calDays as day}
        {#if day === null}
          <span class="cal-cell empty"></span>
        {:else}
          <button
            class="cal-cell"
            class:today={day === calToday.day && calMonth === calToday.month && calYear === calToday.year}
            onmousedown={calGoToday}
            style="color: {t.fg};"
          >{day}</button>
        {/if}
      {/each}
    </div>
    <div class="cal-now" style="border-color: {t.border}; color: {t.fgDim};">{formatDate(now)} &middot; {formatTime(now)}</div>
  </div>
{/if}

<style>
  .taskbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 44px;
    background: rgba(0, 0, 0, 0.8);
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    align-items: center;
    padding: 0 8px;
    z-index: 9999;
    backdrop-filter: blur(12px) saturate(1.2);
    -webkit-backdrop-filter: blur(12px) saturate(1.2);
    animation: slideUp 0.3s ease 0.5s both;
  }

  .taskbar-sep {
    width: 1px;
    height: 20px;
    opacity: 0.25;
    margin: 0 4px;
    flex-shrink: 0;
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
    transition: background 0.15s, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    flex-shrink: 0;
  }
  .start-btn:hover { background: rgba(255,255,255,0.1); }
  .start-btn:active { transform: scale(0.92); }

  .taskbar-items {
    flex: 1;
    display: flex;
    gap: 2px;
    overflow-x: auto;
    padding: 0 4px;
    min-width: 0;
  }
  .taskbar-items::-webkit-scrollbar { display: none; }
  .taskbar-items { scrollbar-width: none; }

  .taskbar-item {
    position: relative;
    height: 32px;
    min-width: 40px;
    width: 40px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--fg);
    border-radius: 6px;
    transition: background 0.15s, transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s;
    opacity: 0.6;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .taskbar-item:hover { background: rgba(255,255,255,0.1); opacity: 1; }
  .taskbar-item.active {
    background: rgba(255,255,255,0.1);
    opacity: 1;
  }
  .taskbar-item.minimized { opacity: 0.35; }
  .taskbar-item:active { transform: scale(0.92); }

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
    border-left: 1px solid rgba(255,255,255,0.1);
    margin-left: 8px;
    flex-shrink: 0;
  }

  .tray-icons {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--fg);
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

  .fs-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    color: var(--fg);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.6;
    transition: opacity 0.15s, background 0.15s;
  }
  .fs-btn:hover { opacity: 1; background: var(--hover); }

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
    background: rgba(0,0,0,0.1);
  }

  .start-menu {
    position: fixed;
    bottom: 48px;
    left: 8px;
    width: 300px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.5);
    z-index: 10000;
    padding: 16px;
    opacity: 0;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
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

  .calendar-popup {
    position: fixed;
    bottom: 48px;
    right: 8px;
    width: 280px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.5);
    z-index: 10000;
    padding: 14px;
    opacity: 0;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .cal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .cal-nav {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }
  .cal-nav:hover { background: var(--hover); }

  .cal-title {
    border: none;
    background: transparent;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.15s;
  }
  .cal-title:hover { background: var(--hover); }

  .cal-days-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 10px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .cal-days-header span {
    padding: 4px 0;
  }

  .cal-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 1px;
  }

  .cal-cell {
    width: 100%;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    border: none;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.12s, transform 0.12s;
  }
  .cal-cell:not(.empty):hover { background: var(--hover); transform: scale(1.1); }
  .cal-cell.empty { cursor: default; }
  .cal-cell.today {
    background: var(--accent);
    color: var(--bg) !important;
    font-weight: 700;
  }

  .cal-now {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid;
    font-size: 11px;
    text-align: center;
    font-family: 'Inter', system-ui, sans-serif;
  }
</style>
