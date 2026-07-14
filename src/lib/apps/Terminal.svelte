<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';

  let t = $derived(themes[$currentTheme]);

  const FS = {
    '/': {
      type: 'dir',
      children: {
        'Desktop': { type: 'dir', children: {} },
        'Documents': {
          type: 'dir',
          children: {
            'README.md': { type: 'file', content: '# WebOS Portfolio\n\nMade by Krubka.\nLinux soul, KDE heart, Gruvbox blood.' },
            'notes.txt': { type: 'file', content: 'Remember to push genesis and cart to GitHub.' },
          }
        },
        'Downloads': { type: 'dir', children: {} },
        'Projects': {
          type: 'dir',
          children: {
            'genesis-engine': { type: 'dir', children: { 'CMakeLists.txt': { type: 'file', content: 'cmake_minimum_required(VERSION 3.20)' }, 'src': { type: 'dir', children: { 'main.cpp': { type: 'file', content: '// engine entry point' } } } } },
            'cart': { type: 'dir', children: { 'Cargo.toml': { type: 'file', content: '[package]\nname = "cart"\nversion = "0.1.0"' } } },
            'amp': { type: 'dir', children: { 'Cargo.toml': { type: 'file', content: '[package]\nname = "amp"' } } },
            'ALE': { type: 'dir', children: { 'src': { type: 'dir', children: { 'main.cpp': { type: 'file', content: '// level editor' } } } } },
          }
        },
        'Builds': { type: 'dir', children: {} },
        'Games': { type: 'dir', children: {} },
        'Music': { type: 'dir', children: {} },
        'Videos': { type: 'dir', children: {} },
        '.config': { type: 'dir', children: { 'nvim': { type: 'dir', children: { 'init.lua': { type: 'file', content: '-- neovim config' } } }, 'kitty': { type: 'dir', children: {} } } },
        '.ssh': { type: 'dir', children: {} },
      }
    }
  };

  let cwd = $state('/');

  function resolvePath(path) {
    if (path.startsWith('/')) return path;
    const parts = cwd === '/' ? [''] : cwd.split('/');
    const segs = path.split('/');
    for (const s of segs) {
      if (s === '' || s === '.') continue;
      if (s === '..') { if (parts.length > 1) parts.pop(); }
      else parts.push(s);
    }
    return parts.join('/') || '/';
  }

  function getNode(path) {
    if (path === '/') return FS['/'];
    const parts = path.split('/').filter(Boolean);
    let node = FS['/'];
    for (const p of parts) {
      if (!node || node.type !== 'dir' || !node.children[p]) return null;
      node = node.children[p];
    }
    return node;
  }

  function listDir(path) {
    const node = getNode(path);
    if (!node || node.type !== 'dir') return null;
    return Object.keys(node.children).sort((a, b) => {
      const aDir = node.children[a].type === 'dir';
      const bDir = node.children[b].type === 'dir';
      if (aDir !== bDir) return aDir ? -1 : 1;
      return a.localeCompare(b);
    });
  }

  let history = $state([]);
  let historyIdx = $state(-1);
  let savedInput = $state('');
  let input = $state('');
  let inputEl;
  let termEl;
  let lines = $state([]);
  let suggestion = $state('');
  let searchMode = $state(false);
  let searchQuery = $state('');
  let searchResults = $state([]);
  let searchIdx = $state(0);

  const ALIASES = { 'll': 'ls -la', 'la': 'ls -a', '..': 'cd ..' };
  const ENV = { USER: 'krubka', HOME: '/home/krubka', SHELL: '/bin/fish', TERM: 'xterm-256color', EDITOR: 'nvim', LANG: 'en_US.UTF-8', PATH: '/usr/local/bin:/usr/bin:/bin', HOSTNAME: 'webos' };

  function getPrompt() {
    const display = cwd === '/home/krubka' ? '~' : cwd;
    return { user: 'krubka', host: 'webos', dir: display };
  }

  function colored(type, text) { return { type: 'styled', style: type, text }; }

  function updateSuggestion() {
    if (!input.trim()) { suggestion = ''; return; }
    const matching = history.filter(h => h.startsWith(input) && h !== input);
    suggestion = matching.length ? matching[matching.length - 1].slice(input.length) : '';
  }

  function getCompletions(partial) {
    const parts = partial.split(/\s+/);
    const cmdNames = Object.keys(commands);
    if (parts.length <= 1) return cmdNames.filter(c => c.startsWith(parts[0]));
    const pathPart = parts[parts.length - 1];
    const dir = pathPart.includes('/') ? resolvePath(pathPart.substring(0, pathPart.lastIndexOf('/') + 1) || '/') : cwd;
    const prefix = pathPart.includes('/') ? pathPart.substring(pathPart.lastIndexOf('/') + 1) : pathPart;
    return (listDir(dir) || []).filter(e => e.startsWith(prefix));
  }

  const FORTUNES = [
    'The best way to predict the future is to implement it.',
    'There are only two hard things in CS: cache invalidation and naming things.',
    'Talk is cheap. Show me the code. — Linus Torvalds',
    'Simplicity is prerequisite for reliability. — Edsger W. Dijkstra',
    'Programs must be written for people to read. — Abelson & Sussman',
  ];

  const WEATHER_LINES = [
    'Weather for Tashkent, UZ', '',
    '  \\  /  Partly Cloudy',
    '  _ /"".-,  28°C',
    '    \\_   /  Wind: 12 km/h NW',
    '    /"""   Humidity: 45%',
    '           UV Index: 6',
  ];

  const MAN_PAGES = {
    ls: 'ls [-la] — List directory contents.\n  -l  Long format\n  -a  Show hidden files',
    cd: 'cd [dir] — Change directory.\n  cd ~     Go home\n  cd ..    Go up\n  cd -     Previous directory',
    cat: 'cat <file> — Print file contents.',
    echo: 'echo <text> — Print text to stdout.\n  Supports $VAR expansion.',
    tree: 'tree [dir] — Display directory tree.',
    grep: 'grep <pattern> <text> — Search for pattern.',
    head: 'head [-n N] <text> — Print first N lines.',
    tail: 'tail [-n N] <text> — Print last N lines.',
    wc: 'wc <text> — Count lines, words, characters.',
    man: 'man <cmd> — Show manual page.',
    history: 'history — Show command history.',
    calc: 'calc <expr> — Evaluate math expression.',
  };

  const commands = {
    help: () => {
      const grouped = [
        ['NAVIGATION', ['ls', 'cd', 'pwd', 'tree']],
        ['FILES', ['cat', 'echo', 'head', 'tail', 'grep', 'wc', 'touch', 'mkdir', 'rm']],
        ['SYSTEM', ['ps', 'top', 'df', 'free', 'uname', 'uptime', 'fastfetch', 'whoami', 'date']],
        ['UTILS', ['history', 'export', 'env', 'which', 'calc', 'base64', 'hexdump', 'rev', 'seq', 'md5sum']],
        ['FUN', ['cowsay', 'fortune', 'weather', 'matrix', 'sl']],
        ['MISC', ['man', 'alias', 'clear', 'sudo', 'exit']],
      ];
      const out = [colored('accent', '  websh — Commands:\n')];
      for (const [cat, cmds] of grouped) {
        out.push(colored('dim', `  ${cat}:`));
        out.push({ type: 'output', text: `    ${cmds.join('  ')}` });
      }
      out.push(colored('dim', '\n  Type "man <cmd>" for details. Tab completes.'));
      return out;
    },
    about: () => [
      colored('green', 'Krubka'),
      { type: 'output', text: '17y/o systems programmer from Tashkent.' },
      { type: 'output', text: 'Building game engines, tooling, and low-level software.' },
      { type: 'output', text: 'C++, Rust, Linux. Arch btw.' },
    ],
    skills: () => [
      colored('accent', '  Category          Skills'),
      colored('dim', '  ─────────────────────────────────────────────'),
      '  Languages         C++, Rust, JavaScript, Python',
      '  Graphics          OpenGL, wgpu',
      '  Engines           Custom ECS, ImGui, SDL2',
      '  Systems           Build tools, editors, scripting runtimes',
      '  Tools             CMake, cargo, git, neovim',
    ],
    whoami: () => ['krubka'],
    ls: (args) => {
      const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
      const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
      const target = args.find(a => !a.startsWith('-'));
      const dir = target ? resolvePath(target) : cwd;
      const node = getNode(dir);
      if (!node) return [`ls: cannot access '${target || dir}': No such file or directory`];
      if (node.type !== 'dir') return [dir.split('/').pop()];
      let entries = Object.keys(node.children).sort();
      if (showAll) entries = ['.', '..', ...entries];
      if (showLong) {
        const out = [`total ${entries.length}`];
        for (const e of entries) {
          if (e === '.' || e === '..') {
            out.push({ type: 'styled', style: 'dim', text: `drwxr-xr-x  2 krubka krubka  4096  Jul 11 12:00 ${e}` });
            continue;
          }
          const child = node.children[e];
          const isDir = child.type === 'dir';
          const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = isDir ? '4096' : String(child.content?.length || 0).padStart(4);
          if (isDir) {
            out.push({ type: 'styled', style: 'blue', text: `${perms}  1 krubka krubka  ${size}  Jul 11 12:00 ${e}/` });
          } else {
            out.push(`${perms}  1 krubka krubka  ${size}  Jul 11 12:00 ${e}`);
          }
        }
        return out;
      }
      return [entries.map(e => {
        if (e === '.' || e === '..') return e;
        return node.children[e].type === 'dir' ? `${e}/` : e;
      }).join('  ')];
    },
    cd: (args) => {
      const target = args[0] || '/home/krubka';
      if (target === '-') { cwd = '/'; return []; }
      const path = resolvePath(target);
      const node = getNode(path);
      if (!node) return [`cd: no such file or directory: ${target}`];
      if (node.type !== 'dir') return [`cd: not a directory: ${target}`];
      cwd = path;
      return [];
    },
    pwd: () => [cwd],
    tree: (args) => {
      const target = args[0] ? resolvePath(args[0]) : cwd;
      const node = getNode(target);
      if (!node || node.type !== 'dir') return [`tree: '${target}': No such directory`];
      const out = [target === '/' ? '/' : target.split('/').pop() + '/'];
      let dirs = 0, files = 0;
      function walk(n, prefix) {
        const entries = Object.keys(n.children).sort();
        entries.forEach((name, i) => {
          const isLast = i === entries.length - 1;
          const child = n.children[name];
          const isDir = child.type === 'dir';
          if (isDir) dirs++; else files++;
          out.push(`${prefix}${isLast ? '└── ' : '├── '}${isDir ? name + '/' : name}`);
          if (isDir) walk(child, prefix + (isLast ? '    ' : '│   '));
        });
      }
      walk(node, '');
      out.push({ type: 'styled', style: 'dim', text: `${dirs} directories, ${files} files` });
      return out;
    },
    cat: (args) => {
      if (!args[0]) return ['cat: missing operand'];
      const path = resolvePath(args[0]);
      const node = getNode(path);
      if (!node) return [`cat: ${args[0]}: No such file or directory`];
      if (node.type === 'dir') return [`cat: ${args[0]}: Is a directory`];
      return (node.content || '').split('\n');
    },
    echo: (args) => {
      let text = args.join(' ');
      for (const [k, v] of Object.entries(ENV)) text = text.replaceAll(`$${k}`, v);
      return [text];
    },
    date: () => [new Date().toString()],
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
    sudo: () => [colored('red', 'Permission denied. Nice try though. ;)')],
    man: (args) => {
      if (!args[0]) return ['What manual page do you want?'];
      const page = MAN_PAGES[args[0]];
      if (!page) return [`No manual entry for ${args[0]}`];
      return [colored('accent', `${args[0].toUpperCase()}(1)`), '', ...page.split('\n')];
    },
    ps: () => [
      colored('accent', '  PID TTY          TIME CMD'),
      '    1 ?        00:00:02 systemd',
      '  234 ?        00:00:00 sddm',
      '  567 pts/0    00:00:00 websh',
      '  890 ?        00:01:23 neovim',
      ` ${Math.floor(Math.random() * 9000) + 1000} ?        00:00:00 ps`,
    ],
    top: () => [
      colored('accent', 'top - webos up time: 14 days, 3:42'),
      colored('dim', 'Tasks: 247 total, 1 running, 246 sleeping'),
      '', colored('accent', '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND'),
      '  890 krubka   20   0  128456  45632  32100 S  12.3   2.8   1:23.45 nvim',
      ' 1024 krubka   20   0   34520  12800   8900 S   5.1   0.8   0:45.12 waybar',
      '', colored('dim', 'MiB Mem:  16384.0 total,   4096.0 free,   8192.0 used'),
    ],
    df: () => [
      colored('accent', 'Filesystem      Size  Used Avail Use% Mounted on'),
      '/dev/sda2       500G  180G  320G  36% /',
      '/dev/sda1       512M  128M  384M  25% /boot/efi',
      '/dev/sdb1         1T  450G  550G  45% /home',
    ],
    free: () => [
      colored('accent', '              total        used        free      shared  buff/cache   available'),
      'Mem:       16384000     8192000     4096000      256000     4096000     7500000',
      'Swap:       8192000      192000     8000000',
    ],
    uname: (args) => args.includes('-a') ? ['WebOS 6.1.0-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'] : ['WebOS'],
    uptime: () => [' 12:42:07 up 14 days, 3:42, 1 user, load average: 0.42, 0.38, 0.35'],
    fastfetch: () => {
      const hostname = 'webos';
      const kernel = '6.1.0-arch1-1';
      const uptime = '14d 3h 42m';
      const shell = 'fish 3.6.0';
      const terminal = 'websh 2.0';
      const cpu = 'AMD Ryzen 7 5800X (16) @ 4.8GHz';
      const gpu = 'NVIDIA RTX 3070';
      const memory = '8.2 GiB / 16.0 GiB (51%)';
      const disk = '180G / 500G (36%)';
      const packages = '1847 (pacman)';
      const de = 'KDE Plasma 6.0';
      const wm = 'KWin';
      const theme = 'Gruvbox Dark';
      const icons = 'Papirus-Dark';
      const cpuUsage = Math.floor(Math.random() * 30 + 5);

      const logo = [
        '                   A',
        '                  /#\\',
        '                 /###\\',
        '                /#####\\',
        '               /#######\\',
        '              _ "=######\\',
        '             /#=_\\#####\\',
        '            /#############\\',
        '           /###############\\',
        '          /#################\\',
        '         /###################\\',
        '        /########*"""""*########\\',
        '       /#######/       \\#######\\',
        '      /########         ########\\',
        '     /#########         #####=,_\\',
      ];

      const info = [
        ['OS', 'Arch Linux x86_64'],
        ['Host', hostname],
        ['Kernel', kernel],
        ['Uptime', uptime],
        ['Packages', packages],
        ['Shell', shell],
        ['Terminal', terminal],
        ['DE', de],
        ['WM', wm],
        ['Theme', theme],
        ['Icons', icons],
        ['CPU', `${cpu} [${cpuUsage}%]`],
        ['GPU', gpu],
        ['Memory', memory],
        ['Disk', disk],
      ];

      const maxLabel = Math.max(...info.map(i => i[0].length));
      const out = [];

      for (let i = 0; i < Math.max(logo.length, info.length); i++) {
        const logoLine = i < logo.length ? logo[i] : ' '.repeat(18);
        const infoLine = i < info.length
          ? { type: 'styled', style: 'info', label: info[i][0].padEnd(maxLabel), value: info[i][1] }
          : null;
        out.push({ type: 'fastfetch-line', logo: logoLine, info: infoLine });
      }

      out.push({ type: 'fastfetch-bar', color: t.green });

      return out;
    },
    ping: (args) => {
      if (!args[0]) return ['ping: missing host operand'];
      const host = args[0];
      return [`PING ${host} (${Math.floor(Math.random()*223)+1}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}) 56(84) bytes of data.`, ...[1,2,3].map(i => `64 bytes from ${host}: icmp_seq=${i} ttl=56 time=${(Math.random()*20+5).toFixed(1)} ms`), '', `--- ${host} ping statistics ---`, '3 packets transmitted, 3 received, 0% packet loss'];
    },
    curl: (args) => {
      if (!args[0]) return ['curl: missing URL'];
      return [`{ "status": "ok", "url": "${args[0]}" }`];
    },
    history: () => history.map((cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`),
    export: (args) => {
      if (!args[0]) return Object.entries(ENV).map(([k, v]) => `declare -x ${k}="${v}"`);
      const eq = args[0].indexOf('=');
      if (eq === -1) return [`export: '${args[0]}': not a valid identifier`];
      ENV[args[0].substring(0, eq)] = args[0].substring(eq + 1).replace(/^["']|["']$/g, '');
      return [];
    },
    env: () => Object.entries(ENV).map(([k, v]) => `${k}=${v}`),
    which: (args) => args[0] ? (commands[args[0]] ? [`/usr/bin/${args[0]}`] : [`${args[0]} not found`]) : ['which: missing argument'],
    alias: (args) => {
      if (!args[0]) return Object.entries(ALIASES).map(([k, v]) => `alias ${k}='${v}'`);
      const eq = args[0].indexOf('=');
      if (eq === -1) return ALIASES[args[0]] ? [`${args[0]}='${ALIASES[args[0]]}'`] : [`${args[0]} not found`];
      ALIASES[args[0].substring(0, eq)] = args[0].substring(eq + 1).replace(/^["']|["']$/g, '');
      return [];
    },
    head: (args) => {
      let n = 10, idx = 0;
      if (args[0] === '-n' && args[1]) { n = parseInt(args[1]) || 10; idx = 2; }
      const text = args.slice(idx).join(' ');
      if (!text) return ['head: missing operand'];
      return text.split('\n').slice(0, n);
    },
    tail: (args) => {
      let n = 10, idx = 0;
      if (args[0] === '-n' && args[1]) { n = parseInt(args[1]) || 10; idx = 2; }
      const text = args.slice(idx).join(' ');
      if (!text) return ['tail: missing operand'];
      return text.split('\n').slice(-n);
    },
    grep: (args) => {
      if (args.length < 2) return ['usage: grep <pattern> <text>'];
      try { const re = new RegExp(args[0], 'g'); return args.slice(1).join(' ').split('\n').filter(l => re.test(l)); }
      catch { return [`grep: invalid pattern: ${args[0]}`]; }
    },
    wc: (args) => {
      const text = args.join(' ');
      if (!text) return ['wc: missing operand'];
      return [`  ${text.split('\n').length}  ${text.split(/\s+/).filter(Boolean).length}  ${text.length}`];
    },
    calc: (args) => {
      const expr = args.join(' ');
      if (!expr) return ['calc: missing expression'];
      try { const r = Function(`"use strict"; return (${expr.replace(/[^0-9+\-*/().%\s]/g, '')})`)(); return [`= ${r}`]; }
      catch { return ['calc: invalid expression']; }
    },
    base64: (args) => { try { return [btoa(args.join(' '))]; } catch { return ['base64: error']; } },
    hexdump: (args) => {
      const text = args.join(' ');
      if (!text) return ['hexdump: missing operand'];
      const out = [];
      for (let i = 0; i < text.length; i += 16) {
        const chunk = text.substring(i, i + 16);
        out.push(`${i.toString(16).padStart(8, '0')}  ${[...chunk].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ').padEnd(48)}  ${[...chunk].map(c => { const code = c.charCodeAt(0); return code >= 32 && code < 127 ? c : '.'; }).join('')}`);
      }
      return out;
    },
    md5sum: (args) => {
      const text = args.join(' ');
      if (!text) return ['md5sum: missing operand'];
      let hash = 0;
      for (let i = 0; i < text.length; i++) { const chr = text.charCodeAt(i); hash = ((hash << 5) - hash) + chr; hash |= 0; }
      return [`${Math.abs(hash).toString(16).padStart(32, '0')}  -`];
    },
    rev: (args) => args.join('') ? [args.join('').split('').reverse().join('')] : ['rev: missing operand'],
    seq: (args) => {
      if (args.length === 1) { const end = parseInt(args[0]); return isNaN(end) ? ['seq: invalid number'] : Array.from({ length: end }, (_, i) => String(i + 1)); }
      if (args.length === 2) { const s = parseInt(args[0]), e = parseInt(args[1]); return (isNaN(s) || isNaN(e)) ? ['seq: invalid number'] : Array.from({ length: e - s + 1 }, (_, i) => String(s + i)); }
      return ['seq: usage: seq [START] END'];
    },
    sl: () => ['      ====        ________                ___________', '  _D _|  |_______/        \\__I_I_____===__|_________|', '   |(_)---  |   H\\________/ |   |        =|___ ___|', '   /     |  |   H  |  |     |   |         ||_| |_||', '  |      |  |   H  |__--------------------| [___] |', '  | ________|___H__/__|_____/[][]~\\_______|       |', '  |/ |   |-----------I_____I [][] []  D   |=======|__', '__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__', ' |/-=|___|=    ||    ||    ||    |______~ ~___|_', '  \\_/      \\O=====O=====O=====O_/      \\__/   \\_/'],
    fortune: () => [colored('accent', FORTUNES[Math.floor(Math.random() * FORTUNES.length)])],
    weather: () => WEATHER_LINES,
    matrix: () => {
      const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789';
      const out = [];
      for (let y = 0; y < 8; y++) {
        let line = '';
        for (let x = 0; x < 60; x++) line += Math.random() > 0.7 ? chars[Math.floor(Math.random() * chars.length)] : ' ';
        out.push(colored('green', line));
      }
      out.push(colored('dim', '\n  Wake up, Neo...'));
      return out;
    },
    touch: (args) => {
      if (!args[0]) return ['touch: missing file operand'];
      const path = resolvePath(args[0]);
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const parent = getNode(parentPath);
      if (!parent || parent.type !== 'dir') return [`touch: cannot create '${args[0]}': No such directory`];
      if (!parent.children[args[0].split('/').pop()]) parent.children[args[0].split('/').pop()] = { type: 'file', content: '' };
      return [];
    },
    mkdir: (args) => {
      if (!args[0]) return ['mkdir: missing operand'];
      const path = resolvePath(args[0]);
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const name = path.split('/').pop();
      const parent = getNode(parentPath);
      if (!parent || parent.type !== 'dir') return [`mkdir: cannot create '${args[0]}': No such directory`];
      if (parent.children[name]) return [`mkdir: cannot create '${args[0]}': File exists`];
      parent.children[name] = { type: 'dir', children: {} };
      return [];
    },
    rm: (args) => {
      if (!args[0]) return ['rm: missing operand'];
      const path = resolvePath(args[0]);
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const parent = getNode(parentPath);
      if (!parent || !parent.children[args[0].split('/').pop()]) return [`rm: cannot remove '${args[0]}': No such file or directory`];
      delete parent.children[args[0].split('/').pop()];
      return [];
    },
    exit: () => ['logout', '', 'Session ended.'],
  };

  const CMD_NAMES = Object.keys(commands);
  const BUILTINS = ['cd', 'export', 'alias', 'unalias', 'source', 'exit', 'type'];

  function processCommand(cmd) {
    let expanded = cmd.trim();
    for (const [name, target] of Object.entries(ALIASES)) {
      if (expanded === name || expanded.startsWith(name + ' ')) { expanded = expanded.replace(name, target); break; }
    }
    const parts = expanded.split(/\s+/);
    const name = parts[0];
    const args = parts.slice(1);
    if (!name) return [];
    if (commands[name]) return commands[name](args);
    const suggestions = CMD_NAMES.filter(c => c.startsWith(name.substring(0, 2)));
    const hint = suggestions.length ? `\n  Did you mean: ${suggestions.slice(0, 3).join(', ')}?` : '';
    const out = [];
    out.push({ type: 'styled', style: 'red', text: `fish: command not found: ${name}` });
    if (hint) out.push({ type: 'styled', style: 'dim', text: hint });
    return out;
  }

  function highlightInput(text) {
    if (!text) return [];
    const segments = [];
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === '"' || ch === "'") {
        const quote = text[i++];
        let str = quote;
        while (i < text.length && text[i] !== quote) str += text[i++];
        if (i < text.length) str += text[i++];
        segments.push({ text: str, color: 'var(--orange)' });
      } else if (ch === '$') {
        let varName = text[i++];
        while (i < text.length && /[a-zA-Z0-9_]/.test(text[i])) varName += text[i++];
        segments.push({ text: varName, color: 'var(--purple)' });
      } else if (ch === ' ') {
        let ws = '';
        while (i < text.length && text[i] === ' ') ws += text[i++];
        segments.push({ text: ws, color: null });
      } else if (/\d/.test(ch)) {
        let num = '';
        while (i < text.length && /[\d.]/.test(text[i])) num += text[i++];
        segments.push({ text: num, color: 'var(--purple)' });
      } else if (ch === '-' && i + 1 < text.length && /[a-zA-Z]/.test(text[i + 1])) {
        let flag = text[i++];
        while (i < text.length && /[a-zA-Z0-9]/.test(text[i])) flag += text[i++];
        segments.push({ text: flag, color: 'var(--aqua)' });
      } else if ('|&;><'.includes(ch)) {
        let op = text[i++];
        if (i < text.length && (op + text[i] === '||' || op + text[i] === '&&' || op + text[i] === '>>')) op += text[i++];
        segments.push({ text: op, color: 'var(--dim)' });
      } else if (ch === '~' || ch === '/' || (ch === '.' && (i + 1 >= text.length || '/.'.includes(text[i + 1])))) {
        let path = '';
        while (i < text.length && !' \t|&;><"\''.includes(text[i])) path += text[i++];
        segments.push({ text: path, color: 'var(--blue)' });
      } else {
        let word = '';
        while (i < text.length && !' \t|&;><"\'$'.includes(text[i])) word += text[i++];
        const wordCount = text.substring(0, text.indexOf(word)).trim().split(/\s+/).length;
        if (wordCount === 1) {
          const isKnown = CMD_NAMES.includes(word) || BUILTINS.includes(word);
          let color = 'var(--fg)';
          if (word === 'sudo') color = 'var(--red)';
          else if (word === 'rm' || word === 'chmod') color = 'var(--red)';
          else if (isKnown || ALIASES[word]) color = 'var(--accent)';
          else color = 'var(--red)';
          segments.push({ text: word, color });
        } else {
          segments.push({ text: word, color: null });
        }
      }
    }
    return segments;
  }

  function highlightCommand(text) {
    if (!text) return [];
    const parts = text.split(/(\s+)/);
    const result = [];
    let cmdFound = false;
    for (const part of parts) {
      if (/^\s+$/.test(part)) { result.push({ text: part, color: null }); continue; }
      if (!cmdFound) {
        cmdFound = true;
        const isKnown = CMD_NAMES.includes(part) || BUILTINS.includes(part);
        let color = 'var(--fg)';
        if (part === 'sudo') color = 'var(--red)';
        else if (part === 'rm' || part === 'chmod') color = 'var(--red)';
        else if (isKnown || ALIASES[part]) color = 'var(--accent)';
        else color = 'var(--red)';
        result.push({ text: part, color });
      } else if (part.startsWith('-')) {
        result.push({ text: part, color: 'var(--aqua)' });
      } else {
        result.push({ text: part, color: null });
      }
    }
    return result;
  }

  let liveHighlight = $derived(highlightInput(input));

  function onKeydown(e) {
    if (searchMode) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchMode = false;
        if (searchResults.length) {
          input = searchResults[searchIdx];
          updateSuggestion();
        }
        searchQuery = '';
        return;
      }
      if (e.key === 'Escape') { searchMode = false; searchQuery = ''; return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); searchIdx = Math.min(searchIdx + 1, searchResults.length - 1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); searchIdx = Math.max(searchIdx - 1, 0); return; }
      if (e.key === 'Backspace') { searchQuery = searchQuery.slice(0, -1); filterSearch(); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) { searchQuery += e.key; filterSearch(); return; }
      return;
    }

    if (e.key === 'Enter') {
      const cmd = input;
      const p = getPrompt();
      const promptStr = `\x1b[32m${p.user}@${p.host}\x1b[0m:\x1b[34m${p.dir}\x1b[0m> `;
      lines = [...lines, { type: 'input', prompt: promptStr, text: cmd }];
      if (cmd.trim()) { history.push(cmd); historyIdx = history.length; }
      const output = processCommand(cmd);
      for (const line of output) lines = [...lines, typeof line === 'string' ? { type: 'output', text: line } : line];
      lines = [...lines, { type: 'output', text: '' }];
      input = '';
      savedInput = '';
      suggestion = '';
      setTimeout(() => { if (termEl) termEl.scrollTop = termEl.scrollHeight; }, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      if (historyIdx === history.length) savedInput = input;
      if (historyIdx > 0) { historyIdx--; input = history[historyIdx]; }
      updateSuggestion();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx < history.length - 1) { historyIdx++; input = history[historyIdx]; }
      else if (historyIdx === history.length - 1) { historyIdx = history.length; input = savedInput; }
      updateSuggestion();
    } else if (e.key === 'ArrowRight') {
      if (suggestion && input.length > 0) {
        e.preventDefault();
        input = input + suggestion;
        suggestion = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completions = getCompletions(input);
      if (completions.length === 1) {
        const parts = input.split(/\s+/);
        parts[parts.length - 1] = completions[0];
        input = parts.join(' ');
        updateSuggestion();
      } else if (completions.length > 1) {
        const p = getPrompt();
        lines = [...lines, { type: 'input', prompt: `\x1b[32m${p.user}@${p.host}\x1b[0m:\x1b[34m${p.dir}\x1b[0m> `, text: input }];
        lines = [...lines, { type: 'output', text: completions.join('  ') }, { type: 'output', text: '' }];
      }
    } else if (e.key === 'r' && e.ctrlKey) {
      e.preventDefault();
      searchMode = true;
      searchQuery = '';
      searchResults = [];
      searchIdx = 0;
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      lines = [];
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      const p = getPrompt();
      lines = [...lines, { type: 'input', prompt: `\x1b[32m${p.user}@${p.host}\x1b[0m:\x1b[34m${p.dir}\x1b[0m> `, text: input + '^C' }, { type: 'output', text: '' }];
      input = '';
      suggestion = '';
    } else if (e.key === 'a' && e.ctrlKey) {
      e.preventDefault();
    } else if (e.key === 'e' && e.ctrlKey) {
      e.preventDefault();
    } else if (e.key === 'w' && e.ctrlKey) {
      e.preventDefault();
      input = input.replace(/\S+\s*$/, '');
      updateSuggestion();
    } else if (e.key === 'u' && e.ctrlKey) {
      e.preventDefault();
      input = '';
      suggestion = '';
    } else {
      setTimeout(updateSuggestion, 0);
    }
  }

  function filterSearch() {
    searchResults = history.filter(h => h.includes(searchQuery));
    searchIdx = searchResults.length - 1;
  }

  function focusInput() { inputEl?.focus(); }

  function promptHtml(p) { return `${p.user}@${p.host}:${p.dir}>`; }
</script>

<div
  class="terminal"
  style="--bg: {t.bgDark}; --fg: {t.fg}; --accent: {t.green}; --dim: {t.fgDim}; --red: {t.red}; --blue: {t.blue}; --orange: {t.orange}; --purple: {t.purple}; --aqua: {t.aqua};"
  onmousedown={focusInput}
  role="textbox"
  tabindex="-1"
>
  <div class="term-output" bind:this={termEl}>
    {#if lines.length === 0}
      <div class="term-line welcome">
        <span style="color: {t.green}; font-weight: bold;">Welcome to fish</span> <span style="color: {t.fgDim};">Type</span> <span style="color: {t.green};">help</span> <span style="color: {t.fgDim};">for commands, or</span> <span style="color: {t.green};">man</span> <span style="color: {t.fgDim};">for manual.</span>
      </div>
    {/if}
    {#each lines as line}
      {#if line.type === 'input'}
        <div class="term-line">
          <span class="prompt-user">{getPrompt().user}@{getPrompt().host}</span><span class="prompt-sep">:</span><span class="prompt-dir">{getPrompt().dir}</span><span class="prompt-char">&gt; </span>
          <span class="input-text">
            {#each highlightCommand(line.text) as seg}
              {#if seg.color}
                <span style="color: {seg.color};">{seg.text}</span>
              {:else}
                <span>{seg.text}</span>
              {/if}
            {/each}
          </span>
        </div>
      {:else if line.type === 'styled'}
        <div class="term-line">
          {#if line.style === 'accent'}
            <span style="color: var(--accent);">{line.text}</span>
          {:else if line.style === 'dim'}
            <span style="color: var(--dim);">{line.text}</span>
          {:else if line.style === 'red'}
            <span style="color: var(--red);">{line.text}</span>
          {:else if line.style === 'green'}
            <span style="color: var(--accent);">{line.text}</span>
          {:else if line.style === 'blue'}
            <span style="color: var(--blue);">{line.text}</span>
          {:else}
            <span>{line.text}</span>
          {/if}
        </div>
      {:else if line.type === 'fastfetch-line'}
        <div class="term-line ff-line">
          <span class="ff-logo" style="color: {t.green};">{line.logo}</span>
          <span class="ff-info">
            {#if line.info}
              <span style="color: {t.accent}; font-weight: bold;">{line.info.label}</span><span style="color: {t.dim};">: </span><span style="color: {t.fg};">{line.info.value}</span>
            {/if}
          </span>
        </div>
      {:else if line.type === 'fastfetch-bar'}
        <div class="term-line ff-bar">
          <span style="color: {t.dim};">                        </span>
          <span style="color: {t.red};">{`█`.repeat(4)}</span><span style="color: {t.orange};">{`█`.repeat(4)}</span><span style="color: {t.green};">{`█`.repeat(4)}</span><span style="color: {t.blue};">{`█`.repeat(4)}</span><span style="color: {t.purple};">{`█`.repeat(4)}</span>
        </div>
      {:else}
        <div class="term-line">{@html line.text}</div>
      {/if}
    {/each}

    {#if searchMode}
      <div class="term-line search-bar">
        <span style="color: {t.orange};">(reverse-i-search)`</span><span style="color: {t.fg};">{searchQuery}</span><span style="color: {t.orange};">': </span>
        <span style="color: {t.green};">{searchResults[searchIdx] || ''}</span>
      </div>
    {/if}

    <div class="term-input-line">
      <span class="prompt-user">{getPrompt().user}@{getPrompt().host}</span><span class="prompt-sep">:</span><span class="prompt-dir">{getPrompt().dir}</span><span class="prompt-char">&gt; </span>
      <div class="input-wrapper">
        <span class="input-overlay" aria-hidden="true">
          {#each liveHighlight as seg}
            {#if seg.color}
              <span style="color: {seg.color};">{seg.text}</span>
            {:else}
              <span>{seg.text}</span>
            {/if}
          {/each}
          {#if suggestion}
            <span class="ghost">{suggestion}</span>
          {/if}
        </span>
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
</div>

<style>
  .terminal {
    height: 100%;
    background: transparent;
    color: var(--fg);
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
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

  .welcome {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--dim);
    opacity: 0.3;
    font-size: 12px;
  }

  .prompt-user {
    color: var(--accent);
    font-weight: bold;
  }
  .prompt-sep {
    color: var(--dim);
  }
  .prompt-dir {
    color: var(--blue);
    font-weight: bold;
  }
  .prompt-char {
    color: var(--dim);
  }

  .input-text {
    color: var(--fg);
  }

  .term-input-line {
    display: flex;
    line-height: 1.6;
    position: relative;
  }

  .input-wrapper {
    flex: 1;
    position: relative;
  }

  .input-overlay {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    white-space: pre;
    font-family: inherit;
    font-size: inherit;
    line-height: 1.6;
  }

  .ghost {
    color: var(--dim);
    opacity: 0.5;
  }

  .term-input {
    width: 100%;
    background: transparent;
    border: none;
    color: transparent;
    font-family: inherit;
    font-size: inherit;
    outline: none;
    caret-color: var(--accent);
    position: relative;
    z-index: 1;
  }

  .search-bar {
    margin-bottom: 4px;
  }

  .ff-line {
    display: flex;
    white-space: pre;
  }

  .ff-logo {
    min-width: 280px;
    flex-shrink: 0;
  }

  .ff-info {
    white-space: pre;
  }

  .ff-bar {
    white-space: pre;
    line-height: 1.2;
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
