<script>
  import { base } from '$app/paths';
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { openWindow } from '../stores/windows.js';
  import { animate, spring } from '@motionone/dom';

  import Terminal from '../apps/Terminal.svelte';
  import FileManager from '../apps/FileManager.svelte';
  import AboutMe from '../apps/AboutMe.svelte';
  import Projects from '../apps/Projects.svelte';
  import Settings from '../apps/Settings.svelte';
  import SystemMonitor from '../apps/SystemMonitor.svelte';
  import Paint from '../apps/Paint.svelte';
  import Snake from '../apps/Snake.svelte';
  import ImageViewer from '../apps/ImageViewer.svelte';
  import VideoPlayer from '../apps/VideoPlayer.svelte';

  let t = $derived(themes[$currentTheme]);
  let currentWallpaper = $state('gradient');
  let customImage = $state(null);

  const randomWallpapers = [
    `${base}/Pictures/Eblan.jpg`,
    `${base}/Pictures/Wallpapers/eva_smoothed_gruvbox.png`,
    `${base}/Pictures/Wallpapers/lain_upscayl_4x_digital-art-4x.png`,
    `${base}/Pictures/Wallpapers/mint_upscayl_4x_digital-art-4x.png`,
    `${base}/Pictures/Wallpapers/wallhaven-9o8k9w.jpg`,
    `${base}/Pictures/Wallpapers/wallhaven-vpdxqp.png`,
    `${base}/Pictures/Wallpapers/wallhaven-yqg2og.jpg`,
  ];

  $effect(() => {
    const saved = localStorage.getItem('os-wallpaper');
    if (saved) {
      currentWallpaper = saved;
      const img = localStorage.getItem('os-wallpaper-image');
      if (img) customImage = img;
    } else {
      const pick = randomWallpapers[Math.floor(Math.random() * randomWallpapers.length)];
      customImage = pick;
      currentWallpaper = 'custom';
      localStorage.setItem('os-wallpaper', 'custom');
      localStorage.setItem('os-wallpaper-image', pick);
    }
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
    { id: 'terminal', title: 'Terminal', icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="3"/><polyline points="7 8 11 12 7 16"/><line x1="13" y1="16" x2="17" y2="16"/></svg>`, component: Terminal, color: () => t.green },
    { id: 'files', title: 'Files', icon: '\uD83D\uDCC1', component: FileManager, color: () => t.blue },
    { id: 'about', title: 'About Me', icon: '\uD83D\uDC64', component: AboutMe, color: () => t.aqua },
    { id: 'projects', title: 'Projects', icon: '\u2B22', component: Projects, color: () => t.purple },
    { id: 'settings', title: 'Settings', icon: '\u2699', component: Settings, color: () => t.orange },
    { id: 'sysmon', title: 'System Monitor', icon: '\u25A3', component: SystemMonitor, color: () => t.green },
    { id: 'paint', title: 'Paint', icon: '\u270E', component: Paint, color: () => t.accent },
    { id: 'snake', title: 'Snake', icon: '\uD83D\uDC0D', component: Snake, color: () => t.green },
    { id: 'image-viewer', title: 'Image Viewer', icon: '\uD83D\uDDBC', component: ImageViewer, color: () => t.blue, hidden: true },
    { id: 'video-player', title: 'Video Player', icon: '\u25B6', component: VideoPlayer, color: () => t.red, hidden: true }
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

  function findNearestFreeSpot(x, y, excludeId) {
    const occupied = new Set();
    for (const [id, pos] of Object.entries(iconPositions)) {
      if (id === excludeId) continue;
      occupied.add(`${pos.x},${pos.y}`);
    }
    if (!occupied.has(`${x},${y}`)) return { x, y };

    for (let r = 1; r <= 20; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const nx = x + dx * GRID;
          const ny = y + dy * GRID;
          if (nx < 0 || ny < 0 || nx > window.innerWidth - GRID || ny > window.innerHeight - 120) continue;
          if (!occupied.has(`${nx},${ny}`)) return { x: nx, y: ny };
        }
      }
    }
    return { x, y };
  }

  let dragId = $state(null);
  let isDragging = $state(false);
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let dragRawX = $state(0);
  let dragRawY = $state(0);

  let rawSnapX = $derived(snapToGrid(Math.max(0, Math.min(dragRawX, window.innerWidth - GRID))));
  let rawSnapY = $derived(snapToGrid(Math.max(0, Math.min(dragRawY, window.innerHeight - 120))));
  let dragSnapX = $derived(dragId ? findNearestFreeSpot(rawSnapX, rawSnapY, dragId).x : rawSnapX);
  let dragSnapY = $derived(dragId ? findNearestFreeSpot(rawSnapX, rawSnapY, dragId).y : rawSnapY);

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
        const spot = findNearestFreeSpot(dragSnapX, dragSnapY, dragId);
        iconPositions[dragId] = spot;
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
      paint: { width: 1000, height: 640 },
      snake: { width: 540, height: 480 },
      'image-viewer': { width: 600, height: 500 },
      'video-player': { width: 700, height: 520 }
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
    {#each allApps.filter(a => !a.hidden) as app (app.id)}
      {@const pos = iconPositions[app.id] || { x: 24, y: 24 }}
      {@const isBeingDragged = dragId === app.id && isDragging}
      <button
        class="desktop-icon"
        class:dragging={isBeingDragged}
        style="left: {pos.x}px; top: {pos.y}px; z-index: {isBeingDragged ? 0 : 1};"
        onmousedown={(e) => onIconMouseDown(e, app)}
        ondblclick={(e) => {
          if (!isDragging) {
            const glyph = e.currentTarget.querySelector('.icon-glyph');
            if (glyph) animate(glyph, { scale: [1, 1.3, 0.9, 1.1, 1] }, { duration: 0.4, easing: spring({ stiffness: 500, damping: 15 }) });
            openApp(app);
          }
        }}
        tabindex="-1"
      >
        <div class="icon-glyph" style="color: {app.color()};">{@html app.icon}</div>
        <span class="icon-label">{app.title}</span>
      </button>
    {/each}
  </div>

  {#if isDragging && dragId}
    {@const ghostApp = allApps.find(a => a.id === dragId)}
    {#if ghostApp}
      <div class="drag-ghost" style="left: {dragSnapX}px; top: {dragSnapY}px;">
        <div class="icon-glyph" style="color: {ghostApp.color()};">{@html ghostApp.icon}</div>
        <span class="icon-label">{ghostApp.title}</span>
      </div>
    {/if}
  {/if}

  {#if contextMenu}
    {@const menuStyle = `left: ${contextMenu.x}px; top: ${contextMenu.y}px; background: ${t.bgDark}ee; border-color: ${t.border}; color: ${t.fg}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);`}
    <div class="context-menu" style={menuStyle}>
      <button class="ctx-item" onmousedown={() => { openApp(allApps.find(a => a.id === 'terminal')); closeContextMenu(); }}>
        <span class="ctx-icon" style="color: {t.green};">{@html `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="3"/><polyline points="7 8 11 12 7 16"/><line x1="13" y1="16" x2="17" y2="16"/></svg>`}</span> Terminal
      </button>
      <button class="ctx-item" onmousedown={() => { openApp(allApps.find(a => a.id === 'files')); closeContextMenu(); }}>
        <span class="ctx-icon">{'\uD83D\uDCC1'}</span> Files
      </button>
      <button class="ctx-item" onmousedown={() => { openApp(allApps.find(a => a.id === 'paint')); closeContextMenu(); }}>
        <span class="ctx-icon" style="color: {t.accent};">{'\u270E'}</span> Paint
      </button>
      <button class="ctx-item" onmousedown={() => { openApp(allApps.find(a => a.id === 'snake')); closeContextMenu(); }}>
        <span class="ctx-icon" style="color: {t.green};">{'\uD83D\uDC0D'}</span> Snake
      </button>
      <div class="ctx-sep" style="border-color: {t.border};"></div>
      <button class="ctx-item" onmousedown={() => { openApp(allApps.find(a => a.id === 'settings')); closeContextMenu(); }}>
        <span class="ctx-icon" style="color: {t.orange};">{'\u2699'}</span> Settings
      </button>
      <button class="ctx-item" onmousedown={() => { openApp(allApps.find(a => a.id === 'sysmon')); closeContextMenu(); }}>
        <span class="ctx-icon" style="color: {t.green};">{'\u25A3'}</span> System Monitor
      </button>
      <div class="ctx-sep" style="border-color: {t.border};"></div>
      <button class="ctx-item" onmousedown={() => { currentWallpaper = 'gradient'; localStorage.setItem('os-wallpaper', 'gradient'); closeContextMenu(); }}>
        <span class="ctx-icon" style="color: {t.blue};">{'\uD83C\uDFA8'}</span> Reset Wallpaper
      </button>
    </div>
  {/if}
</div>

<style>
  .desktop {
    position: fixed;
    inset: 0;
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
    border: 1px solid transparent;
    background: transparent;
    border-radius: 8px;
    cursor: grab;
    transition: background 0.15s, border-color 0.15s, opacity 0.15s;
    gap: 4px;
    user-select: none;
    pointer-events: auto;
  }
  .desktop-icon:hover {
    background: rgba(255,255,255,0.08);
    border-color: rgba(255,255,255,0.12);
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
    animation: ghostWobble 0.6s ease-in-out infinite alternate;
  }
  .drag-ghost .icon-glyph {
    filter: drop-shadow(0 0 6px rgba(255,255,255,0.3));
    animation: glyphPulse 0.5s ease-in-out infinite alternate;
  }

  @keyframes ghostWobble {
    from { transform: rotate(-2deg) scale(1.05); }
    to { transform: rotate(2deg) scale(1.08); }
  }
  @keyframes glyphPulse {
    from { filter: drop-shadow(0 0 4px rgba(255,255,255,0.2)); }
    to { filter: drop-shadow(0 0 10px rgba(255,255,255,0.5)); }
  }

  .icon-glyph {
    font-size: 32px;
    line-height: 1;
    font-family: monospace;
    font-weight: bold;
    transition: transform 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-glyph :global(svg) {
    width: 32px;
    height: 32px;
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
    border-radius: 10px;
    border: 1px solid;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    padding: 4px;
    z-index: 99999;
    animation: menuPop 0.12s ease;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .ctx-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 12px;
    border: none;
    background: transparent;
    color: inherit;
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
    text-align: left;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.1s;
  }
  .ctx-item:hover {
    background: rgba(255,255,255,0.1);
  }
  .ctx-icon {
    font-size: 14px;
    width: 20px;
    text-align: center;
    flex-shrink: 0;
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
