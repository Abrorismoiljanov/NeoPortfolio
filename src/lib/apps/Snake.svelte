<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';
  import { onMount, onDestroy } from 'svelte';

  let t = $derived(themes[$currentTheme]);

  const CELL = 20;
  const COLS = 24;
  const ROWS = 18;

  let snake = $state([{ x: 12, y: 9 }, { x: 11, y: 9 }, { x: 10, y: 9 }]);
  let food = $state({ x: 18, y: 9 });
  let dir = $state({ x: 1, y: 0 });
  let nextDir = $state({ x: 1, y: 0 });
  let score = $state(0);
  let highScore = $state(0);
  let gameState = $state('idle');
  let interval;

  onMount(() => {
    const saved = localStorage.getItem('os-snake-high');
    if (saved) highScore = parseInt(saved) || 0;
    window.addEventListener('keydown', handleKey);
  });
  onDestroy(() => {
    window.removeEventListener('keydown', handleKey);
    if (interval) clearInterval(interval);
  });

  function spawnFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function startGame() {
    snake = [{ x: 12, y: 9 }, { x: 11, y: 9 }, { x: 10, y: 9 }];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    spawnFood();
    gameState = 'playing';
    if (interval) clearInterval(interval);
    interval = setInterval(tick, 120);
  }

  function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      gameOver();
      return;
    }
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }

    snake = [head, ...snake];

    if (head.x === food.x && head.y === food.y) {
      score++;
      spawnFood();
    } else {
      snake = snake.slice(0, -1);
    }
  }

  function gameOver() {
    gameState = 'dead';
    clearInterval(interval);
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('os-snake-high', highScore.toString());
    }
  }

  function handleKey(e) {
    if (gameState !== 'playing') return;
    const map = {
      ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
      w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
      a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
    };
    const nd = map[e.key];
    if (!nd) return;
    e.preventDefault();
    if (nd.x !== -dir.x || nd.y !== -dir.y) {
      nextDir = nd;
    }
  }
</script>

<div class="snake-app" style="--bg: {t.bg}; --fg: {t.fg}; --border: {t.border}; --accent: {t.accent}; --green: {t.green}; --red: {t.red}; --bg-light: {t.bgLight};">
  <div class="hud">
    <div class="hud-left">
      <span class="score">Score: {score}</span>
      <span class="high" style="color: {t.yellow};">Best: {highScore}</span>
    </div>
    {#if gameState === 'idle'}
      <button class="play-btn" style="background: {t.green}; color: {t.bgDark};" onclick={startGame}>Play</button>
    {:else if gameState === 'dead'}
      <button class="play-btn" style="background: {t.red}; color: {t.bgDark};" onclick={startGame}>Retry</button>
    {:else}
      <span class="playing" style="color: {t.green};">{'\u25B6'} Playing</span>
    {/if}
  </div>

  <div class="board-wrap">
    <div class="board" style="width: {COLS * CELL}px; height: {ROWS * CELL}px; border-color: {t.border};">
      {#if gameState === 'idle'}
        <div class="overlay">
          <div class="big-icon">{'\uD83D\uDC0D'}</div>
          <div class="msg" style="color: {t.fg};">Press Play to start</div>
          <div class="hint" style="color: {t.fgDim};">Arrow keys or WASD to move</div>
        </div>
      {:else}
        {#each snake as seg, i}
          <div
            class="cell snake-cell"
            class:head={i === 0}
            style="left: {seg.x * CELL}px; top: {seg.y * CELL}px; width: {CELL}px; height: {CELL}px; background: {i === 0 ? t.green : t.green + 'bb'};"
          ></div>
        {/each}
        <div
          class="cell food"
          style="left: {food.x * CELL}px; top: {food.y * CELL}px; width: {CELL}px; height: {CELL}px;"
        ></div>
      {/if}

      {#if gameState === 'dead'}
        <div class="overlay">
          <div class="big-icon">{'\uD83D\uDC80'}</div>
          <div class="msg" style="color: {t.red};">Game Over</div>
          <div class="hint" style="color: {t.fgDim};">Score: {score}</div>
        </div>
      {/if}
    </div>
  </div>

  <div class="controls-hint" style="color: {t.fgDim};">
    <span>{'← → ↑ ↓'}</span> or
    <span>WASD</span> to move
  </div>
</div>

<style>
  .snake-app {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--bg);
    color: var(--fg);
    user-select: none;
    align-items: center;
  }

  .hud {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 8px 16px;
    background: var(--bg-light);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .hud-left {
    display: flex;
    gap: 16px;
  }
  .score {
    font-family: monospace;
    font-size: 14px;
    font-weight: bold;
  }
  .high {
    font-family: monospace;
    font-size: 14px;
  }
  .playing {
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .play-btn {
    border: none;
    padding: 6px 20px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
    cursor: pointer;
    transition: transform 0.1s, opacity 0.1s;
  }
  .play-btn:hover {
    opacity: 0.85;
    transform: scale(1.05);
  }

  .board-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .board {
    position: relative;
    border: 2px solid;
    border-radius: 6px;
    background: #0d1117;
    overflow: hidden;
  }

  .cell {
    position: absolute;
    border-radius: 3px;
    transition: left 0.08s linear, top 0.08s linear;
  }
  .snake-cell.head {
    border-radius: 5px;
    box-shadow: 0 0 8px var(--green);
  }

  .food {
    background: var(--red);
    border-radius: 50%;
    animation: foodPulse 0.8s ease-in-out infinite alternate;
    box-shadow: 0 0 8px var(--red);
  }
  @keyframes foodPulse {
    from { transform: scale(0.8); }
    to { transform: scale(1.1); }
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    z-index: 10;
  }
  .big-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }
  .msg {
    font-size: 20px;
    font-weight: bold;
    font-family: 'Inter', system-ui, sans-serif;
    margin-bottom: 4px;
  }
  .hint {
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .controls-hint {
    padding: 8px;
    font-size: 12px;
    font-family: 'Inter', system-ui, sans-serif;
    flex-shrink: 0;
  }
  .controls-hint span {
    font-weight: 600;
    color: var(--fg);
  }
</style>
