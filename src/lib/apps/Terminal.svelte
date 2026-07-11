<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';

  let t = $derived(themes[$currentTheme]);
  let lines = $state([
    { type: 'output', text: 'Welcome to WebOS Terminal v1.0' },
    { type: 'output', text: 'Type "help" for available commands.' },
    { type: 'output', text: '' }
  ]);
  let input = $state('');
  let inputEl;
  let termEl;

  const commands = {
    help: () => [
      'Available commands:',
      '  help      - Show this message',
      '  about     - About Abror',
      '  projects  - List projects',
      '  skills    - Show skills',
      '  clear     - Clear terminal',
      '  whoami    - Who are you?',
      '  neofetch  - System info',
      '  ls        - List files',
      '  cat       - Read file',
      '  echo      - Print text',
      '  date      - Current date/time',
      '  cowsay    - Moo',
      '  sudo      - Nice try ;)'
    ],
    about: () => [
      'Abror Ismoiljanov — 17y/o systems programmer',
      'Building game engines, tooling, and low-level software.',
      'C++, Rust, Linux. Arch btw.'
    ],
    projects: () => [
      'genesis-engine  - C++ game engine editor with ECS, Lua scripting, ImGui',
      'cart            - Cargo for C++ build tool & package manager',
      'rune            - Rust editor framework (egui + wgpu)',
      'amp             - CLI music player in C++',
      'ale             - Abror\'s Level Editor',
      'voxel-engine    - Tiny voxel world in C++',
      'hlidk           - Bevy game project',
      'mp              - Audio project (Rust, cpal/symphonia)'
    ],
    skills: () => [
      'Languages:   C++, Rust, JavaScript, Go, Python',
      'Graphics:    OpenGL, wgpu, Vulkan (learning)',
      'Engines:     Custom ECS, ImGui, SDL2, Bevy, macroquad',
      'Systems:     Build tools, editors, scripting runtimes',
      'OS:          Arch Linux, custom kernel configs',
      'Tools:       CMake, xmake, cargo, git, neovim'
    ],
    whoami: () => ['krubka'],
    ls: () => [
      'Desktop/    Documents/  Downloads/  Projects/',
      'Builds/     Games/      Videos/     .config/',
      'RustProj/   GoProj/     Music/      .ssh/'
    ],
    cat: (args) => {
      if (!args[0]) return ['cat: missing operand'];
      if (args[0] === 'README.md') return ['WebOS Portfolio — Made by Abror', 'Linux soul, KDE heart, Gruvbox blood.'];
      return [`cat: ${args[0]}: No such file or directory`];
    },
    echo: (args) => [args.join(' ')],
    date: () => [new Date().toString()],
    neofetch: () => [
      '',
      '        _nnnn_          ',
      '       dGGGGMMb         krubka@webos',
      '      @p~qp~~qMb        ───────────────',
      '      M|@||@) M|        OS: WebOS 1.0 (Arch btw)',
      '      @,----.JM|        Kernel: browser-6.1.0',
      '     JS^\\__/  qKL       Shell: websh 1.0',
      '    dZP        qKRb     DE: KDE-style (Svelte)',
      '   dZP          qKKb    WM: custom',
      '  fZP            SMMb   Theme: ' + t.name,
      '  HZM            MMMM   Terminal: web-terminal',
      '  FqM            MMMM   CPU: Intel i5-12450H',
      '__| ".        |\\dS"qML  Memory: 4.2 GiB / 16 GiB',
      '|    `.       | `\' \\Zq  ',
      '_)      \\.___.,|     .\' ',
      '\\____   )MMMMMP|   .\'   ',
      '     `-\'       `--\'      ',
      '',
    ],
    cowsay: (args) => {
      const msg = args.join(' ') || 'moo';
      const line = '-'.repeat(msg.length + 2);
      return [
        line,
        `< ${msg} >`,
        line,
        '        \\   ^__^',
        '         \\  (oo)\\_______',
        '            (__)\\       )\\/\\',
        '                ||----w |',
        '                ||     ||',
      ];
    },
    clear: () => { lines = []; return []; },
    sudo: () => ['[sudo] password for krubka: ', 'Permission denied. Nice try though. ;)'],
  };

  function processCommand(cmd) {
    const parts = cmd.trim().split(/\s+/);
    const name = parts[0];
    const args = parts.slice(1);

    if (!name) return [];

    if (commands[name]) return commands[name](args);
    return [`websh: command not found: ${name}`];
  }

  function onKeydown(e) {
    if (e.key === 'Enter') {
      const cmd = input;
      lines = [...lines, { type: 'input', text: `$ ${cmd}` }];
      const output = processCommand(cmd);
      for (const line of output) {
        lines = [...lines, { type: 'output', text: line }];
      }
      lines = [...lines, { type: 'output', text: '' }];
      input = '';
      setTimeout(() => {
        if (termEl) termEl.scrollTop = termEl.scrollHeight;
      }, 0);
    }
  }

  function focusInput() {
    inputEl?.focus();
  }
</script>

<div
  class="terminal"
  style="--bg: {t.bgDark}; --fg: {t.fg}; --accent: {t.green}; --dim: {t.fgDim};"
  onmousedown={focusInput}
  role="textbox"
  tabindex="-1"
>
  <div class="term-output" bind:this={termEl}>
    {#each lines as line}
      <div class="term-line">
        {#if line.type === 'input'}
          <span class="prompt">{line.text.split('$ ')[0]}$ </span><span class="input-text">{line.text.split('$ ')[1]}</span>
        {:else}
          <span>{line.text}</span>
        {/if}
      </div>
    {/each}
    <div class="term-input-line">
      <span class="prompt">$ </span>
      <!-- svelte-ignore a11y_autofocus -->
      <input
        bind:this={inputEl}
        bind:value={input}
        onkeydown={onKeydown}
        class="term-input"
        spellcheck="false"
        autocomplete="off"
        autofocus
      />
    </div>
  </div>
</div>

<style>
  .terminal {
    height: 100%;
    background: var(--bg);
    color: var(--fg);
    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
    font-size: 13px;
    padding: 12px;
    cursor: text;
    overflow: hidden;
  }

  .term-output {
    height: 100%;
    overflow-y: auto;
  }

  .term-line {
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .prompt {
    color: var(--accent);
    font-weight: bold;
  }

  .input-text {
    color: var(--fg);
  }

  .term-input-line {
    display: flex;
    line-height: 1.6;
  }

  .term-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--fg);
    font-family: inherit;
    font-size: inherit;
    outline: none;
    caret-color: var(--accent);
  }

  .term-output::-webkit-scrollbar {
    width: 6px;
  }
  .term-output::-webkit-scrollbar-track {
    background: transparent;
  }
  .term-output::-webkit-scrollbar-thumb {
    background: var(--dim);
    border-radius: 3px;
  }
</style>
