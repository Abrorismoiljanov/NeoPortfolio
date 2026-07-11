<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { openWindow } from '../stores/windows.js';

  import Terminal from '../apps/Terminal.svelte';
  import FileManager from '../apps/FileManager.svelte';
  import AboutMe from '../apps/AboutMe.svelte';
  import Projects from '../apps/Projects.svelte';
  import Settings from '../apps/Settings.svelte';
  import SystemMonitor from '../apps/SystemMonitor.svelte';
  import Browser from '../apps/Browser.svelte';

  let t = $derived(themes[$currentTheme]);
  let currentWallpaper = $state('gradient');
  let customImage = $state(null);

  $effect(() => {
    const saved = localStorage.getItem('os-wallpaper');
    if (saved) currentWallpaper = saved;
    const img = localStorage.getItem('os-wallpaper-image');
    if (img) customImage = img;
  });

  const wallpapers = {
    gradient: (t) => t.wallpaper,
    solid: (t) => t.bgDark,
    mesh: (t) => `radial-gradient(ellipse at 20% 50%, ${t.accent}30 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, ${t.blue}25 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, ${t.purple}20 0%, transparent 50%), ${t.bgDark}`,
    dots: (t) => `radial-gradient(circle at 50% 50%, ${t.bgLight} 1px, transparent 1px) 0 0 / 24px 24px, ${t.bgDark}`,
    stripes: (t) => `repeating-linear-gradient(45deg, transparent, transparent 10px, ${t.bgLight}10 10px, ${t.bgLight}10 20px), ${t.bgDark}`,
  };

  let desktopBg = $derived(() => {
    if (currentWallpaper === 'custom' && customImage) {
      return `url(${customImage}) center/cover no-repeat`;
    }
    return wallpapers[currentWallpaper]?.(t) || t.wallpaper;
  });

  const allApps = [
    { id: 'terminal', title: 'Terminal', icon: '>', component: Terminal, color: () => t.fgDim },
    { id: 'files', title: 'Files', icon: '\uD83D\uDCC1', component: FileManager, color: () => t.blue },
    { id: 'about', title: 'About Me', icon: '\uD83D\uDC64', component: AboutMe, color: () => t.aqua },
    { id: 'projects', title: 'Projects', icon: '\u2B22', component: Projects, color: () => t.purple },
    { id: 'settings', title: 'Settings', icon: '\u2699', component: Settings, color: () => t.orange },
    { id: 'sysmon', title: 'System Monitor', icon: '\u25A3', component: SystemMonitor, color: () => t.green },
    { id: 'browser', title: 'Browser', icon: '\u25C9', component: Browser, color: () => t.blue }
  ];

  const GRID = 96;

  function snapToGrid(v) {
    return Math.round(v / GRID) * GRID;
  }

  function defaultPositions() {
    const positions = {};
    const marginX = 24;
    const marginY = 24;
    allApps.forEach((app, i) => {
      positions[app.id] = {
        x: marginX,
        y: marginY + i * 100
      };
    });
    return positions;
  }

  function loadPositions() {
    try {
      const saved = localStorage.getItem('os-icon-positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        const pos = {};
        for (const app of allApps) {
          pos[app.id] = parsed[app.id] || defaultPositions()[app.id];
        }
        return pos;
      }
    } catch {}
    return defaultPositions();
  }

  let iconPositions = $state(loadPositions());

  function savePositions() {
    localStorage.setItem('os-icon-positions', JSON.stringify(iconPositions));
  }

  let dragId = $state(null);
  let isDragging = $state(false);
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragRawX = $state(0);
  let dragRawY = $state(0);

  let dragSnapX = $derived(snapToGrid(Math.max(0, Math.min(dragRawX, window.innerWidth - GRID))));
  let dragSnapY = $derived(snapToGrid(Math.max(0, Math.min(dragRawY, window.innerHeight - 120))));

  function onIconMouseDown(e, app) {
    if (e.button !== 0) return;
    e.stopPropagation();

    const pos = iconPositions[app.id];
    dragOffsetX = e.clientX - pos.x;
    dragOffsetY = e.clientY - pos.y;
    dragRawX = e.clientX - dragOffsetX;
    dragRawY = e.clientY - dragOffsetY;
    dragId = app.id;

    function onMove(ev) {
      if (!isDragging) {
        const dx = ev.clientX - (pos.x + dragOffsetX);
        const dy = ev.clientY - (pos.y + dragOffsetY);
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          isDragging = true;
        }
      }
      if (!isDragging) return;
      dragRawX = ev.clientX - dragOffsetX;
      dragRawY = ev.clientY - dragOffsetY;
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      if (isDragging && dragId) {
        iconPositions[dragId] = { x: dragSnapX, y: dragSnapY };
        iconPositions = { ...iconPositions };
        savePositions();
      }
      dragId = null;
      isDragging = false;
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  function openApp(app) {
    const sizes = {
      terminal: { width: 680, height: 420 },
      files: { width: 750, height: 500 },
      about: { width: 520, height: 580 },
      projects: { width: 820, height: 580 },
      settings: { width: 560, height: 500 },
      sysmon: { width: 600, height: 480 },
      browser: { width: 960, height: 640 }
    };
    openWindow(app.id, app.title, app.component, { ...sizes[app.id], icon: app.icon, iconColor: app.color() });
  }

  let contextMenu = $state(null);

  function onContextMenu(e) {
    e.preventDefault();
    contextMenu = { x: e.clientX, y: e.clientY };
  }

  function closeContextMenu() {
    contextMenu = null;
  }

  $effect(() => {
    function handleWallpaperChange(e) {
      const { type, image } = e.detail;
      currentWallpaper = type;
      if (image) customImage = image;
    }
    window.addEventListener('wallpaper-change', handleWallpaperChange);
    return () => window.removeEventListener('wallpaper-change', handleWallpaperChange);
  });
</script>

<svelte:window onmousedown={closeContextMenu} />

<div
  class="desktop"
  style="background: {desktopBg()};"
  oncontextmenu={onContextMenu}
  role="application"
>
  <div class="desktop-icons">
    {#each allApps as app (app.id)}
      {@const pos = iconPositions[app.id] || { x: 24, y: 24 }}
      {@const isBeingDragged = dragId === app.id && isDragging}
      <button
        class="desktop-icon"
        class:dragging={isBeingDragged}
        style="left: {pos.x}px; top: {pos.y}px; z-index: {isBeingDragged ? 0 : 1};"
        onmousedown={(e) => onIconMouseDown(e, app)}
        ondblclick={() => { if (!isDragging) openApp(app); }}
        tabindex="-1"
      >
        <div class="icon-glyph" style="color: {app.color()};">{app.icon}</div>
        <span class="icon-label">{app.title}</span>
      </button>
    {/each}
  </div>

  {#if isDragging && dragId}
    {@const ghostApp = allApps.find(a => a.id === dragId)}
    {#if ghostApp}
      <div class="drag-ghost" style="left: {dragSnapX}px; top: {dragSnapY}px;">
        <div class="icon-glyph" style="color: {ghostApp.color()};">{ghostApp.icon}</div>
        <span class="icon-label">{ghostApp.title}</span>
      </div>
    {/if}
  {/if}

  {#if contextMenu}
    <div
      class="context-menu"
      style="left: {contextMenu.x}px; top: {contextMenu.y}px; background: {t.bgDark}; border-color: {t.border}; color: {t.fg};"
    >
      <button class="ctx-item" onmousedown={() => { openApp(allApps[0]); closeContextMenu(); }}>Open Terminal</button>
      <button class="ctx-item" onmousedown={() => { openApp(allApps[1]); closeContextMenu(); }}>Open Files</button>
      <button class="ctx-item" onmousedown={() => { openApp(allApps[5]); closeContextMenu(); }}>System Monitor</button>
      <div class="ctx-sep" style="border-color: {t.border};"></div>
      <button class="ctx-item" onmousedown={() => { openApp(allApps[4]); closeContextMenu(); }}>Settings</button>
    </div>
  {/if}
</div>

<style>
  .desktop {
    position: fixed;
    inset: 0;
    bottom: 44px;
    overflow: hidden;
    transition: background 0.5s ease;
  }

  .desktop-icons {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .desktop-icon {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80px;
    padding: 8px 4px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: grab;
    transition: background 0.15s, opacity 0.15s;
    gap: 4px;
    user-select: none;
    pointer-events: auto;
  }
  .desktop-icon:hover {
    background: rgba(255,255,255,0.08);
  }
  .desktop-icon:active {
    cursor: grabbing;
  }
  .desktop-icon.dragging {
    opacity: 0.25;
    transition: none;
    pointer-events: none;
  }

  .drag-ghost {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80px;
    padding: 8px 4px;
    border-radius: 8px;
    gap: 4px;
    pointer-events: none;
    z-index: 999;
    background: rgba(255,255,255,0.1);
    border: 2px dashed rgba(255,255,255,0.4);
    transition: left 0.08s ease-out, top 0.08s ease-out;
  }
  .drag-ghost .icon-glyph {
    filter: drop-shadow(0 0 6px rgba(255,255,255,0.3));
  }

  .icon-glyph {
    font-size: 32px;
    line-height: 1;
    font-family: monospace;
    font-weight: bold;
    transition: transform 0.2s;
  }
  .desktop-icon:hover .icon-glyph {
    transform: scale(1.1);
  }

  .icon-label {
    font-size: 11px;
    color: white;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8);
    font-family: 'Inter', system-ui, sans-serif;
    text-align: center;
    word-break: break-word;
  }

  .context-menu {
    position: fixed;
    min-width: 160px;
    border-radius: 8px;
    border: 1px solid;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    padding: 4px;
    z-index: 99999;
    animation: menuPop 0.12s ease;
  }

  .ctx-item {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: transparent;
    color: inherit;
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
    text-align: left;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.1s;
  }
  .ctx-item:hover {
    background: rgba(255,255,255,0.1);
  }

  .ctx-sep {
    height: 1px;
    border-top: 1px solid;
    margin: 4px 8px;
  }

  @keyframes menuPop {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
</style>
