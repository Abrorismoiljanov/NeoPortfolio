<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';

  let t = $derived(themes[$currentTheme]);
  let selectedTheme = $state($currentTheme);
  let currentWallpaper = $state('gradient');
  let customImage = $state(null);
  let fileInput;

  $effect(() => {
    selectedTheme = $currentTheme;
  });

  $effect(() => {
    const saved = localStorage.getItem('os-wallpaper');
    if (saved) currentWallpaper = saved;
    const img = localStorage.getItem('os-wallpaper-image');
    if (img) customImage = img;
  });

  function setTheme(name) {
    currentTheme.set(name);
    selectedTheme = name;
  }

  function setWallpaper(name) {
    currentWallpaper = name;
    localStorage.setItem('os-wallpaper', name);
    window.dispatchEvent(new CustomEvent('wallpaper-change', { detail: { type: name } }));
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;

    const img = new Image();
    img.onload = () => {
      const maxW = 1920;
      const maxH = 1080;
      let w = img.width;
      let h = img.height;
      if (w > maxW) { h = h * (maxW / w); w = maxW; }
      if (h > maxH) { w = w * (maxH / h); h = maxH; }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);

      customImage = dataUrl;
      try {
        localStorage.setItem('os-wallpaper-image', dataUrl);
      } catch (err) {
        console.warn('Wallpaper too large for localStorage:', err);
      }
      currentWallpaper = 'custom';
      localStorage.setItem('os-wallpaper', 'custom');
      window.dispatchEvent(new CustomEvent('wallpaper-change', { detail: { type: 'custom', image: dataUrl } }));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  }

  function removeCustomWallpaper() {
    customImage = null;
    localStorage.removeItem('os-wallpaper-image');
    setWallpaper('gradient');
  }

  const paletteNames = Object.keys(themes);

  const wallpaperList = [
    { id: 'gradient', name: 'Gradient', preview: (t) => t.wallpaper },
    { id: 'solid', name: 'Solid Dark', preview: (t) => t.bgDark },
    { id: 'mesh', name: 'Mesh', preview: (t) => `radial-gradient(ellipse at 20% 50%, ${t.accent}30 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, ${t.blue}25 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, ${t.purple}20 0%, transparent 50%), ${t.bgDark}` },
    { id: 'dots', name: 'Dots', preview: (t) => `radial-gradient(circle at 50% 50%, ${t.bgLight} 1px, transparent 1px) 0 0 / 24px 24px, ${t.bgDark}` },
    { id: 'stripes', name: 'Diagonal Stripes', preview: (t) => `repeating-linear-gradient(45deg, transparent, transparent 10px, ${t.bgLight}10 10px, ${t.bgLight}10 20px), ${t.bgDark}` },
  ];
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<input bind:this={fileInput} type="file" accept="image/*" class="hidden-file-input" onchange={handleFileSelect} />

<div class="settings" style="--bg: {t.bg}; --bg-dark: {t.bgDark}; --bg-light: {t.bgLight}; --fg: {t.fg}; --fg-dim: {t.fgDim}; --border: {t.border}; --accent: {t.accent};">
  <div class="settings-header">
    <h2 style="color: {t.fg};">Settings</h2>
  </div>

  <div class="section">
    <h3 style="color: {t.accent};">Appearance</h3>
    <p class="section-desc" style="color: {t.fgDim};">Choose a color palette for the desktop environment.</p>

    <div class="palette-grid">
      {#each paletteNames as name}
        {@const theme = themes[name]}
        <button
          class="palette-card"
          class:active={selectedTheme === name}
          style="background: {theme.bg}; border-color: {selectedTheme === name ? theme.accent : theme.border};"
          onmousedown={() => setTheme(name)}
        >
          <div class="palette-preview">
            <div class="preview-bar" style="background: {theme.titleBg};"></div>
            <div class="preview-surface" style="background: {theme.bgLight};">
              <div class="preview-accent" style="background: {theme.accent};"></div>
            </div>
          </div>
          <div class="palette-info">
            <span class="palette-name" style="color: {theme.fg};">{theme.name}</span>
            <div class="color-dots">
              <span class="dot" style="background: {theme.red};"></span>
              <span class="dot" style="background: {theme.green};"></span>
              <span class="dot" style="background: {theme.blue};"></span>
              <span class="dot" style="background: {theme.purple};"></span>
              <span class="dot" style="background: {theme.orange};"></span>
              <span class="dot" style="background: {theme.aqua};"></span>
            </div>
          </div>
          {#if selectedTheme === name}
            <div class="active-indicator" style="background: {theme.accent};">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>
            </div>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <div class="section">
    <h3 style="color: {t.accent};">Wallpaper</h3>
    <p class="section-desc" style="color: {t.fgDim};">Pick a background or upload your own image.</p>

    <div class="wallpaper-grid">
      {#if customImage}
        <button
          class="wallpaper-card"
          class:active={currentWallpaper === 'custom'}
          style="border-color: {currentWallpaper === 'custom' ? t.accent : t.border};"
          onmousedown={() => {
            currentWallpaper = 'custom';
            localStorage.setItem('os-wallpaper', 'custom');
            window.dispatchEvent(new CustomEvent('wallpaper-change', { detail: { type: 'custom', image: customImage } }));
          }}
        >
          <div class="wallpaper-preview" style="background: url({customImage}) center/cover no-repeat;"></div>
          <span class="wallpaper-name" style="color: {t.fg};">My Image</span>
          {#if currentWallpaper === 'custom'}
            <span class="wallpaper-check" style="color: {t.accent};">&#10003;</span>
          {/if}
        </button>
      {/if}

      <button
        class="wallpaper-card upload-card"
        style="border-color: {t.border};"
        onmousedown={() => fileInput.click()}
      >
        <div class="upload-preview" style="background: {t.bgDark}; border-color: {t.border};">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="{t.fgDim}" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
        <span class="wallpaper-name" style="color: {t.fgDim};">Upload Image</span>
      </button>

      {#each wallpaperList as wp}
        <button
          class="wallpaper-card"
          class:active={currentWallpaper === wp.id}
          style="border-color: {currentWallpaper === wp.id ? t.accent : t.border};"
          onmousedown={() => setWallpaper(wp.id)}
        >
          <div class="wallpaper-preview" style="background: {wp.preview(t)};"></div>
          <span class="wallpaper-name" style="color: {t.fg};">{wp.name}</span>
          {#if currentWallpaper === wp.id}
            <span class="wallpaper-check" style="color: {t.accent};">&#10003;</span>
          {/if}
        </button>
      {/each}
    </div>

    {#if customImage && currentWallpaper === 'custom'}
      <button class="remove-btn" style="color: {t.red}; border-color: {t.red}40; margin-top: 8px;" onmousedown={removeCustomWallpaper}>
        Remove Custom Wallpaper
      </button>
    {/if}
  </div>

  <div class="section">
    <h3 style="color: {t.accent};">About</h3>
    <div class="info-row" style="border-color: {t.border};">
      <span style="color: {t.fgDim};">Desktop Environment</span>
      <span style="color: {t.fg};">WebOS KDE</span>
    </div>
    <div class="info-row" style="border-color: {t.border};">
      <span style="color: {t.fgDim};">Framework</span>
      <span style="color: {t.fg};">Svelte 5 + SvelteKit</span>
    </div>
    <div class="info-row" style="border-color: {t.border};">
      <span style="color: {t.fgDim};">Current Theme</span>
      <span style="color: {t.fg};">{t.name}</span>
    </div>
  </div>
</div>

<style>
  .hidden-file-input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    width: 0;
    height: 0;
  }

  .settings {
    height: 100%;
    padding: 20px;
    overflow-y: auto;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .settings-header h2 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px;
  }

  .section {
    margin-bottom: 24px;
  }

  .section h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px;
  }

  .section-desc {
    font-size: 12px;
    margin: 0 0 12px;
  }

  .palette-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .palette-card {
    position: relative;
    border: 2px solid;
    border-radius: 8px;
    padding: 0;
    cursor: pointer;
    overflow: hidden;
    text-align: left;
    transition: border-color 0.2s, transform 0.1s;
  }
  .palette-card:hover { transform: scale(1.02); }
  .palette-card:active { transform: scale(0.98); }

  .palette-preview {
    height: 48px;
    overflow: hidden;
  }

  .preview-bar { height: 14px; }
  .preview-surface {
    height: 34px;
    display: flex;
    align-items: flex-end;
    padding: 6px;
  }
  .preview-accent {
    width: 24px;
    height: 6px;
    border-radius: 3px;
  }

  .palette-info { padding: 8px 10px; }
  .palette-name { font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px; }
  .color-dots { display: flex; gap: 3px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; }

  .active-indicator {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .wallpaper-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }

  .wallpaper-card {
    border: 2px solid;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    background: transparent;
    text-align: left;
    transition: border-color 0.2s, transform 0.1s;
  }
  .wallpaper-card:hover { transform: scale(1.05); }
  .wallpaper-card:active { transform: scale(0.95); }

  .wallpaper-preview {
    height: 48px;
    border-radius: 0 0 4px 4px;
  }

  .wallpaper-name {
    display: block;
    font-size: 10px;
    padding: 4px 6px;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .wallpaper-check {
    display: block;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
  }

  .upload-card { cursor: pointer; }
  .upload-preview {
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px dashed;
    border-radius: 0 0 4px 4px;
  }

  .remove-btn {
    display: inline-block;
    padding: 6px 12px;
    border: 1px solid;
    border-radius: 6px;
    background: transparent;
    font-size: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.12s;
  }
  .remove-btn:hover { opacity: 0.8; transform: translateY(-1px); }

  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid;
    font-size: 13px;
    transition: background 0.12s;
  }
</style>
