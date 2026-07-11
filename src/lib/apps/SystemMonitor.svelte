<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { onMount, onDestroy } from 'svelte';

  let t = $derived(themes[$currentTheme]);
  let activeTab = $state('overview');
  let cpuHistory = $state(Array(60).fill(0));
  let memHistory = $state(Array(60).fill(0));
  let cpuUsage = $state(0);
  let memUsage = $state(0);
  let diskUsage = $state(42);
  let uptime = $state(0);

  const processes = $state([
    { pid: 1, name: 'systemd', cpu: 0.1, mem: 0.3, user: 'root' },
    { pid: 421, name: 'sddm', cpu: 0.2, mem: 0.8, user: 'root' },
    { pid: 883, name: 'Xorg', cpu: 1.2, mem: 2.1, user: 'abror' },
    { pid: 1204, name: 'plasmashell', cpu: 2.4, mem: 4.2, user: 'abror' },
    { pid: 1567, name: 'firefox', cpu: 8.3, mem: 12.4, user: 'abror' },
    { pid: 1892, name: 'neovim', cpu: 0.8, mem: 1.6, user: 'abror' },
    { pid: 2001, name: 'zsh', cpu: 0.1, mem: 0.5, user: 'abror' },
    { pid: 2150, name: 'dockerd', cpu: 1.5, mem: 3.2, user: 'root' },
    { pid: 2340, name: 'NetworkManager', cpu: 0.3, mem: 0.6, user: 'root' },
    { pid: 2450, name: 'pulseaudio', cpu: 0.5, mem: 0.9, user: 'abror' },
    { pid: 2680, name: 'kgitshots', cpu: 0.1, mem: 0.4, user: 'abror' },
    { pid: 2890, name: 'kwin_wayland', cpu: 3.1, mem: 5.8, user: 'abror' },
    { pid: 3010, name: 'dbus-daemon', cpu: 0.2, mem: 0.3, user: 'abror' },
    { pid: 3200, name: 'wireplumber', cpu: 0.4, mem: 0.7, user: 'abror' },
    { pid: 3450, name: 'mysqld', cpu: 1.8, mem: 6.2, user: 'mysql' },
  ]);

  function simulateMetrics() {
    cpuUsage = Math.min(100, Math.max(2, cpuUsage + (Math.random() - 0.48) * 15));
    memUsage = Math.min(85, Math.max(15, memUsage + (Math.random() - 0.5) * 5));
    uptime += 1;

    processes.forEach(p => {
      p.cpu = Math.max(0, Math.min(25, p.cpu + (Math.random() - 0.5) * 1.5));
      p.mem = Math.max(0.1, Math.min(15, p.mem + (Math.random() - 0.5) * 0.8));
    });

    cpuHistory = [...cpuHistory.slice(1), cpuUsage];
    memHistory = [...memHistory.slice(1), memUsage];
  }

  const interval = setInterval(simulateMetrics, 1000);
  cpuUsage = 12 + Math.random() * 20;
  memUsage = 28 + Math.random() * 15;

  onDestroy(() => clearInterval(interval));

  function formatUptime(s) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  }

  function drawGraph(canvas, data, color, bgColor) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    const max = 100;
    const step = w / (data.length - 1);

    ctx.beginPath();
    ctx.moveTo(0, h);
    data.forEach((val, i) => {
      const x = i * step;
      const y = h - (val / max) * h;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + '40');
    grad.addColorStop(1, color + '05');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * step;
      const y = h - (val / max) * h;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // svelte-ignore non_reactive_update
  let cpuCanvas;
  // svelte-ignore non_reactive_update
  let memCanvas;

  $effect(() => {
    drawGraph(cpuCanvas, cpuHistory, t.aqua, 'transparent');
  });
  $effect(() => {
    drawGraph(memCanvas, memHistory, t.purple, 'transparent');
  });
</script>

<div class="sysmon" style="--bg: {t.bg}; --bg-dark: {t.bgDark}; --bg-light: {t.bgLight}; --fg: {t.fg}; --fg-dim: {t.fgDim}; --border: {t.border}; --accent: {t.accent};">
  <div class="tabs">
    <button class="tab" class:active={activeTab === 'overview'} onmousedown={() => activeTab = 'overview'} style="--accent: {t.accent};">Overview</button>
    <button class="tab" class:active={activeTab === 'processes'} onmousedown={() => activeTab = 'processes'} style="--accent: {t.accent};">Processes</button>
  </div>

  {#if activeTab === 'overview'}
    <div class="overview">
      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">CPU</span>
          <span class="metric-value" style="color: {t.aqua};">{cpuUsage.toFixed(1)}%</span>
        </div>
        <canvas bind:this={cpuCanvas} class="graph"></canvas>
        <div class="metric-details" style="color: {t.fgDim};">
          <span>Intel i5-12450H</span>
          <span>12 threads</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <span class="metric-label">Memory</span>
          <span class="metric-value" style="color: {t.purple};">{memUsage.toFixed(1)}%</span>
        </div>
        <canvas bind:this={memCanvas} class="graph"></canvas>
        <div class="metric-details" style="color: {t.fgDim};">
          <span>{(memUsage * 0.16).toFixed(1)} / 16.0 GB</span>
          <span>Swap: 0 / 8.0 GB</span>
        </div>
      </div>

      <div class="stat-row">
        <div class="stat-card" style="background: {t.bgLight}; border-color: {t.border};">
          <span class="stat-label" style="color: {t.fgDim};">Disk</span>
          <span class="stat-value" style="color: {t.fg};">{diskUsage}%</span>
          <div class="progress-bar">
            <div class="progress-fill" style="width: {diskUsage}%; background: {t.green};"></div>
          </div>
          <span class="stat-sub" style="color: {t.fgDim};">240 / 512 GB</span>
        </div>
        <div class="stat-card" style="background: {t.bgLight}; border-color: {t.border};">
          <span class="stat-label" style="color: {t.fgDim};">Uptime</span>
          <span class="stat-value" style="color: {t.fg};">{formatUptime(uptime)}</span>
        </div>
        <div class="stat-card" style="background: {t.bgLight}; border-color: {t.border};">
          <span class="stat-label" style="color: {t.fgDim};">Load</span>
          <span class="stat-value" style="color: {t.fg};">{(cpuUsage / 25).toFixed(2)}</span>
          <span class="stat-sub" style="color: {t.fgDim};">{(cpuUsage / 33).toFixed(2)} {(cpuUsage / 50).toFixed(2)}</span>
        </div>
      </div>
    </div>
  {:else}
    <div class="process-list">
      <div class="process-header" style="border-color: {t.border}; color: {t.fgDim};">
        <span class="col-pid">PID</span>
        <span class="col-name">Name</span>
        <span class="col-user">User</span>
        <span class="col-cpu">CPU%</span>
        <span class="col-mem">MEM%</span>
      </div>
      {#each processes.sort((a, b) => b.cpu - a.cpu) as p (p.pid)}
        <div class="process-row" style="border-color: {t.border}; color: {t.fg};">
          <span class="col-pid" style="color: {t.fgDim};">{p.pid}</span>
          <span class="col-name">{p.name}</span>
          <span class="col-user" style="color: {t.fgDim};">{p.user}</span>
          <span class="col-cpu" style="color: {p.cpu > 5 ? t.red : t.fg};">{p.cpu.toFixed(1)}</span>
          <span class="col-mem" style="color: {p.mem > 5 ? t.orange : t.fg};">{p.mem.toFixed(1)}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .sysmon {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: transparent;
    color: var(--fg);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 13px;
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: rgba(255,255,255,0.04);
  }

  .tab {
    padding: 8px 16px;
    border: none;
    background: transparent;
    color: var(--fg-dim);
    font-size: 12px;
    font-family: inherit;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  .tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  .tab:hover { color: var(--fg); }

  .overview {
    flex: 1;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
  }

  .metric-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
  }

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
  .metric-label { font-weight: 600; font-size: 13px; }
  .metric-value { font-size: 18px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }

  .graph {
    width: 100%;
    height: 80px;
    border-radius: 4px;
  }

  .metric-details {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    margin-top: 6px;
  }

  .stat-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 8px;
  }

  .stat-card {
    border: 1px solid;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stat-label { font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; }
  .stat-value { font-size: 20px; font-weight: 700; font-family: 'JetBrains Mono', monospace; }
  .stat-sub { font-size: 11px; }

  .progress-bar {
    height: 4px;
    background: rgba(128,128,128,0.2);
    border-radius: 2px;
    overflow: hidden;
    margin: 4px 0;
  }
  .progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease;
  }

  .process-list {
    flex: 1;
    overflow-y: auto;
    font-size: 12px;
  }

  .process-header, .process-row {
    display: flex;
    padding: 6px 12px;
    border-bottom: 1px solid;
    gap: 8px;
  }

  .process-header {
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: sticky;
    top: 0;
    background: rgba(255,255,255,0.04);
  }

  .process-row:hover {
    background: rgba(255,255,255,0.04);
  }

  .col-pid { width: 50px; }
  .col-name { flex: 1; }
  .col-user { width: 80px; }
  .col-cpu { width: 60px; text-align: right; font-family: 'JetBrains Mono', monospace; }
  .col-mem { width: 60px; text-align: right; font-family: 'JetBrains Mono', monospace; }
</style>
