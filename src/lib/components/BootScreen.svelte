<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { onMount } from 'svelte';

  let { onLogin } = $props();

  let t = $derived(themes[$currentTheme]);
  let phase = $state('boot');
  let bootLines = $state([]);
  let bootProgress = $state(0);
  let loginPassword = $state('');
  let loginError = $state(false);
  let showLogin = $state(false);

  const bootMessages = [
    { text: 'WebOS 1.0 (Svelte Kernel 5.0.0)', delay: 100 },
    { text: '', delay: 50 },
    { text: '[    0.000000] Booting WebOS on x86_64...', delay: 200 },
    { text: '[    0.001247] CPU: Intel i5-12450H @ 2.0GHz', delay: 120 },
    { text: '[    0.001893] Memory: 16384 MB available', delay: 100 },
    { text: '[    0.002456] Loading Svelte 5 runtime... OK', delay: 180 },
    { text: '[    0.003102] Initializing window manager... OK', delay: 150 },
    { text: '[    0.004521] Loading Gruvbox theme engine... OK', delay: 200 },
    { text: '[    0.005891] Mounting virtual filesystem... OK', delay: 120 },
    { text: '[    0.007234] Starting terminal emulator... OK', delay: 100 },
    { text: '[    0.008100] Loading application manifests... OK', delay: 150 },
    { text: '[    0.009456] GPU: wgpu renderer initialized', delay: 200 },
    { text: '[    0.010200] Network: connected', delay: 100 },
    { text: '[    0.011000] Audio: PulseAudio running', delay: 100 },
    { text: '[    0.012300] All systems nominal.', delay: 200 },
    { text: '', delay: 50 },
    { text: 'WebOS is ready.', delay: 300 },
  ];

  onMount(async () => {
    for (let i = 0; i < bootMessages.length; i++) {
      await new Promise(r => setTimeout(r, bootMessages[i].delay));
      bootLines = [...bootLines, bootMessages[i].text];
      bootProgress = ((i + 1) / bootMessages.length) * 100;
    }
    await new Promise(r => setTimeout(r, 600));
    phase = 'login';
    await new Promise(r => setTimeout(r, 100));
    showLogin = true;
  });

  function handleLogin() {
    if (loginPassword === '' || loginPassword === 'krubka') {
      phase = 'transition';
      setTimeout(() => onLogin(), 500);
    } else {
      loginError = true;
      setTimeout(() => loginError = false, 1500);
      loginPassword = '';
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') handleLogin();
  }
</script>

<div
  class="boot-screen"
  style="background: {t.bgDark}; color: {t.fg};"
  class:fade-out={phase === 'transition'}
>
  {#if phase === 'boot'}
    <div class="boot-content">
      <div class="boot-header">
        <div class="boot-logo" style="color: {t.accent};">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1"/>
          </svg>
        </div>
        <h1 style="color: {t.fg};">WebOS</h1>
      </div>

      <div class="boot-terminal">
        {#each bootLines as line}
          <div class="boot-line" style="color: {line.includes('OK') ? t.green : line.includes('ready') ? t.aqua : t.fgDim};">
            {line}
          </div>
        {/each}
        <span class="cursor-blink" style="color: {t.accent};">_</span>
      </div>

      <div class="boot-progress">
        <div class="progress-track" style="background: {t.bgLight};">
          <div class="progress-bar" style="width: {bootProgress}%; background: {t.accent};"></div>
        </div>
        <span class="progress-text" style="color: {t.fgDim};">{bootProgress.toFixed(0)}%</span>
      </div>
    </div>

  {:else if phase === 'login'}
    <div class="login-content" class:visible={showLogin}>
      <div class="login-card" style="background: {t.bgLight}40; border-color: {t.border}; backdrop-filter: blur(20px);">
        <div class="login-avatar" style="background: {t.accent};">
          <span style="color: white; font-size: 28px; font-weight: 700;">A</span>
        </div>
        <h2 class="login-name" style="color: {t.fg};">Abror</h2>
        <p class="login-hint" style="color: {t.fgDim};">Click sign in or press Enter (no password needed)</p>

        {#if loginError}
          <p class="login-error" style="color: {t.red};">Incorrect password. Try empty or "krubka".</p>
        {/if}

        <input
          type="password"
          bind:value={loginPassword}
          onkeydown={handleKeydown}
          placeholder="Password (optional)"
          class="login-input"
          style="background: {t.inputBg}; color: {t.inputFg}; border-color: {t.border};"
        />

        <button
          class="login-btn"
          onmousedown={handleLogin}
          style="background: {t.accent}; color: {t.bgDark};"
        >
          Sign In
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .boot-screen {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.5s ease;
    font-family: 'JetBrains Mono', monospace;
  }

  .boot-screen.fade-out {
    opacity: 0;
  }

  .boot-content {
    width: 500px;
    max-width: 90vw;
  }

  .boot-header {
    text-align: center;
    margin-bottom: 32px;
  }

  .boot-logo {
    margin-bottom: 8px;
  }

  .boot-header h1 {
    font-size: 28px;
    font-weight: 700;
    font-family: 'Inter', system-ui, sans-serif;
    letter-spacing: 0.05em;
  }

  .boot-terminal {
    background: rgba(0,0,0,0.3);
    border-radius: 8px;
    padding: 16px;
    font-size: 12px;
    line-height: 1.7;
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid rgba(128,128,128,0.2);
  }

  .boot-line {
    white-space: pre;
    animation: fadeIn 0.15s ease;
  }

  .cursor-blink {
    animation: blink 0.8s step-end infinite;
  }

  .boot-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 16px;
  }

  .progress-track {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 11px;
    min-width: 32px;
    text-align: right;
  }

  /* Login */
  .login-content {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .login-content.visible {
    opacity: 1;
  }

  .login-card {
    width: 320px;
    padding: 32px;
    border-radius: 12px;
    border: 1px solid;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .login-avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 4px;
  }

  .login-name {
    font-size: 20px;
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
    margin: 0;
  }

  .login-hint {
    font-size: 11px;
    margin: 0 0 8px;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .login-error {
    font-size: 12px;
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .login-input {
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid;
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
    outline: none;
    text-align: center;
    transition: border-color 0.2s;
  }
  .login-input:focus {
    border-color: var(--accent, #d65d0e) !important;
  }

  .login-btn {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
    cursor: pointer;
    margin-top: 4px;
    transition: opacity 0.15s;
  }
  .login-btn:hover { opacity: 0.9; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(2px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes blink {
    50% { opacity: 0; }
  }
</style>
