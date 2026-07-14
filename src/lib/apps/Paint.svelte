<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { onMount, onDestroy } from 'svelte';

  let t = $derived(themes[$currentTheme]);

  let canvas;
  let ctx;
  let wrap;
  let cursorCanvas;
  let cursorCtx;
  let tool = $state('pen');
  let color = $state('#000000');
  let brushSize = $state(4);
  let isDrawing = $state(false);
  let lastX = 0;
  let lastY = 0;
  let history = $state([]);
  let historyIndex = $state(-1);
  let mouseX = $state(0);
  let mouseY = $state(0);
  let showCursor = $state(false);
  let cursorX = $state(0);
  let cursorY = $state(0);
  let paintEl;

  const CANVAS_W = 1200;
  const CANVAS_H = 800;
  const BG = '#ffffff';

  let zoom = $state(1);
  let panX = $state(0);
  let panY = $state(0);
  let isPanning = $state(false);
  let panStartX = 0;
  let panStartY = 0;

  const toolDefs = [
    { id: 'pen', label: 'Pen', key: 'P' },
    { id: 'brush', label: 'Brush', key: 'B' },
    { id: 'eraser', label: 'Eraser', key: 'E' },
    { id: 'fill', label: 'Fill', key: 'G' },
    { id: 'line', label: 'Line', key: 'L' },
    { id: 'rect', label: 'Rectangle', key: 'R' },
    { id: 'circle', label: 'Ellipse', key: 'O' },
  ];

  const presetColors = [
    '#000000', '#434343', '#666666', '#999999', '#ffffff',
    '#ff0000', '#ff5555', '#ff79c6', '#bd93f9', '#6272a4',
    '#8be9fd', '#50fa7b', '#f1fa8c', '#ffb86c', '#ff00ff',
  ];

  let startShapeX = 0;
  let startShapeY = 0;
  let snapshot;
  let isResizingBrush = $state(false);
  let resizeStartX = 0;
  let resizeStartBrush = 4;
  let cursorAnimFrame;

  function fitToView() {
    if (!wrap) return;
    const ww = wrap.clientWidth;
    const wh = wrap.clientHeight;
    if (!ww || !wh) return;
    const pad = 40;
    const sx = (ww - pad) / CANVAS_W;
    const sy = (wh - pad) / CANVAS_H;
    zoom = Math.min(sx, sy, 1.5);
    panX = (ww - CANVAS_W * zoom) / 2;
    panY = (wh - CANVAS_H * zoom) / 2;
  }

  function initCanvas() {
    if (!canvas || !ctx) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    fitToView();
  }

  function clearCanvas() {
    if (!ctx) return;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    saveHistory();
  }

  function saveHistory() {
    if (!ctx) return;
    const data = canvas.toDataURL();
    history = history.slice(0, historyIndex + 1);
    history = [...history, data];
    historyIndex = history.length - 1;
    if (history.length > 50) {
      history = history.slice(-50);
      historyIndex = history.length - 1;
    }
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    restoreHistory();
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    restoreHistory();
  }

  function restoreHistory() {
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.drawImage(img, 0, 0);
    };
    img.src = history[historyIndex];
  }

  function screenToCanvas(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * CANVAS_W;
    const y = (e.clientY - rect.top) / rect.height * CANVAS_H;
    return { x, y };
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function floodFill(startX, startY) {
    startX = clamp(Math.round(startX), 0, CANVAS_W - 1);
    startY = clamp(Math.round(startY), 0, CANVAS_H - 1);
    const imageData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
    const data = imageData.data;
    const w = CANVAS_W;
    const idx = (startY * w + startX) * 4;
    const sr = data[idx], sg = data[idx + 1], sb = data[idx + 2], sa = data[idx + 3];

    const tc = document.createElement('canvas').getContext('2d');
    tc.fillStyle = color;
    tc.fillRect(0, 0, 1, 1);
    const fd = tc.getImageData(0, 0, 1, 1).data;
    const fr = fd[0], fg = fd[1], fb = fd[2];
    if (sr === fr && sg === fg && sb === fb && sa === 255) return;

    const stack = [[startX, startY]];
    const visited = new Uint8Array(w * CANVAS_H);
    while (stack.length) {
      const [x, y] = stack.pop();
      const key = y * w + x;
      if (visited[key]) continue;
      if (x < 0 || x >= w || y < 0 || y >= CANVAS_H) continue;
      const i = key * 4;
      if (Math.abs(data[i] - sr) > 32 || Math.abs(data[i + 1] - sg) > 32 || Math.abs(data[i + 2] - sb) > 32 || Math.abs(data[i + 3] - sa) > 32) continue;
      visited[key] = 1;
      data[i] = fr; data[i + 1] = fg; data[i + 2] = fb; data[i + 3] = 255;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(imageData, 0, 0);
  }

  function onDown(e) {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
      e.preventDefault();
      return;
    }
    if (e.button !== 0) return;
    if (e.shiftKey) {
      isResizingBrush = true;
      resizeStartX = e.clientX;
      resizeStartBrush = brushSize;
      e.preventDefault();
      function onResizeUp(ev) {
        isResizingBrush = false;
        window.removeEventListener('mouseup', onResizeUp);
      }
      window.addEventListener('mouseup', onResizeUp);
      return;
    }
    isDrawing = true;
    const { x, y } = screenToCanvas(e);
    lastX = x; lastY = y;

    if (tool === 'fill') {
      floodFill(x, y);
      saveHistory();
      isDrawing = false;
      return;
    }
    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      snapshot = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
      startShapeX = x; startShapeY = y;
      return;
    }

    const lw = tool === 'brush' ? brushSize * 2 : tool === 'eraser' ? brushSize * 3 : brushSize;
    const col = tool === 'eraser' ? BG : color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function onMove(e) {
    if (isPanning) {
      panX = e.clientX - panStartX;
      panY = e.clientY - panStartY;
      return;
    }
    if (isResizingBrush) {
      const dx = e.clientX - resizeStartX;
      brushSize = clamp(Math.round(resizeStartBrush + dx / 3), 1, 64);
      return;
    }

    const paintRect = paintEl.getBoundingClientRect();
    cursorX = e.clientX - paintRect.left;
    cursorY = e.clientY - paintRect.top;
    const { x, y } = screenToCanvas(e);
    mouseX = clamp(Math.round(x), 0, CANVAS_W);
    mouseY = clamp(Math.round(y), 0, CANVAS_H);

    if (!isDrawing) return;

    if (tool === 'line' || tool === 'rect' || tool === 'circle') {
      ctx.putImageData(snapshot, 0, 0);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      if (tool === 'line') {
        ctx.beginPath(); ctx.moveTo(startShapeX, startShapeY); ctx.lineTo(x, y); ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(startShapeX, startShapeY, x - startShapeX, y - startShapeY);
      } else {
        const rx = Math.abs(x - startShapeX) / 2;
        const ry = Math.abs(y - startShapeY) / 2;
        ctx.beginPath();
        ctx.ellipse(startShapeX + (x - startShapeX) / 2, startShapeY + (y - startShapeY) / 2, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }

    const lw = tool === 'brush' ? brushSize * 2 : tool === 'eraser' ? brushSize * 3 : brushSize;
    const col = tool === 'eraser' ? BG : color;
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x; lastY = y;
  }

  function onUp() {
    if (isPanning) { isPanning = false; return; }
    if (isResizingBrush) return;
    if (!isDrawing) return;
    isDrawing = false;
    saveHistory();
  }

  function onWheel(e) {
    e.preventDefault();
    const rect = wrap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const nz = clamp(zoom * factor, 0.1, 5);
    panX = mx - (mx - panX) * (nz / zoom);
    panY = my - (my - panY) * (nz / zoom);
    zoom = nz;
  }

  function handleKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === '0') { e.preventDefault(); fitToView(); return; }
    if (e.ctrlKey || e.metaKey) return;
    const m = { p: 'pen', b: 'brush', e: 'eraser', g: 'fill', l: 'line', r: 'rect', o: 'circle' };
    if (m[e.key]) { tool = m[e.key]; return; }
    if (e.key === '[') brushSize = Math.max(1, brushSize - 1);
    if (e.key === ']') brushSize = Math.min(64, brushSize + 1);
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    if (canvas) { ctx = canvas.getContext('2d'); initCanvas(); saveHistory(); }
  });
  onDestroy(() => { window.removeEventListener('keydown', handleKeydown); });
</script>

<div class="paint" bind:this={paintEl} style="--bg: {t.bg}; --fg: {t.fg}; --border: {t.border}; --bg-light: {t.bgLight}; --accent: {t.accent}; --fg-dim: {t.fgDim};">
  <div class="toolbar">
    <div class="tool-section">
      <span class="section-label" style="color: {t.fgDim};">Tools</span>
      <div class="tool-row">
        {#each toolDefs as td}
          {@const active = tool === td.id}
          <button class="tool-btn" class:active
            style={active ? `background:${t.accent}25;color:${t.accent};box-shadow:inset 0 0 0 1px ${t.accent}40;` : `color:${t.fgDim};`}
            onclick={() => tool = td.id} title="{td.label} ({td.key})">
            {#if td.id === 'pen'}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
            {:else if td.id === 'brush'}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z"/><path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7"/><path d="M14.5 17.5 4.5 15"/></svg>
            {:else if td.id === 'eraser'}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
            {:else if td.id === 'fill'}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z"/><path d="m5 2 5 5"/><path d="M2 13h15"/><path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.8 2-4 .3 1.2 2 2.4 2 4Z"/></svg>
            {:else if td.id === 'line'}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="19" x2="19" y2="5"/></svg>
            {:else if td.id === 'rect'}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            {:else if td.id === 'circle'}<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
            {/if}
          </button>
        {/each}
      </div>
    </div>
    <div class="tool-sep"></div>
    <div class="tool-section">
      <span class="section-label" style="color: {t.fgDim};">Size</span>
      <div class="size-row">
        <input type="range" min="1" max="64" bind:value={brushSize} class="size-slider" />
        <span class="size-val" style="color: {t.fg};">{brushSize}px</span>
      </div>
    </div>
    <div class="tool-sep"></div>
    <div class="tool-section">
      <span class="section-label" style="color: {t.fgDim};">Color</span>
      <div class="color-row">
        <div class="current-color" style="background: {color}; border-color: {t.border};"></div>
        <div class="preset-grid">
          {#each presetColors as c}
            <button class="color-swatch" class:active={color === c} style="background:{c};" onclick={() => color = c}></button>
          {/each}
          <input type="color" bind:value={color} class="color-input" />
        </div>
      </div>
    </div>
    <div class="tool-sep"></div>
    <div class="tool-section">
      <div class="action-row">
        <button class="action-btn" style="color:{t.fgDim};" onclick={undo} title="Undo (Ctrl+Z)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </button>
        <button class="action-btn" style="color:{t.fgDim};" onclick={redo} title="Redo (Ctrl+Y)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
        </button>
        <button class="action-btn" style="color:{t.fgDim};" onclick={fitToView} title="Reset View (Ctrl+0)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
        </button>
        <button class="action-btn danger" style="color:{t.red};" onclick={clearCanvas} title="Clear">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="canvas-area"
    bind:this={wrap}
    onmouseenter={() => showCursor = true}
    onmouseleave={() => showCursor = false}
    onmousemove={(e) => { if (!isResizingBrush) { const r = paintEl.getBoundingClientRect(); cursorX = e.clientX - r.left; cursorY = e.clientY - r.top; } }}
    onwheel={onWheel}
    onmousedown={(e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning = true;
        panStartX = e.clientX - panX;
        panStartY = e.clientY - panY;
        e.preventDefault();
      }
    }}
    onmouseup={() => { if (isPanning) isPanning = false; }}
  >
    <div class="canvas-transform" style="transform: translate({panX}px,{panY}px) scale({zoom}); transform-origin: 0 0;">
      <canvas bind:this={canvas} width={CANVAS_W} height={CANVAS_H}
        style="cursor: {tool === 'fill' || tool === 'line' || tool === 'rect' || tool === 'circle' ? 'crosshair' : 'none'};"
        onmousedown={onDown} onmousemove={onMove} onmouseup={onUp}
        onmouseleave={() => { if (!isResizingBrush && isDrawing) onUp(); if (!isResizingBrush) showCursor = false; }}
      ></canvas>
    </div>

  </div>

  {#if showCursor && (tool === 'pen' || tool === 'brush' || tool === 'eraser')}
    {@const sz = (tool === 'brush' ? brushSize * 2 : tool === 'eraser' ? brushSize * 3 : brushSize) * zoom}
    <div class="brush-dot" style="left:{cursorX}px;top:{cursorY}px;width:{Math.max(4, sz)}px;height:{Math.max(4, sz)}px;"></div>
  {/if}

  <div class="statusbar" style="background:{t.bgLight};border-top:1px solid {t.border};color:{t.fgDim};">
    <span>{toolDefs.find(d => d.id === tool)?.label}</span>
    <span class="sep">|</span>
    <span>{mouseX}, {mouseY}</span>
    <span class="sep">|</span>
    <span>{CANVAS_W}x{CANVAS_H}</span>
    <span class="sep">|</span>
    <span>{Math.round(zoom * 100)}%</span>
    <span class="sep">|</span>
    <span>Scroll:Zoom Alt+Drag:Pan P/B/E/G/L/R/O:[ ]:Size</span>
  </div>
</div>

<style>
  .paint { display:flex; flex-direction:column; height:100%; background:var(--bg); color:var(--fg); user-select:none; position:relative; }

  .toolbar { display:flex; align-items:stretch; gap:0; padding:4px 8px; background:var(--bg-light); border-bottom:1px solid var(--border); flex-shrink:0; overflow-x:auto; }
  .tool-section { display:flex; flex-direction:column; gap:2px; padding:2px 6px; justify-content:center; }
  .section-label { font-size:9px; text-transform:uppercase; letter-spacing:0.05em; font-family:'Inter',system-ui,sans-serif; font-weight:600; line-height:1; }
  .tool-row { display:flex; gap:1px; }
  .tool-sep { width:1px; align-self:stretch; background:var(--border); margin:4px 4px; }
  .tool-btn { width:30px; height:28px; border:none; background:transparent; border-radius:5px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.1s; flex-shrink:0; }
  .tool-btn:hover { background:rgba(255,255,255,0.07); }

  .size-row { display:flex; align-items:center; gap:6px; }
  .size-slider { width:70px; height:3px; accent-color:var(--accent); }
  .size-val { font-size:11px; font-family:monospace; min-width:32px; font-weight:500; }

  .color-row { display:flex; align-items:center; gap:6px; }
  .current-color { width:22px; height:22px; border-radius:5px; border:2px solid; flex-shrink:0; }
  .preset-grid { display:flex; gap:2px; flex-wrap:wrap; max-width:200px; }
  .color-swatch { width:16px; height:16px; border:1.5px solid transparent; border-radius:3px; cursor:pointer; transition:border-color 0.1s, transform 0.1s; flex-shrink:0; }
  .color-swatch:hover { transform:scale(1.2); z-index:1; }
  .color-swatch.active { border-color:white; transform:scale(1.15); }
  .color-input { width:16px; height:16px; border:1.5px solid rgba(255,255,255,0.15); padding:0; cursor:pointer; border-radius:3px; background:transparent; flex-shrink:0; }

  .action-row { display:flex; gap:2px; }
  .action-btn { display:flex; align-items:center; justify-content:center; width:28px; height:28px; padding:0; border:none; background:transparent; border-radius:5px; cursor:pointer; transition:background 0.1s; }
  .action-btn:hover { background:rgba(255,255,255,0.07); }
  .action-btn.danger:hover { background:rgba(255,50,50,0.15); }

  .canvas-area { flex:1; overflow:hidden; background:#1a1a1a; position:relative; cursor:default; }
  .canvas-transform { position:absolute; will-change:transform; }
  canvas { display:block; box-shadow:0 4px 24px rgba(0,0,0,0.6); background:#ffffff; }

  .brush-dot { position:absolute; border:2px solid #000; border-radius:50%; pointer-events:none; transform:translate(-50%,-50%); z-index:99999; box-shadow: 0 0 0 1px #fff, inset 0 0 0 1px #fff; }

  .statusbar { display:flex; align-items:center; gap:8px; padding:2px 12px; font-size:11px; font-family:'Inter',system-ui,sans-serif; flex-shrink:0; height:22px; }
  .sep { opacity:0.3; }
</style>
