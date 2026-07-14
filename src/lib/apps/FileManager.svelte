<script>
  import { base } from '$app/paths';
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { openWindow } from '../stores/windows.js';
  import { viewerFile } from '../stores/viewer.js';
  import ImageViewer from './ImageViewer.svelte';
  import VideoPlayer from './VideoPlayer.svelte';

  let t = $derived(themes[$currentTheme]);

  const icons = {
    folder: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    file: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    image: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    music: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    video: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
    gear: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    archive: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`,
  };

  let fileSystem = $state({
    '/': [
      { name: 'Desktop', type: 'folder', icon: 'folder' },
      { name: 'Documents', type: 'folder', icon: 'folder' },
      { name: 'Downloads', type: 'folder', icon: 'folder' },
      { name: 'Music', type: 'folder', icon: 'folder' },
      { name: 'Pictures', type: 'folder', icon: 'folder' },
      { name: 'Videos', type: 'folder', icon: 'folder' },
    ],
    '/Desktop': [
      { name: 'notes.txt', type: 'file', icon: 'file' },
      { name: 'screenshot.png', type: 'file', icon: 'image' },
    ],
    '/Documents': [
      { name: 'resume.pdf', type: 'file', icon: 'file' },
      { name: 'budget.ods', type: 'file', icon: 'file' },
      { name: 'journal.txt', type: 'file', icon: 'file' },
      { name: 'Work', type: 'folder', icon: 'folder' },
    ],
    '/Documents/Work': [
      { name: 'report.pdf', type: 'file', icon: 'file' },
      { name: 'presentation.odp', type: 'file', icon: 'file' },
      { name: 'notes.md', type: 'file', icon: 'file' },
    ],
    '/Downloads': [
      { name: 'installer.run', type: 'file', icon: 'gear' },
      { name: 'archive.tar.gz', type: 'file', icon: 'archive' },
      { name: 'wallpaper.jpg', type: 'file', icon: 'image' },
    ],
    '/Music': [
      { name: 'playlist.m3u', type: 'file', icon: 'music' },
      { name: 'song1.mp3', type: 'file', icon: 'music' },
      { name: 'song2.flac', type: 'file', icon: 'music' },
    ],
    '/Pictures': [
      { name: 'Photos', type: 'folder', icon: 'folder' },
      { name: 'Wallpapers', type: 'folder', icon: 'folder' },
      { name: 'pfp.jpg', type: 'file', icon: 'image', url: `${base}/Pictures/pfp.jpg` },
      { name: 'konata.jpg', type: 'file', icon: 'image', url: `${base}/Pictures/konata.jpg` },
      { name: 'Eblan.jpg', type: 'file', icon: 'image', url: `${base}/Pictures/Eblan.jpg` },
    ],
    '/Pictures/Photos': [
      { name: 'photo_2026-04-29_22-53-27.jpg', type: 'file', icon: 'image', url: `${base}/Pictures/Photos/photo_2026-04-29_22-53-27.jpg` },
      { name: 'photo_2026-05-01_18-29-05.jpg', type: 'file', icon: 'image', url: `${base}/Pictures/Photos/photo_2026-05-01_18-29-05.jpg` },
    ],
    '/Pictures/Wallpapers': [
      { name: 'eva_smoothed_gruvbox.png', type: 'file', icon: 'image', url: `${base}/Pictures/Wallpapers/eva_smoothed_gruvbox.png` },
      { name: 'lain_upscayl_4x_digital-art-4x.png', type: 'file', icon: 'image', url: `${base}/Pictures/Wallpapers/lain_upscayl_4x_digital-art-4x.png` },
      { name: 'mint_upscayl_4x_digital-art-4x.png', type: 'file', icon: 'image', url: `${base}/Pictures/Wallpapers/mint_upscayl_4x_digital-art-4x.png` },
      { name: 'wallhaven-9o8k9w.jpg', type: 'file', icon: 'image', url: `${base}/Pictures/Wallpapers/wallhaven-9o8k9w.jpg` },
      { name: 'wallhaven-vpdxqp.png', type: 'file', icon: 'image', url: `${base}/Pictures/Wallpapers/wallhaven-vpdxqp.png` },
      { name: 'wallhaven-yqg2og.jpg', type: 'file', icon: 'image', url: `${base}/Pictures/Wallpapers/wallhaven-yqg2og.jpg` },
    ],
    '/Videos': [
      { name: 'untitled.mp4', type: 'file', icon: 'video', url: `${base}/Videos/untitled.mp4` },
    ],
  });

  let currentPath = $state('/');
  let selected = $state(null);
  let viewMode = $state('list');
  let searchQuery = $state('');
  let contextMenu = $state(null);
  let renaming = $state(null);
  let renameValue = $state('');
  let creating = $state(null);
  let createValue = $state('');

  const pathParts = $derived(currentPath.split('/').filter(Boolean));

  const items = $derived.by(() => {
    const list = fileSystem[currentPath] || [];
    if (!searchQuery) return list;
    return list.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  function navigate(name) {
    const item = fileSystem[currentPath]?.find(f => f.name === name);
    if (item?.type === 'folder') {
      currentPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
      selected = null;
      searchQuery = '';
    }
  }

  function goUp() {
    if (pathParts.length > 0) {
      pathParts.pop();
      currentPath = '/' + pathParts.join('/');
      selected = null;
      searchQuery = '';
    }
  }

  function goTo(path) {
    currentPath = path;
    selected = null;
    searchQuery = '';
  }

  function getIcon(name) {
    const ext = name.split('.').pop().toLowerCase();
    const map = { png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image', mp3: 'music', flac: 'music', wav: 'music', ogg: 'music', m3u: 'music', mp4: 'video', webm: 'video', mkv: 'video', avi: 'video', run: 'gear', json: 'gear', conf: 'gear', tar: 'archive', gz: 'archive', zip: 'archive' };
    return map[ext] || 'file';
  }

  function getFileType(name) {
    const ext = name.split('.').pop().toLowerCase();
    if (['png','jpg','jpeg','gif','svg','webp','bmp','ico'].includes(ext)) return 'image';
    if (['mp4','webm','mkv','avi','mov','flv'].includes(ext)) return 'video';
    if (['mp3','flac','wav','ogg','m4a','aac'].includes(ext)) return 'audio';
    return 'file';
  }

  function openFile(item) {
    const type = getFileType(item.name);
    const path = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
    const fileInfo = { name: item.name, path, type, url: item.url || null };

    if (type === 'image') {
      viewerFile.set(fileInfo);
      openWindow('image-viewer', `Image — ${item.name}`, ImageViewer, { icon: '\uD83D\uDDBC', iconColor: t.blue });
    } else if (type === 'video') {
      viewerFile.set(fileInfo);
      openWindow('video-player', `Video — ${item.name}`, VideoPlayer, { icon: '\u25B6', iconColor: t.red });
    }
  }

  const selectedFile = $derived(() => {
    if (!selected) return null;
    const item = fileSystem[currentPath]?.find(f => f.name === selected);
    if (!item || item.type === 'folder') return null;
    return { ...item, type: getFileType(item.name), path: currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`, url: item.url || null };
  });

  function startRename(name) {
    renaming = name;
    renameValue = name;
    contextMenu = null;
  }

  function confirmRename(oldName) {
    if (!renameValue || renameValue === oldName) { renaming = null; return; }
    const list = fileSystem[currentPath];
    const item = list.find(f => f.name === oldName);
    if (!item) { renaming = null; return; }
    item.name = renameValue;
    if (item.type === 'folder') {
      const oldPath = currentPath === '/' ? `/${oldName}` : `${currentPath}/${oldName}`;
      const newPath = currentPath === '/' ? `/${renameValue}` : `${currentPath}/${renameValue}`;
      if (fileSystem[oldPath]) {
        fileSystem[newPath] = fileSystem[oldPath];
        delete fileSystem[oldPath];
      }
    }
    fileSystem = { ...fileSystem };
    renaming = null;
    selected = renameValue;
  }

  function cancelRename() { renaming = null; }

  function deleteItem(name) {
    const list = fileSystem[currentPath];
    const idx = list.findIndex(f => f.name === name);
    if (idx === -1) return;
    if (list[idx].type === 'folder') {
      const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
      delete fileSystem[path];
    }
    list.splice(idx, 1);
    fileSystem = { ...fileSystem };
    if (selected === name) selected = null;
    contextMenu = null;
  }

  function createItem(type) {
    const name = createValue.trim();
    if (!name) { creating = null; return; }
    const list = fileSystem[currentPath] || [];
    if (list.some(f => f.name === name)) { creating = null; return; }
    const icon = type === 'folder' ? 'folder' : getIcon(name);
    list.push({ name, type, icon });
    fileSystem = { ...fileSystem };
    if (type === 'folder') {
      const path = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
      fileSystem[path] = [];
    }
    creating = null;
    createValue = '';
    selected = name;
  }

  function onContext(e, itemName) {
    e.preventDefault();
    e.stopPropagation();
    selected = itemName;
    contextMenu = { x: e.clientX, y: e.clientY, item: itemName };
  }

  function onBgContext(e) {
    if (e.target.closest('.file-item')) return;
    e.preventDefault();
    contextMenu = { x: e.clientX, y: e.clientY, item: null };
  }

  function closeContext() { contextMenu = null; }

  function portal(node) {
    document.body.appendChild(node);
    return { destroy() { node.remove(); } };
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      if (renaming) cancelRename();
      if (creating) { creating = null; createValue = ''; }
      closeContext();
    }
    if ((e.key === 'Delete' || e.key === 'Backspace') && selected && !renaming && !creating) {
      deleteItem(selected);
    }
  }
</script>

<svelte:window onkeydown={onKeyDown} onmousedown={closeContext} />

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="file-manager"
  style="--bg: {t.bg}; --bg-dark: {t.bgDark}; --bg-light: {t.bgLight}; --fg: {t.fg}; --fg-dim: {t.fgDim}; --border: {t.border}; --accent: {t.blue}; --hover: {t.hoverBg};"
  oncontextmenu={onBgContext}
>
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
    <div class="toolbar-spacer"></div>
    <div class="search-box" style="background: {t.inputBg}; border-color: {t.border}; color: {t.inputFg};">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        type="text"
        placeholder="Search..."
        bind:value={searchQuery}
        style="color: {t.inputFg};"
      />
    </div>
    <button class="nav-btn" onmousedown={() => viewMode = viewMode === 'list' ? 'grid' : 'list'} aria-label="Toggle view">
      {#if viewMode === 'list'}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      {/if}
    </button>
  </div>

  <div class="file-list" class:grid={viewMode === 'grid'}>
    {#each items as item (item.name)}
      {#if renaming === item.name}
        <div class="file-item" class:selected={true}>
          <span class="file-icon">{@html icons[item.icon]}</span>
          <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
          <input
            class="rename-input"
            type="text"
            bind:value={renameValue}
            onblur={() => confirmRename(item.name)}
            onkeydown={(e) => { e.stopPropagation(); if (e.key === 'Enter') confirmRename(item.name); if (e.key === 'Escape') cancelRename(); }}
              onmousedown={(e) => e.stopPropagation()}
          />
        </div>
      {:else}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <button
          class="file-item"
          class:selected={selected === item.name}
          class:folder={item.type === 'folder'}
          onmousedown={() => selected = item.name}
          ondblclick={() => { if (item.type === 'folder') navigate(item.name); else openFile(item); }}
          oncontextmenu={(e) => onContext(e, item.name)}
        >
          <span class="file-icon">{@html icons[item.icon]}</span>
          <span class="file-name">{item.name}</span>
        </button>
      {/if}
    {/each}
    {#if creating}
      <div class="file-item creating">
        <span class="file-icon">{@html icons[creating === 'folder' ? 'folder' : 'file']}</span>
        <input
          class="rename-input"
          type="text"
          placeholder={creating === 'folder' ? 'New folder' : 'New file'}
          bind:value={createValue}
          onblur={() => createItem(creating)}
          onkeydown={(e) => { e.stopPropagation(); if (e.key === 'Enter') createItem(creating); if (e.key === 'Escape') { creating = null; createValue = ''; } }}
        />
      </div>
    {/if}
    {#if items.length === 0 && !creating}
      <div class="empty" style="color: {t.fgDim};">Empty folder</div>
    {/if}
  </div>

  {#if selectedFile()?.type === 'image' || selectedFile()?.type === 'video'}
    <div class="preview-panel" style="border-color: {t.border}; background: {t.bgLight};">
      <div class="preview-content" style="color: {t.fgDim};">
        {#if selectedFile()?.url && selectedFile()?.type === 'video'}
          <video src={selectedFile().url} class="preview-thumb" muted preload="metadata" onloadeddata={(e) => e.target.currentTime = 1}></video>
        {:else if selectedFile()?.url && selectedFile()?.type === 'image'}
          <img src={selectedFile().url} alt={selectedFile()?.name} class="preview-thumb" />
        {:else if selectedFile()?.type === 'image'}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        {:else}
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        {/if}
        <div class="preview-info">
          <span class="preview-name" style="color: {t.fg};">{selectedFile()?.name}</span>
          <span class="preview-path">{selectedFile()?.path}</span>
        </div>
        <button class="preview-open" style="background: {t.blue}; color: white;" onmousedown={() => { const f = selectedFile(); if (f) openFile(f); }}>
          Open
        </button>
      </div>
    </div>
  {/if}

  <div class="statusbar">
    <span style="color: {t.fgDim};">{items.length} items</span>
    <span style="color: {t.fgDim};">{currentPath}</span>
  </div>
</div>

{#if contextMenu}
  <div class="ctx-menu" use:portal style="left: {contextMenu.x}px; top: {contextMenu.y}px; background: {t.bgDark}ee; border-color: {t.border}; color: {t.fg}; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);">
    {#if contextMenu.item}
      {#if fileSystem[currentPath]?.find(f => f.name === contextMenu.item && f.type !== 'folder')}
        <button class="ctx-item" onmousedown={() => { const item = fileSystem[currentPath].find(f => f.name === contextMenu.item); if (item) openFile(item); closeContext(); }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          Open
        </button>
      {/if}
      <button class="ctx-item" onmousedown={() => startRename(contextMenu.item)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        Rename
      </button>
      <button class="ctx-item" onmousedown={() => deleteItem(contextMenu.item)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        Delete
      </button>
      <div class="ctx-sep" style="border-color: {t.border};"></div>
    {/if}
    <button class="ctx-item" onmousedown={() => { creating = 'folder'; contextMenu = null; }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
      New Folder
    </button>
    <button class="ctx-item" onmousedown={() => { creating = 'file'; contextMenu = null; }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
      New File
    </button>
  </div>
{/if}

<style>
  .file-manager {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: transparent;
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
    background: rgba(255,255,255,0.04);
  }
  .toolbar-spacer { flex: 1; }

  .search-box {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border: 1px solid;
    border-radius: 4px;
    font-size: 12px;
  }
  .search-box input {
    border: none;
    background: transparent;
    font-size: 12px;
    width: 100px;
    font-family: inherit;
  }
  .search-box input:focus { outline: none; }

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
  .file-list.grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    align-content: start;
    gap: 4px;
    padding: 8px;
  }
  .file-list.grid .file-item {
    flex-direction: column;
    justify-content: center;
    padding: 10px 6px;
    text-align: center;
    gap: 4px;
    border-radius: 6px;
  }
  .file-list.grid .file-icon { width: auto; font-size: 24px; }
  .file-list.grid .file-name { font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; }

  .file-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 5px 12px;
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

  .file-icon { width: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .file-name { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .rename-input {
    flex: 1;
    border: 1px solid var(--accent);
    background: var(--bg-dark);
    color: var(--fg);
    font-family: inherit;
    font-size: 13px;
    padding: 2px 6px;
    border-radius: 3px;
    outline: none;
  }

  .empty {
    padding: 32px;
    text-align: center;
    font-style: italic;
  }

  .preview-panel {
    border-top: 1px solid var(--border);
    padding: 10px 14px;
  }

  .preview-content {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
  }

  .preview-thumb {
    width: 40px;
    height: 40px;
    border-radius: 6px;
    object-fit: cover;
    flex-shrink: 0;
    border: 1px solid var(--border);
  }

  .preview-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }

  .preview-name {
    font-weight: 600;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-path {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    opacity: 0.6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .preview-open {
    padding: 5px 14px;
    border: none;
    border-radius: 5px;
    font-size: 12px;
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
    cursor: pointer;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }
  .preview-open:hover { opacity: 0.85; }

  .statusbar {
    display: flex;
    justify-content: space-between;
    padding: 6px 12px;
    border-top: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    font-size: 11px;
  }

  .ctx-menu {
    position: fixed;
    min-width: 160px;
    border-radius: 8px;
    border: 1px solid;
    box-shadow: 0 4px 24px rgba(0,0,0,0.4);
    padding: 4px;
    z-index: 99999;
    animation: menuPop 0.1s ease;
  }
  .ctx-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    border: none;
    background: transparent;
    color: inherit;
    font-size: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    text-align: left;
    border-radius: 4px;
    cursor: pointer;
  }
  .ctx-item:hover { background: rgba(255,255,255,0.1); }
  .ctx-sep { height: 1px; border-top: 1px solid; margin: 3px 8px; }

  @keyframes menuPop {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
</style>
