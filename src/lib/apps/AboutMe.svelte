<script>
  import { currentTheme } from '../stores/theme.js';
  import { themes } from '../themes/palettes.js';

  let t = $derived(themes[$currentTheme]);
</script>

<div class="about" style="--bg: {t.bg}; --fg: {t.fg}; --fg-dim: {t.fgDim}; --accent: {t.accent}; --accent-alt: {t.accentAlt}; --border: {t.border}; --bg-light: {t.bgLight};">
  <div class="profile-header">
    <div class="avatar" style="background: {t.accent};">
      <span class="avatar-text">A</span>
    </div>
    <h1 class="name">Abror Ismoiljanov</h1>
    <p class="tagline" style="color: {t.fgDim};">Systems Programmer & Engine Developer</p>
  </div>

  <div class="bio">
    <p>17-year-old building game engines, tooling, and low-level software in C++ and Rust on Arch Linux.</p>
    <p>I like writing editors, ECS architectures, build systems, and things that talk directly to hardware.</p>
  </div>

  <div class="skills-section">
    <h2 style="color: {t.accent};">Skills</h2>
    <div class="skill-grid">
      <div class="skill-group">
        <h3 style="color: {t.accentAlt};">Languages</h3>
        <div class="tags">
          {#each ['C++', 'Rust', 'JavaScript', 'Go', 'Python', 'Lua'] as skill}
            <span class="tag" style="background: {t.bgLight}; color: {t.fg}; border-color: {t.border};">{skill}</span>
          {/each}
        </div>
      </div>
      <div class="skill-group">
        <h3 style="color: {t.accentAlt};">Graphics & Engines</h3>
        <div class="tags">
          {#each ['OpenGL', 'wgpu', 'SDL2', 'ImGui', 'Bevy', 'macroquad'] as skill}
            <span class="tag" style="background: {t.bgLight}; color: {t.fg}; border-color: {t.border};">{skill}</span>
          {/each}
        </div>
      </div>
      <div class="skill-group">
        <h3 style="color: {t.accentAlt};">Systems</h3>
        <div class="tags">
          {#each ['ECS', 'Build Tools', 'Scripting Runtimes', 'Editor Tooling', 'Linux'] as skill}
            <span class="tag" style="background: {t.bgLight}; color: {t.fg}; border-color: {t.border};">{skill}</span>
          {/each}
        </div>
      </div>
      <div class="skill-group">
        <h3 style="color: {t.accentAlt};">Tools</h3>
        <div class="tags">
          {#each ['CMake', 'xmake', 'Cargo', 'Git', 'Neovim', 'Arch Linux'] as skill}
            <span class="tag" style="background: {t.bgLight}; color: {t.fg}; border-color: {t.border};">{skill}</span>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <div class="links">
    <a href="https://github.com/Abrorismoiljanov" target="_blank" class="link" style="color: {t.accent}; border-color: {t.border};">
      GitHub
    </a>
    <a href="mailto:Krubka_Jo@protonmail.com" class="link" style="color: {t.accent}; border-color: {t.border};">
      Email
    </a>
  </div>
</div>

<style>
  .about {
    height: 100%;
    padding: 24px;
    overflow-y: auto;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .profile-header {
    text-align: center;
    margin-bottom: 24px;
  }

  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
  }
  .avatar-text {
    font-size: 32px;
    font-weight: 700;
    color: white;
  }

  .name {
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 4px;
  }
  .tagline {
    font-size: 14px;
    margin: 0;
  }

  .bio {
    text-align: center;
    margin-bottom: 24px;
    line-height: 1.6;
    font-size: 14px;
    color: var(--fg);
  }
  .bio p { margin: 0 0 4px; }

  .skills-section h2 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 12px;
  }

  .skill-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .skill-group h3 {
    font-size: 12px;
    font-weight: 600;
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .tag {
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 12px;
    border: 1px solid;
  }

  .links {
    display: flex;
    gap: 8px;
    margin-top: 24px;
    justify-content: center;
  }

  .link {
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid;
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: opacity 0.15s;
  }
  .link:hover { opacity: 0.8; }
</style>
