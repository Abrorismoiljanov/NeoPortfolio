<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { viewerFile } from '../stores/viewer.js';

  let { windowId } = $props();
  let t = $derived(themes[$currentTheme]);

  let file = $state(null);
  let playing = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);
  let volume = $state(0.8);
  let muted = $state(false);
  let seeking = $state(false);
  let adjustingVolume = $state(false);
  let volumeHover = $state(false);

  viewerFile.subscribe(v => { if (v?.type === 'video') file = v; });

  function formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function togglePlay() { playing = !playing; }
  function toggleMute() { muted = !muted; }

  function pctFromEvent(e, el) {
    const rect = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }

  let progressEl;
  let volumeEl;

  function startSeek(e) {
    if (!duration) return;
    seeking = true;
    const pct = pctFromEvent(e, progressEl);
    currentTime = pct * duration;
    e.preventDefault();

    function onMove(ev) {
      const p = pctFromEvent(ev, progressEl);
      currentTime = p * duration;
    }
    function onUp() {
      seeking = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function startVolumeAdjust(e) {
    adjustingVolume = true;
    const pct = pctFromEvent(e, volumeEl);
    volume = pct;
    muted = false;
    e.preventDefault();

    function onMove(ev) {
      volume = pctFromEvent(ev, volumeEl);
      muted = false;
    }
    function onUp() {
      adjustingVolume = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  let videoEl;

  function onLoadedMetadata(e) {
    duration = e.target.duration;
  }

  function onTimeUpdate(e) {
    if (!seeking) currentTime = e.target.currentTime;
  }

  $effect(() => {
    if (videoEl) {
      if (playing) videoEl.play().catch(() => {});
      else videoEl.pause();
    }
  });

  $effect(() => {
    if (videoEl) videoEl.volume = muted ? 0 : volume;
  });

  $effect(() => {
    if (videoEl && seeking) videoEl.currentTime = currentTime;
  });
</script>

<div class="player" style="--bg: {t.bg}; --bg-dark: {t.bgDark}; --fg: {t.fg}; --fg-dim: {t.fgDim}; --border: {t.border}; --accent: {t.accent};">
  <div class="video-area" style="background: {t.bgDark};">
    {#if file?.url}
      <video
        bind:this={videoEl}
        src={file.url}
        {muted}
        onloadedmetadata={onLoadedMetadata}
        ontimeupdate={onTimeUpdate}
        onended={() => playing = false}
        style="max-width: 100%; max-height: 100%; object-fit: contain;"
      ></video>
    {:else if file}
      <div class="placeholder-video" style="color: {t.fgDim}; border-color: {t.border};">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <span class="video-title">{file.name}</span>
        <span class="video-path" style="color: {t.fgDim};">{file.path}</span>
      </div>
    {:else}
      <div class="empty" style="color: {t.fgDim};">No video selected</div>
    {/if}
  </div>

  <div class="controls" style="border-color: {t.border}; background: {t.bg};">
    <button class="ctrl-btn" onmousedown={togglePlay} title={playing ? 'Pause' : 'Play'}>
      {#if playing}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
      {:else}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      {/if}
    </button>

    <span class="time" style="color: {t.fgDim};">{formatTime(currentTime)}</span>

    <div class="progress-track" bind:this={progressEl} onmousedown={startSeek}>
      <div class="progress-fill" style="width: {duration ? (currentTime / duration) * 100 : 0}%; background: {t.accent};"></div>
    </div>

    <span class="time" style="color: {t.fgDim};">{formatTime(duration)}</span>

    <button class="ctrl-btn" onmousedown={toggleMute} title={muted ? 'Unmute' : 'Mute'}>
      {#if muted}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
      {:else}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      {/if}
    </button>

    <div class="volume-wrap" onmouseenter={() => volumeHover = true} onmouseleave={() => volumeHover = false}>
      <div class="volume-track" bind:this={volumeEl} onmousedown={startVolumeAdjust}>
        <div class="volume-fill" style="width: {volume * 100}%; background: {t.fgDim};"></div>
      </div>
    </div>
  </div>

  <div class="statusbar" style="border-color: {t.border};">
    <span style="color: {t.fgDim};">{file?.name || '—'}</span>
    {#if file}
      <span style="color: {t.fgDim};">{file.path}</span>
    {/if}
  </div>
</div>

<style>
  .player {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg);
    color: var(--fg);
    font-family: 'Inter', system-ui, sans-serif;
  }

  .video-area {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 0;
  }

  .placeholder-video {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    font-size: 14px;
  }

  .video-title {
    font-weight: 600;
    font-size: 15px;
    color: var(--fg);
  }

  .video-path {
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
  }

  .video-hint {
    font-size: 11px;
    opacity: 0.6;
    margin-top: 4px;
  }

  .empty {
    font-style: italic;
  }

  .controls {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-top: 1px solid var(--border);
  }

  .ctrl-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    color: var(--fg);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }
  .ctrl-btn:hover { background: rgba(255,255,255,0.1); }

  .time {
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    min-width: 32px;
    text-align: center;
    flex-shrink: 0;
  }

  .progress-track {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: height 0.15s ease;
  }
  .progress-track:hover { height: 8px; }
  .progress-fill {
    height: 100%;
    border-radius: 3px;
  }

  .volume-wrap {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }

  .volume-track {
    width: 70px;
    height: 4px;
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: height 0.15s ease, width 0.15s ease;
  }
  .volume-track:hover { height: 6px; }
  .volume-fill {
    height: 100%;
    border-radius: 2px;
  }

  .statusbar {
    display: flex;
    justify-content: space-between;
    padding: 4px 10px;
    border-top: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
    font-size: 11px;
  }
</style>
