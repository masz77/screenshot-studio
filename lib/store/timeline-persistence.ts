const KEY = 'screenshot-studio.timeline.v1';

interface PersistedTimeline {
  zoom: number;
  fitMode: 'fit' | 'manual';
  panelHeight: number | null;
}

export function loadTimelinePrefs(): Partial<PersistedTimeline> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<PersistedTimeline>;
    return parsed;
  } catch {
    return {};
  }
}

let pendingTimer: ReturnType<typeof setTimeout> | null = null;
let pendingPrefs: Partial<PersistedTimeline> = {};

export function saveTimelinePrefs(prefs: Partial<PersistedTimeline>): void {
  if (typeof window === 'undefined') return;
  pendingPrefs = { ...pendingPrefs, ...prefs };
  if (pendingTimer) clearTimeout(pendingTimer);
  pendingTimer = setTimeout(() => {
    try {
      const current = loadTimelinePrefs();
      window.localStorage.setItem(KEY, JSON.stringify({ ...current, ...pendingPrefs }));
      pendingPrefs = {};
    } catch {
      // ignore quota / privacy-mode failures
    }
    pendingTimer = null;
  }, 250);
}
