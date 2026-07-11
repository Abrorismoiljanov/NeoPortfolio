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
    { id: 'sysmon', title: 'System Monitor', icon: '\u25A3', component: SystemMonitor, color: () => t.green }
  ];

  function loadIconOrder() {
    try {
      const saved = localStorage.getItem('os-icon-order');
      if (saved) {
        const order = JSON.parse(saved);
        const ordered = [];
        for (const id of order) {
          const app = allApps.find(a => a.id === id);
          if (app) ordered.push(app);
        }
        for (const app of allApps) {
          if (!ordered.find(a => a.id === app.id)) ordered.push(app);
        }
        return ordered;
      }
    } catch {}
    return [...allApps];
  }

  let desktopApps = $state(loadIconOrder());

  function saveIconOrder() {
    localStorage.setItem('os-icon-order', JSON.stringify(desktopApps.map(a => a.id)));
  }

  let dragIdx = $state(null);
  let dragOverIdx = $state(null);
  let isDragging = $state(false);
  let dragStartX = 0;
  let dragStartY = 0;

  function onIconMouseDown(e, idx) {
    if (e.button !== 0) return;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragIdx = idx;

    function onMove(ev) {
      const dx = ev.clientX - dragStartX;
      const dy = ev.clientY - dragStartY;
      if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isDragging = true;
      }
      if (!isDragging) return;

      const iconEls = document.querySelectorAll('.desktop-icon');
      let closestIdx = null;
      let closestDist = Infinity;
      iconEls.forEach((el, i) => {
        if (i === dragIdx) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(ev.clientX - cx, ev.clientY - cy);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      });
      dragOverIdx = closestIdx;
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);

      if (isDragging && dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
        const apps = [...desktopApps];
        const [moved] = apps.splice(dragIdx, 1);
        apps.splice(dragOverIdx, 0, moved);
        desktopApps = apps;
        saveIconOrder();
      }
      dragIdx = null;
      dragOverIdx = null;
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
      sysmon: { width: 600, height: 480 }
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
    {#each desktopApps as app, idx (app.id)}
      <button
        class="desktop-icon"
        class:dragging={dragIdx === idx && isDragging}
        class:dragover={dragOverIdx === idx && isDragging}
        onmousedown={(e) => onIconMouseDown(e, idx)}
        ondblclick={() => { if (!isDragging) openApp(app); }}
        tabindex="-1"
      >
        <div class="icon-glyph" style="color: {app.color()};">{app.icon}</div>
        <span class="icon-label">{app.title}</span>
      </button>
    {/each}
  </div>

  {#if contextMenu}
    <div
      class="context-menu"
      style="left: {contextMenu.x}px; top: {contextMenu.y}px; background: {t.bgDark}; border-color: {t.border}; color: {t.fg};"
    >
      <button class="ctx-item" onmousedown={() => { openApp(desktopApps[0]); closeContextMenu(); }}>Open Terminal</button>
      <button class="ctx-item" onmousedown={() => { openApp(desktopApps[1]); closeContextMenu(); }}>Open Files</button>
      <button class="ctx-item" onmousedown={() => { openApp(desktopApps[5]); closeContextMenu(); }}>System Monitor</button>
      <div class="ctx-sep" style="border-color: {t.border};"></div>
      <button class="ctx-item" onmousedown={() => { openApp(desktopApps[4]); closeContextMenu(); }}>Settings</button>
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
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 8px;
    padding: 16px;
    height: 100%;
    align-content: flex-start;
    align-items: flex-start;
  }

  .desktop-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80px;
    padding: 8px 4px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: grab;
    transition: background 0.15s, transform 0.15s, opacity 0.15s;
    gap: 4px;
    user-select: none;
  }
  .desktop-icon:hover {
    background: rgba(255,255,255,0.08);
  }
  .desktop-icon:active {
    transform: scale(0.95);
  }
  .desktop-icon.dragging {
    opacity: 0.3;
    transform: scale(0.9);
  }
  .desktop-icon.dragover {
    background: rgba(255,255,255,0.15);
    box-shadow: inset 0 0 0 2px rgba(255,255,255,0.3);
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
