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
            'README.md': { type: 'file', content: '# WebOS Portfolio\n\nMade by Abror Ismoiljanov.\nLinux soul, KDE heart, Gruvbox blood.' },
            'notes.txt': { type: 'file', content: 'Remember to push rune and genesis to GitHub.' },
          }
        },
        'Downloads': { type: 'dir', children: {} },
        'Projects': {
          type: 'dir',
          children: {
            'genesis-engine': { type: 'dir', children: { 'CMakeLists.txt': { type: 'file', content: 'cmake_minimum_required(VERSION 3.20)' }, 'src': { type: 'dir', children: { 'main.cpp': { type: 'file', content: '// engine entry point' } } } } },
            'cart': { type: 'dir', children: { 'Cargo.toml': { type: 'file', content: '[package]\nname = "cart"\nversion = "0.1.0"' } } },
            'rune': { type: 'dir', children: { 'Cargo.toml': { type: 'file', content: '[package]\nname = "rune"' }, 'src': { type: 'dir', children: { 'main.rs': { type: 'file', content: 'fn main() { println!("rune"); }' } } } } },
            'mp': { type: 'dir', children: { 'Cargo.toml': { type: 'file', content: '[package]\nname = "mp"' } } },
            'hlidk': { type: 'dir', children: {} },
          }
        },
        'Builds': { type: 'dir', children: {} },
        'Games': { type: 'dir', children: {} },
        'Music': { type: 'dir', children: {} },
        'Videos': { type: 'dir', children: {} },
        'RustProj': { type: 'dir', children: {} },
        'GoProj': { type: 'dir', children: {} },
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

  const history = $state([]);
  let historyIdx = $state(-1);
  let savedInput = $state('');
  let input = $state('');
  let inputEl;
  let termEl;
  let lines = $state([
    { type: 'banner' },
    { type: 'output', text: '' },
  ]);

  const ALIASES = {
    'll': 'ls -la',
    'la': 'ls -a',
    '..': 'cd ..',
  };

  const ENV = {
    USER: 'krubka',
    HOME: '/home/krubka',
    SHELL: '/bin/websh',
    TERM: 'xterm-256color',
    EDITOR: 'nvim',
    LANG: 'en_US.UTF-8',
    PATH: '/usr/local/bin:/usr/bin:/bin',
    HOSTNAME: 'webos',
  };

  function getCompletions(partial) {
    const parts = partial.split(/\s+/);
    const cmdNames = Object.keys(commands);

    if (parts.length <= 1) {
      return cmdNames.filter(c => c.startsWith(parts[0]));
    }

    const cmd = parts[0];
    const pathPart = parts[parts.length - 1];
    const dir = pathPart.includes('/') ? resolvePath(pathPart.substring(0, pathPart.lastIndexOf('/') + 1) || '/') : cwd;
    const prefix = pathPart.includes('/') ? pathPart.substring(pathPart.lastIndexOf('/') + 1) : pathPart;
    const entries = listDir(dir) || [];
    return entries.filter(e => e.startsWith(prefix));
  }

  const COMMAND_LIST = [
    'help', 'about', 'projects', 'skills', 'clear', 'whoami', 'neofetch',
    'ls', 'cd', 'pwd', 'cat', 'echo', 'date', 'cowsay', 'sudo',
    'tree', 'man', 'ps', 'top', 'df', 'free', 'uname', 'uptime',
    'ping', 'curl', 'history', 'export', 'env', 'head', 'tail',
    'grep', 'wc', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'chmod',
    'which', 'type', 'alias', 'unalias', 'source', 'exit',
    'matrix', 'fortune', 'weather', 'calc', 'base64', 'md5sum',
    'hexdump', 'rev', 'seq', 'yes', 'sl',
  ];

  const FORTUNES = [
    'The best way to predict the future is to implement it.',
    'There are only two hard things in CS: cache invalidation and naming things.',
    'It works on my machine. Ship it!',
    'Weeks of coding can save you hours of planning.',
    'Talk is cheap. Show me the code. — Linus Torvalds',
    'First, solve the problem. Then, write the code. — John Johnson',
    'Any fool can write code that a computer can understand. Good programmers write code that humans can understand. — Martin Fowler',
    'Programs must be written for people to read, and only incidentally for machines to execute. — Abelson & Sussman',
    'Simplicity is prerequisite for reliability. — Edsger W. Dijkstra',
    'The most dangerous phrase is: We\'ve always done it this way. — Grace Hopper',
  ];

  const WEATHER_LINES = [
    'Weather for Tashkent, UZ',
    '',
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
    tree: 'tree [dir] — Display directory tree.\n  Shows nested structure with indentation.',
    grep: 'grep <pattern> <text> — Search for pattern.\n  Basic regex support.',
    head: 'head [-n N] <text> — Print first N lines (default 10).',
    tail: 'tail [-n N] <text> — Print last N lines (default 10).',
    wc: 'wc <text> — Count lines, words, characters.',
    ps: 'ps — List running processes.',
    top: 'top — System monitor (snapshot).',
    df: 'df — Disk usage overview.',
    free: 'free — Memory usage overview.',
    uname: 'uname [-a] — System information.',
    uptime: 'uptime — System uptime.',
    ping: 'ping <host> — Test connectivity.',
    curl: 'curl <url> — Fetch URL contents.',
    export: 'export KEY=VALUE — Set environment variable.',
    history: 'history — Show command history.',
    base64: 'base64 <text> — Encode to base64.',
    hexdump: 'hexdump <text> — Hex representation.',
    calc: 'calc <expr> — Evaluate math expression.',
    man: 'man <cmd> — Show manual page.',
  };

  function getPrompt() {
    const display = cwd === '/home/krubka' ? '~' : cwd;
    return { user: 'krubka', host: 'webos', dir: display };
  }

  function colored(type, text) {
    return { type: 'styled', style: type, text };
  }

  const commands = {
    help: () => {
      const grouped = [
        ['NAVIGATION', ['ls', 'cd', 'pwd', 'tree']],
        ['FILES', ['cat', 'echo', 'head', 'tail', 'grep', 'wc', 'touch', 'mkdir', 'rm']],
        ['SYSTEM', ['ps', 'top', 'df', 'free', 'uname', 'uptime', 'neofetch', 'whoami', 'date']],
        ['NETWORK', ['ping', 'curl']],
        ['UTILS', ['history', 'export', 'env', 'which', 'type', 'calc', 'base64', 'hexdump', 'rev', 'seq', 'md5sum']],
        ['FUN', ['cowsay', 'fortune', 'weather', 'matrix', 'sl']],
        ['MISC', ['man', 'alias', 'clear', 'sudo', 'exit']],
      ];
      const out = [colored('accent', '  WebOS Shell v2.0 — Commands:\n')];
      for (const [cat, cmds] of grouped) {
        out.push(colored('dim', `  ${cat}:`));
        out.push({ type: 'output', text: `    ${cmds.join('  ')}` });
      }
      out.push({ type: 'output', text: '' });
      out.push(colored('dim', '  Type "man <cmd>" for details. Tab completes.'));
      return out;
    },
    about: () => [
      colored('green', 'Abror Ismoiljanov'),
      { type: 'output', text: '17y/o systems programmer from Tashkent.' },
      { type: 'output', text: 'Building game engines, tooling, and low-level software.' },
      { type: 'output', text: 'C++, Rust, Linux. Arch btw.' },
    ],
    projects: () => [
      colored('accent', '  Name              Language    Description'),
      colored('dim', '  ─────────────────────────────────────────────'),
      '  genesis-engine    C++         Game engine editor with ECS, Lua, ImGui',
      '  cart              Rust        Cargo for C++ — build tool & package manager',
      '  rune              Rust        Editor framework (egui + wgpu)',
      '  amp               C++         CLI music player',
      '  ale               C++         Abror\'s Level Editor',
      '  voxel-engine      C++         Tiny voxel world renderer',
      '  hlidk             Rust        Bevy game project',
      '  mp                Rust        Audio library (cpal/symphonia)',
    ],
    skills: () => [
      colored('accent', '  Category          Skills'),
      colored('dim', '  ─────────────────────────────────────────────'),
      '  Languages         C++, Rust, JavaScript, Go, Python',
      '  Graphics          OpenGL, wgpu, Vulkan (learning)',
      '  Engines           Custom ECS, ImGui, SDL2, Bevy, macroquad',
      '  Systems           Build tools, editors, scripting runtimes',
      '  OS                Arch Linux, custom kernel configs',
      '  Tools             CMake, xmake, cargo, git, neovim',
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
            out.push(`drwxr-xr-x  2 krubka krubka  4096  Jul 11 12:00 ${colored('dir', e)}`);
            continue;
          }
          const child = node.children[e];
          const isDir = child.type === 'dir';
          const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
          const size = isDir ? '4096' : String(child.content?.length || 0).padStart(4);
          const name = isDir ? colored('dir', e + '/') : e;
          out.push(`${perms}  1 krubka krubka  ${size}  Jul 11 12:00 ${name}`);
        }
        return out;
      }

      return [entries.map(e => {
        if (e === '.' || e === '..') return colored('dir', e);
        const child = node.children[e];
        return child.type === 'dir' ? colored('dir', e + '/') : e;
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

      const out = [colored('dir', target === '/' ? '/' : target.split('/').pop() + '/')];
      let dirs = 0, files = 0;

      function walk(n, prefix) {
        const entries = Object.keys(n.children).sort();
        entries.forEach((name, i) => {
          const isLast = i === entries.length - 1;
          const connector = isLast ? '└── ' : '├── ';
          const child = n.children[name];
          const isDir = child.type === 'dir';
          if (isDir) dirs++; else files++;
          const display = isDir ? colored('dir', name + '/') : name;
          out.push(`${prefix}${connector}${display}`);
          if (isDir) {
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            walk(child, newPrefix);
          }
        });
      }

      walk(node, '');
      out.push('');
      out.push(colored('dim', `${dirs} directories, ${files} files`));
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
      for (const [k, v] of Object.entries(ENV)) {
        text = text.replaceAll(`$${k}`, v);
      }
      return [text];
    },
    date: () => [new Date().toString()],
    cowsay: (args) => {
      const msg = args.join(' ') || 'moo';
      const line = '-'.repeat(msg.length + 2);
      return [
        colored('dim', line),
        colored('dim', `< `) + msg + colored('dim', ` >`),
        colored('dim', line),
        '        \\   ^__^',
        '         \\  (oo)\\_______',
        '            (__)\\       )\\/\\',
        '                ||----w |',
        '                ||     ||',
      ];
    },
    clear: () => { lines = []; return []; },
    sudo: () => [
      colored('dim', '[sudo] password for krubka: '),
      colored('red', 'Permission denied. Nice try though. ;)')
    ],
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
      ' 1024 ?        00:00:45 waybar',
      ' 1337 ?        00:00:01 kwin',
      ` ${Math.floor(Math.random() * 9000) + 1000} ?        00:00:00 ps`,
    ],
    top: () => [
      colored('accent', 'top - webos up time: 14 days, 3:42'),
      colored('dim', 'Tasks: 247 total, 1 running, 246 sleeping'),
      '',
      colored('accent', '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND'),
      '  890 krubka   20   0  128456  45632  32100 S  12.3   2.8   1:23.45 nvim',
      ' 1024 krubka   20   0   34520  12800   8900 S   5.1   0.8   0:45.12 waybar',
      ' 1337 krubka   20   0  234500  78900  45600 S   3.2   4.9   0:12.34 kwin',
      '    1 root      20   0  168200  12300   8700 S   0.3   0.8   2:34.56 systemd',
      '',
      colored('dim', 'MiB Mem:  16384.0 total,   4096.0 free,   8192.0 used,   4096.0 buff/cache'),
      colored('dim', 'MiB Swap:  8192.0 total,   8000.0 free,    192.0 used.   7500.0 avail Mem'),
    ],
    df: () => [
      colored('accent', 'Filesystem      Size  Used Avail Use% Mounted on'),
      '/dev/sda2       500G  180G  320G  36% /',
      '/dev/sda1       512M  128M  384M  25% /boot/efi',
      'tmpfs           8.0G  1.2M  8.0G   1% /tmp',
      '/dev/sdb1         1T  450G  550G  45% /home',
    ],
    free: () => [
      colored('accent', '              total        used        free      shared  buff/cache   available'),
      'Mem:       16384000     8192000     4096000      256000     4096000     7500000',
      'Swap:       8192000      192000     8000000',
      '',
      colored('dim', '  Physical: 8.0 GiB used / 16.0 GiB total (50%)'),
      colored('dim', '  Swap:     188 MiB used /  8.0 GiB total ( 2%)'),
    ],
    uname: (args) => {
      if (args.includes('-a')) return ['WebOS 6.1.0-arch1-1 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux'];
      return ['WebOS'];
    },
    uptime: () => {
      const up = '14 days, 3:42';
      const users = 1;
      const load = [0.42, 0.38, 0.35];
      return [` 12:42:07 up ${up},  ${users} user,  load average: ${load.join(', ')}`];
    },
    ping: (args) => {
      if (!args[0]) return ['ping: missing host operand'];
      const host = args[0];
      return [
        `PING ${host} (${Math.floor(Math.random()*223)+1}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}) 56(84) bytes of data.`,
        `64 bytes from ${host}: icmp_seq=1 ttl=56 time=${(Math.random()*20+5).toFixed(1)} ms`,
        `64 bytes from ${host}: icmp_seq=2 ttl=56 time=${(Math.random()*20+5).toFixed(1)} ms`,
        `64 bytes from ${host}: icmp_seq=3 ttl=56 time=${(Math.random()*20+5).toFixed(1)} ms`,
        '',
        `--- ${host} ping statistics ---`,
        `3 packets transmitted, 3 received, 0% packet loss`,
      ];
    },
    curl: (args) => {
      if (!args[0]) return ['curl: missing URL'];
      const url = args[0];
      return [
        colored('dim', `  % Total    % Xferd  Average Speed`),
        colored('dim', `                          Dload  Upload   Total`),
        `{ "status": "ok", "url": "${url}", "message": "This is a simulated response." }`,
      ];
    },
    history: () => {
      return history.map((cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`);
    },
    export: (args) => {
      if (!args[0]) return Object.entries(ENV).map(([k, v]) => `declare -x ${k}="${v}"`);
      const eq = args[0].indexOf('=');
      if (eq === -1) return [`export: '${args[0]}': not a valid identifier`];
      const key = args[0].substring(0, eq);
      const val = args[0].substring(eq + 1).replace(/^["']|["']$/g, '');
      ENV[key] = val;
      return [];
    },
    env: () => Object.entries(ENV).map(([k, v]) => `${k}=${v}`),
    which: (args) => {
      if (!args[0]) return ['which: missing argument'];
      return commands[args[0]] ? [`/usr/bin/${args[0]}`] : [`${args[0]} not found`];
    },
    type: (args) => {
      if (!args[0]) return ['type: missing argument'];
      if (ALIASES[args[0]]) return [`${args[0]} is aliased to \`${ALIASES[args[0]]}'`];
      return commands[args[0]] ? [`${args[0]} is /usr/bin/${args[0]}`] : [`-bash: type: ${args[0]} not found`];
    },
    alias: (args) => {
      if (!args[0]) return Object.entries(ALIASES).map(([k, v]) => `alias ${k}='${v}'`);
      const eq = args[0].indexOf('=');
      if (eq === -1) return ALIASES[args[0]] ? [`${args[0]}='${ALIASES[args[0]]}'`] : [`${args[0]} not found`];
      const name = args[0].substring(0, eq);
      const val = args[0].substring(eq + 1).replace(/^["']|["']$/g, '');
      ALIASES[name] = val;
      return [];
    },
    head: (args) => {
      let n = 10;
      let textIdx = 0;
      if (args[0] === '-n' && args[1]) { n = parseInt(args[1]) || 10; textIdx = 2; }
      const text = args.slice(textIdx).join(' ');
      if (!text) return ['head: missing operand'];
      return text.split('\n').slice(0, n);
    },
    tail: (args) => {
      let n = 10;
      let textIdx = 0;
      if (args[0] === '-n' && args[1]) { n = parseInt(args[1]) || 10; textIdx = 2; }
      const text = args.slice(textIdx).join(' ');
      if (!text) return ['tail: missing operand'];
      const lines = text.split('\n');
      return lines.slice(-n);
    },
    grep: (args) => {
      if (args.length < 2) return ['usage: grep <pattern> <text>'];
      const pattern = args[0];
      const text = args.slice(1).join(' ');
      try {
        const re = new RegExp(pattern, 'g');
        return text.split('\n').filter(l => re.test(l));
      } catch {
        return [`grep: invalid pattern: ${pattern}`];
      }
    },
    wc: (args) => {
      const text = args.join(' ');
      if (!text) return ['wc: missing operand'];
      const lines = text.split('\n').length;
      const words = text.split(/\s+/).filter(Boolean).length;
      const chars = text.length;
      return [`  ${lines}  ${words}  ${chars}`];
    },
    calc: (args) => {
      const expr = args.join(' ');
      if (!expr) return ['calc: missing expression'];
      try {
        const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
        if (sanitized !== expr) return ['calc: invalid characters in expression'];
        const result = Function(`"use strict"; return (${sanitized})`)();
        return [`= ${result}`];
      } catch {
        return ['calc: invalid expression'];
      }
    },
    base64: (args) => {
      const text = args.join(' ');
      if (!text) return ['base64: missing operand'];
      try { return [btoa(text)]; } catch { return ['base64: encoding error']; }
    },
    hexdump: (args) => {
      const text = args.join(' ');
      if (!text) return ['hexdump: missing operand'];
      const out = [];
      for (let i = 0; i < text.length; i += 16) {
        const chunk = text.substring(i, i + 16);
        const hex = [...chunk].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
        const ascii = [...chunk].map(c => { const code = c.charCodeAt(0); return code >= 32 && code < 127 ? c : '.'; }).join('');
        out.push(`${i.toString(16).padStart(8, '0')}  ${hex.padEnd(48)}  ${ascii}`);
      }
      return out;
    },
    md5sum: (args) => {
      const text = args.join(' ');
      if (!text) return ['md5sum: missing operand'];
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        const chr = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
      }
      return [`${Math.abs(hash).toString(16).padStart(32, '0')}  -`];
    },
    rev: (args) => {
      const text = args.join(' ');
      if (!text) return ['rev: missing operand'];
      return [text.split('').reverse().join('')];
    },
    seq: (args) => {
      if (args.length === 1) {
        const end = parseInt(args[0]);
        if (isNaN(end)) return ['seq: invalid number'];
        return Array.from({ length: end }, (_, i) => String(i + 1));
      }
      if (args.length === 2) {
        const start = parseInt(args[0]), end = parseInt(args[1]);
        if (isNaN(start) || isNaN(end)) return ['seq: invalid number'];
        return Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
      }
      return ['seq: usage: seq [START] END'];
    },
    yes: () => ['y', 'y', 'y', 'y', 'y', '(ok you get the idea)'],
    sl: () => [
      '      ====        ________                ___________',
      '  _D _|  |_______/        \\__I_I_____===__|_________|',
      '   |(_)---  |   H\\________/ |   |        =|___ ___|',
      '   /     |  |   H  |  |     |   |         ||_| |_||',
      '  |      |  |   H  |__--------------------| [___] |',
      '  | ________|___H__/__|_____/[][]~\\_______|       |',
      '  |/ |   |-----------I_____I [][] []  D   |=======|__',
      '__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__',
      ' |/-=|___|=    ||    ||    ||    |______~ ~___|_',
      '  \\_/      \\O=====O=====O=====O_/      \\__/   \\_/',
    ],
    fortune: () => [colored('accent', FORTUNES[Math.floor(Math.random() * FORTUNES.length)])],
    weather: () => WEATHER_LINES,
    matrix: () => {
      const chars = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789';
      const out = [];
      for (let y = 0; y < 8; y++) {
        let line = '';
        for (let x = 0; x < 60; x++) {
          line += Math.random() > 0.7 ? chars[Math.floor(Math.random() * chars.length)] : ' ';
        }
        out.push(colored('green', line));
      }
      out.push('');
      out.push(colored('dim', '  Wake up, Neo...'));
      return out;
    },
    touch: (args) => {
      if (!args[0]) return ['touch: missing file operand'];
      const path = resolvePath(args[0]);
      const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
      const name = path.split('/').pop();
      const parent = getNode(parentPath);
      if (!parent || parent.type !== 'dir') return [`touch: cannot create '${args[0]}': No such directory`];
      if (!parent.children[name]) parent.children[name] = { type: 'file', content: '' };
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
      const name = path.split('/').pop();
      const parent = getNode(parentPath);
      if (!parent || !parent.children[name]) return [`rm: cannot remove '${args[0]}': No such file or directory`];
      delete parent.children[name];
      return [];
    },
    exit: () => ['logout', '', 'Session ended. (Just a simulation :) )'],
  };

  function findCommand(partial) {
    const all = Object.keys(commands);
    const matches = all.filter(c => c.startsWith(partial));
    if (matches.length === 1) return matches[0];
    return null;
  }

  function processCommand(cmd) {
    let expanded = cmd.trim();
    for (const [name, target] of Object.entries(ALIASES)) {
      if (expanded === name || expanded.startsWith(name + ' ')) {
        expanded = expanded.replace(name, target);
        break;
      }
    }

    const parts = expanded.split(/\s+/);
    const name = parts[0];
    const args = parts.slice(1);

    if (!name) return [];

    if (commands[name]) return commands[name](args);

    const suggestions = Object.keys(commands).filter(c => c.startsWith(name.substring(0, 2)));
    const hint = suggestions.length ? `\n  Did you mean: ${suggestions.slice(0, 3).join(', ')}?` : '';
    return [colored('red', `websh: command not found: ${name}`) + hint];
  }

  function onKeydown(e) {
    if (e.key === 'Enter') {
      const cmd = input;
      const prompt = getPrompt();
      const promptStr = `${prompt.user}@${prompt.host}:${prompt.dir}$ `;
      lines = [...lines, { type: 'input', prompt: promptStr, text: cmd }];

      if (cmd.trim()) {
        history.push(cmd);
        historyIdx = history.length;
      }

      const output = processCommand(cmd);
      for (const line of output) {
        if (typeof line === 'string') {
          lines = [...lines, { type: 'output', text: line }];
        } else {
          lines = [...lines, line];
        }
      }
      lines = [...lines, { type: 'output', text: '' }];
      input = '';
      savedInput = '';
      setTimeout(() => {
        if (termEl) termEl.scrollTop = termEl.scrollHeight;
      }, 0);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      if (historyIdx === history.length) savedInput = input;
      if (historyIdx > 0) {
        historyIdx--;
        input = history[historyIdx];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        historyIdx++;
        input = history[historyIdx];
      } else if (historyIdx === history.length - 1) {
        historyIdx = history.length;
        input = savedInput;
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const completions = getCompletions(input);
      if (completions.length === 1) {
        const parts = input.split(/\s+/);
        parts[parts.length - 1] = completions[0];
        input = parts.join(' ');
      } else if (completions.length > 1) {
        const prompt = getPrompt();
        const promptStr = `${prompt.user}@${prompt.host}:${prompt.dir}$ `;
        lines = [...lines, { type: 'input', prompt: promptStr, text: input }];
        lines = [...lines, { type: 'output', text: completions.join('  ') }];
        lines = [...lines, { type: 'output', text: '' }];
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      lines = [];
    } else if (e.key === 'c' && e.ctrlKey) {
      e.preventDefault();
      const prompt = getPrompt();
      const promptStr = `${prompt.user}@${prompt.host}:${prompt.dir}$ `;
      lines = [...lines, { type: 'input', prompt: promptStr, text: input + '^C' }];
      lines = [...lines, { type: 'output', text: '' }];
      input = '';
    }
  }

  function focusInput() {
    inputEl?.focus();
  }
</script>

<div
  class="terminal"
  style="--bg: {t.bgDark}; --fg: {t.fg}; --accent: {t.green}; --dim: {t.fgDim}; --red: {t.red}; --blue: {t.blue}; --orange: {t.orange}; --purple: {t.purple}; --aqua: {t.aqua};"
  onmousedown={focusInput}
  role="textbox"
  tabindex="-1"
>
  <div class="term-output" bind:this={termEl}>
    {#each lines as line}
      {#if line.type === 'banner'}
        <div class="term-line banner">
          <span class="banner-art">{@html `<span style="color:${t.orange}">███</span><span style="color:${t.green}">███</span><span style="color:${t.blue}">███</span>`}  WebOS Terminal</span>
          <span class="banner-sub">Type <span style="color:{t.green}">help</span> for commands · <span style="color:{t.green}">man</span> for manual</span>
        </div>
      {:else if line.type === 'input'}
        <div class="term-line">
          <span class="prompt">{line.prompt}</span><span class="input-text">{line.text}</span>
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
      {:else}
        <div class="term-line">
          {@html line.text}
        </div>
      {/if}
    {/each}
    <div class="term-input-line">
      <span class="prompt">{getPrompt().user}@{getPrompt().host}:{getPrompt().dir}$ </span>
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

  .banner {
    margin-bottom: 4px;
  }
  .banner-art {
    font-size: 14px;
    font-weight: bold;
  }
  .banner-sub {
    display: block;
    color: var(--dim);
    font-size: 12px;
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
