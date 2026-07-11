import { writable } from 'svelte/store';
import { themes } from '../themes/palettes.js';

function createThemeStore() {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('os-theme') : null;
  const initial = saved && themes[saved] ? saved : 'gruvbox';
  const { subscribe, set } = writable(initial);

  return {
    subscribe,
    set: (name) => {
      if (themes[name]) {
        localStorage.setItem('os-theme', name);
        set(name);
      }
    },
    getTheme: () => {
      let current;
      subscribe(v => current = v)();
      return themes[current];
    }
  };
}

export const currentTheme = createThemeStore();
