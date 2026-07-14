<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';

  let t = $derived(themes[$currentTheme]);

  let projects = $derived([
    {
      name: 'Genesis Game Engine',
      lang: 'C++',
      desc: 'Full game engine editor with ECS, scene management, Lua scripting via sol2, ImGui-based UI with docking, viewport panel, terminal, collision system, and custom renderer.',
      tags: ['ECS', 'SDL2', 'OpenGL', 'ImGui', 'Lua', 'CMake'],
      url: 'https://github.com/Abrorismoiljanov/Genesis-Game-Engine',
      color: t.green
    },
    {
      name: 'cart',
      lang: 'Rust',
      desc: 'Cargo for C++ — a build tool and package manager that doesn\'t suck. Fetches, builds, and links C++ dependencies cleanly.',
      tags: ['Rust', 'Build System', 'Package Manager', 'C++'],
      url: 'https://github.com/Abrorismoiljanov/cart',
      color: t.orange
    },
    {
      name: 'amp',
      lang: 'C++',
      desc: 'CLI music player written in C++. Lightweight, terminal-native audio playback with SDL2_mixer.',
      tags: ['C++', 'SDL2', 'Audio', 'CLI'],
      url: 'https://github.com/Abrorismoiljanov/amp',
      color: t.blue
    },
    {
      name: 'ALE',
      lang: 'C++',
      desc: 'Abror\'s Level Editor — a custom map/level editor tool for game development.',
      tags: ['C++', 'Editor', 'Tooling'],
      url: 'https://github.com/Abrorismoiljanov/ALE',
      color: t.aqua
    }
  ]);

  let expanded = $state(null);
</script>

<div class="projects" style="--bg: {t.bg}; --bg-dark: {t.bgDark}; --bg-light: {t.bgLight}; --fg: {t.fg}; --fg-dim: {t.fgDim}; --border: {t.border};">
  <div class="projects-header">
    <h2 style="color: {t.fg};">Projects</h2>
    <span class="count" style="color: {t.fgDim};">{projects.length} repos</span>
  </div>

  <div class="project-columns">
    <div class="project-column">
      {#each [0, 1] as i}
        {@const project = projects[i]}
        <div
          class="project-card"
          style="background: {t.bgLight}; border-color: {expanded === i ? project.color : t.border};"
        >
          <button class="card-header" onmousedown={() => expanded = expanded === i ? null : i}>
            <div class="card-title-row">
              <span class="lang-dot" style="background: {project.color};"></span>
              <h3 style="color: {t.fg};">{project.name}</h3>
            </div>
            <span class="lang-label" style="color: {t.fgDim};">{project.lang}</span>
          </button>

          {#if expanded === i}
            <div class="card-body">
              <p class="desc" style="color: {t.fg};">{project.desc}</p>
              <div class="tags">
                {#each project.tags as tag}
                  <span class="tag" style="background: {t.bgDark}; color: {t.fgDim}; border-color: {t.border};">{tag}</span>
                {/each}
              </div>
              {#if project.url}
                <a href={project.url} target="_blank" class="project-link" style="color: {project.color}; border-color: {project.color};">
                  View on GitHub &rarr;
                </a>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="project-column">
      {#each [2, 3] as i}
        {@const project = projects[i]}
        <div
          class="project-card"
          style="background: {t.bgLight}; border-color: {expanded === i ? project.color : t.border};"
        >
          <button class="card-header" onmousedown={() => expanded = expanded === i ? null : i}>
            <div class="card-title-row">
              <span class="lang-dot" style="background: {project.color};"></span>
              <h3 style="color: {t.fg};">{project.name}</h3>
            </div>
            <span class="lang-label" style="color: {t.fgDim};">{project.lang}</span>
          </button>

          {#if expanded === i}
            <div class="card-body">
              <p class="desc" style="color: {t.fg};">{project.desc}</p>
              <div class="tags">
                {#each project.tags as tag}
                  <span class="tag" style="background: {t.bgDark}; color: {t.fgDim}; border-color: {t.border};">{tag}</span>
                {/each}
              </div>
              {#if project.url}
                <a href={project.url} target="_blank" class="project-link" style="color: {project.color}; border-color: {project.color};">
                  View on GitHub &rarr;
                </a>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .projects {
    height: 100%;
    padding: 16px;
    overflow-y: auto;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .projects-header {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 16px;
  }
  .projects-header h2 { font-size: 18px; font-weight: 600; margin: 0; }
  .count { font-size: 12px; }

  .project-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    align-items: start;
  }

  .project-column {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .project-card {
    border: 1px solid;
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.2s, transform 0.15s;
  }
  .project-card:hover { transform: translateY(-1px); }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px 12px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background 0.12s;
  }
  .card-header:hover { background: rgba(255,255,255,0.04); }

  .card-title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lang-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .card-header h3 {
    font-size: 13px;
    font-weight: 600;
    margin: 0;
  }

  .lang-label {
    font-size: 11px;
  }

  .card-body {
    padding: 0 12px 12px;
    animation: fadeIn 0.15s ease;
  }

  .desc {
    font-size: 12px;
    line-height: 1.5;
    margin: 0 0 8px;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
  }

  .tag {
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 10px;
    border: 1px solid;
    transition: background 0.12s;
  }
  .tag:hover { background: rgba(255,255,255,0.08); }

  .project-link {
    display: inline-block;
    font-size: 12px;
    font-weight: 500;
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid;
    transition: opacity 0.15s;
  }
  .project-link:hover { opacity: 0.8; }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
