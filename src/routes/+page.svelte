<script>
  import Desktop from '$lib/components/Desktop.svelte';
  import Taskbar from '$lib/components/Taskbar.svelte';
  import Window from '$lib/components/Window.svelte';
  import BootScreen from '$lib/components/BootScreen.svelte';
  import { visibleWindows } from '$lib/stores/windows.js';
  import { currentTheme } from '$lib/stores/theme.js';
  import { themes } from '$lib/themes/palettes.js';

  let t = $derived(themes[$currentTheme]);
  let loggedIn = $state(false);

  function onLogin() {
    loggedIn = true;
  }

  $effect(() => {
    function preventCtx(e) { e.preventDefault(); }
    document.addEventListener('contextmenu', preventCtx);
    return () => document.removeEventListener('contextmenu', preventCtx);
  });

  $effect(() => {
    const theme = themes[$currentTheme];
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, val]) => {
      if (typeof val === 'string' && !val.includes('gradient')) {
        root.style.setProperty(`--os-${key}`, val);
      }
    });
  });
</script>

{#if !loggedIn}
  <BootScreen {onLogin} />
{/if}

<div class="os-shell" class:visible={loggedIn} style="--fg: {t.fg}; --bg: {t.bg};">
  <Desktop />

  {#each $visibleWindows as win (win.id)}
    <Window
      id={win.id}
      title={win.title}
      component={win.component}
      x={win.x}
      y={win.y}
      width={win.width}
      height={win.height}
      minWidth={win.minWidth}
      minHeight={win.minHeight}
    />
  {/each}

  <Taskbar />
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(html, body) {
    width: 100%;
    height: 100%;
    overflow: hidden;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .os-shell {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  .os-shell.visible {
    opacity: 1;
  }
</style>
