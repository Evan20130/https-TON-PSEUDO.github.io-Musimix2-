const SETTINGS_KEY = 'musimix2-settings';
const DEFAULT_SETTINGS = { provider: 'spotify' };

export function loadSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return {
      provider: ['deezer', 'jamendo'].includes(stored.provider) ? stored.provider : DEFAULT_SETTINGS.provider
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  const current = loadSettings();
  const next = {
    provider: ['spotify', 'deezer', 'jamendo'].includes(settings.provider) ? settings.provider : current.provider
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}
