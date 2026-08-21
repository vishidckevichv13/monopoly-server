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
        requestFullscreen?: () => void;
        exitFullscreen?: () => void;
        isFullscreen?: boolean;
        disableVerticalSwipes?: () => void;
        enableVerticalSwipes?: () => void;
        isVerticalSwipesEnabled?: boolean;
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
        safeAreaInset?: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
        contentSafeAreaInset?: {
          top: number;
          bottom: number;
          left: number;
          right: number;
        };
      };
    };
  }
}

export function initTelegramApp() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();

    // Enable Bot API 8.0 Fullscreen mode
    try {
      if (typeof tg.requestFullscreen === 'function') {
        tg.requestFullscreen();
      }
    } catch (e) {
      console.warn('requestFullscreen error', e);
    }

    // Disable dragging down modal sheet to keep app stable & fullscreen
    try {
      if (typeof tg.disableVerticalSwipes === 'function') {
        tg.disableVerticalSwipes();
      }
    } catch (e) {
      console.warn('disableVerticalSwipes error', e);
    }

    try {
      tg.setHeaderColor?.('#0b0f19');
      tg.setBackgroundColor?.('#0b0f19');
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
  let savedElo = 1000;
  try {
    const eloStr = localStorage.getItem('mono_user_elo');
    if (eloStr) {
      const parsed = parseInt(eloStr, 10);
      if (!isNaN(parsed) && parsed > 0) savedElo = parsed;
    }
  } catch {
    // Ignore localStorage read issue
  }

  let level = 3;
  if (savedElo < 750) level = 1;
  else if (savedElo <= 900) level = 2;
  else if (savedElo <= 1050) level = 3;
  else if (savedElo <= 1200) level = 4;
  else if (savedElo <= 1350) level = 5;
  else if (savedElo <= 1500) level = 6;
  else if (savedElo <= 1700) level = 7;
  else if (savedElo <= 1900) level = 8;
  else if (savedElo <= 2100) level = 9;
  else level = 10;

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  if (tgUser) {
    return {
      id: `tg_${tgUser.id}`,
      telegramId: tgUser.id,
      username: tgUser.username || `user_${tgUser.id}`,
      displayName: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || `Игрок ${tgUser.id}`,
      avatarUrl: tgUser.photo_url || '',
      elo: savedElo,
      level
    };
  }

  // Fallback for browser development
  const localId = localStorage.getItem('mono_dev_id') || `dev_${Math.floor(1000 + Math.random() * 9000)}`;
  localStorage.setItem('mono_dev_id', localId);

  return {
    id: localId,
    username: localId,
    displayName: `Игрок #${localId.slice(-4)}`,
    avatarUrl: '',
    elo: savedElo,
    level
  };
}
