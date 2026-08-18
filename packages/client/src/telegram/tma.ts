export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          start_param?: string;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        openTelegramLink: (url: string) => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
      };
    };
  }
}

export function initTelegramApp() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    try {
      tg.setHeaderColor?.('#0f172a');
      tg.setBackgroundColor?.('#0f172a');
    } catch {
      // Ignored if not supported in old versions
    }
  }
}

export function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'medium') {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
  } catch {
    // Ignore in non-TMA environments
  }
}

export function triggerHapticNotification(type: 'error' | 'success' | 'warning' = 'success') {
  try {
    window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(type);
  } catch {
    // Ignore in non-TMA environments
  }
}

export function getCurrentUser() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser) {
    return {
      id: `tg_${tgUser.id}`,
      telegramId: tgUser.id,
      username: tgUser.username || `user_${tgUser.id}`,
      displayName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || `Игрок ${tgUser.id}`,
      avatarUrl: tgUser.photo_url || ''
    };
  }

  // Fallback for browser development
  const localId = localStorage.getItem('mono_dev_id') || `dev_${Math.floor(1000 + Math.random() * 9000)}`;
  localStorage.setItem('mono_dev_id', localId);

  return {
    id: localId,
    username: localId,
    displayName: `Игрок #${localId.slice(-4)}`,
    avatarUrl: ''
  };
}
