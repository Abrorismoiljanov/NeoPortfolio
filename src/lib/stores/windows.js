import { writable, derived, get } from 'svelte/store';

let nextId = 1;

export const windows = writable([]);
export const activeWindowId = writable(null);
export const minimizedIds = writable(new Set());

export const visibleWindows = derived(
  [windows, minimizedIds],
  ([$windows, $minimizedIds]) =>
    $windows.filter(w => !$minimizedIds.has(w.id))
);

export function openWindow(appId, title, component, opts = {}) {
  const existing = get(windows).find(w => w.appId === appId);
  if (existing) {
    focusWindow(existing.id);
    if (get(minimizedIds).has(existing.id)) {
      minimizedIds.update(s => { s.delete(existing.id); return s; });
    }
    return;
  }

  const id = nextId++;
  const w = {
    id,
    appId,
    title,
    component,
    icon: opts.icon || '?',
    iconColor: opts.iconColor || '#aaa',
    x: 80 + (id % 8) * 30,
    y: 40 + (id % 6) * 30,
    width: opts.width || 700,
    height: opts.height || 500,
    minWidth: opts.minWidth || 300,
    minHeight: opts.minHeight || 200,
  };

  windows.update(ws => [...ws, w]);
  focusWindow(id);
}

export function toggleFullscreen(id) {
  windows.update(ws => ws.map(w => {
    if (w.id !== id) return w;
    if (w.fullscreen) {
      return {
        ...w,
        fullscreen: false,
        x: w.restoreX ?? w.x,
        y: w.restoreY ?? w.y,
        width: w.restoreWidth ?? w.width,
        height: w.restoreHeight ?? w.height,
      };
    } else {
      return {
        ...w,
        fullscreen: true,
        restoreX: w.x,
        restoreY: w.y,
        restoreWidth: w.width,
        restoreHeight: w.height,
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight - 44,
      };
    }
  }));
}

export function closeWindow(id) {
  windows.update(ws => ws.filter(w => w.id !== id));
  minimizedIds.update(s => { s.delete(id); return s; });
  activeWindowId.update(a => a === id ? null : a);
}

export function focusWindow(id) {
  activeWindowId.set(id);
  windows.update(ws => {
    const idx = ws.findIndex(w => w.id === id);
    if (idx === -1) return ws;
    const win = ws[idx];
    const rest = ws.filter(w => w.id !== id);
    return [...rest, win];
  });
}

export function minimizeWindow(id) {
  minimizedIds.update(s => { s.add(id); return s; });
  activeWindowId.update(a => a === id ? null : a);
}

export function restoreWindow(id) {
  minimizedIds.update(s => { s.delete(id); return s; });
  focusWindow(id);
}

export function updateWindowPosition(id, x, y) {
  windows.update(ws => ws.map(w => w.id === id ? { ...w, x, y } : w));
}

export function updateWindowSize(id, width, height) {
  windows.update(ws => ws.map(w =>
    w.id === id ? { ...w, width: Math.max(w.minWidth, width), height: Math.max(w.minHeight, height) } : w
  ));
}

export function isMinimized(id) {
  let val;
  minimizedIds.subscribe(s => val = s.has(id))();
  return val;
}
