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
        viewportHeight?: number;
        viewportStableHeight?: number;
        isExpanded?: boolean;
        initData: string;
        initDataUnsafe: {
          user?: TelegramUser;
          start_param?: string;
          bot_username?: string;
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
        onEvent?: (eventType: string, callback: () => void) => void;
        offEvent?: (eventType: string, callback: () => void) => void;
      };
    };
  }
}

export function initTelegramApp() {
  if (typeof window === 'undefined') return;

  const syncSafeAreaAndViewport = () => {
    const tg = window.Telegram?.WebApp;
    const contentTop = tg?.contentSafeAreaInset?.top ?? 0;
    const safeTop = tg?.safeAreaInset?.top ?? 0;
    const contentBottom = tg?.contentSafeAreaInset?.bottom ?? 0;
    const safeBottom = tg?.safeAreaInset?.bottom ?? 0;
    const contentLeft = tg?.contentSafeAreaInset?.left ?? 0;
    const safeLeft = tg?.safeAreaInset?.left ?? 0;
    const contentRight = tg?.contentSafeAreaInset?.right ?? 0;
    const safeRight = tg?.safeAreaInset?.right ?? 0;

    const effectiveTop = Math.max(contentTop, safeTop);
    const effectiveBottom = Math.max(contentBottom, safeBottom);
    const effectiveLeft = Math.max(contentLeft, safeLeft);
    const effectiveRight = Math.max(contentRight, safeRight);

    if (effectiveTop > 0) {
      document.documentElement.style.setProperty('--safe-top', `${effectiveTop}px`);
      document.documentElement.style.setProperty('--tg-content-safe-area-inset-top', `${contentTop}px`);
      document.documentElement.style.setProperty('--tg-safe-area-inset-top', `${safeTop}px`);
    }
    if (effectiveBottom > 0) {
      document.documentElement.style.setProperty('--safe-bottom', `${effectiveBottom}px`);
      document.documentElement.style.setProperty('--tg-content-safe-area-inset-bottom', `${contentBottom}px`);
      document.documentElement.style.setProperty('--tg-safe-area-inset-bottom', `${safeBottom}px`);
    }
    if (effectiveLeft > 0) {
      document.documentElement.style.setProperty('--safe-left', `${effectiveLeft}px`);
    }
    if (effectiveRight > 0) {
      document.documentElement.style.setProperty('--safe-right', `${effectiveRight}px`);
    }

    if (tg?.viewportHeight) {
      document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
      document.documentElement.style.setProperty('--app-height', `${tg.viewportHeight}px`);
    }
    if (tg?.viewportStableHeight) {
      document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
    }
  };

  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    try {
      tg.ready();
      tg.expand();
    } catch (e) {
      console.warn('[TMA] ready/expand error:', e);
    }

    // Enable Bot API 8.0 Fullscreen mode
    try {
      if (typeof tg.requestFullscreen === 'function') {
        tg.requestFullscreen();
      }
    } catch (e) {
      console.warn('[TMA] requestFullscreen error:', e);
    }

    // Disable dragging down modal sheet to keep app stable & fullscreen
    try {
      if (typeof tg.disableVerticalSwipes === 'function') {
        tg.disableVerticalSwipes();
      }
    } catch (e) {
      console.warn('[TMA] disableVerticalSwipes error:', e);
    }

    try {
      tg.setHeaderColor?.('#0b0f19');
      tg.setBackgroundColor?.('#0b0f19');
    } catch {
      // Ignored if not supported in old versions
    }

    // Synchronize safe areas & viewport immediately
    syncSafeAreaAndViewport();

    // Listen to Telegram WebApp native resize & safe area events
    try {
      if (typeof tg.onEvent === 'function') {
        tg.onEvent('safeAreaChanged', syncSafeAreaAndViewport);
        tg.onEvent('contentSafeAreaChanged', syncSafeAreaAndViewport);
        tg.onEvent('viewportChanged', syncSafeAreaAndViewport);
        tg.onEvent('fullscreenChanged', syncSafeAreaAndViewport);
      }
    } catch (e) {
      console.warn('[TMA] onEvent subscription error:', e);
    }
  }

  // Also sync on window resize / orientationchange
  window.addEventListener('resize', syncSafeAreaAndViewport);
  window.addEventListener('orientationchange', syncSafeAreaAndViewport);
  // Perform delayed sync as Telegram may inject insets right after initial layout
  setTimeout(syncSafeAreaAndViewport, 100);
  setTimeout(syncSafeAreaAndViewport, 500);
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
  if (tgUser && tgUser.id) {
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
  let localId = `dev_${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    const stored = localStorage.getItem('mono_dev_id');
    if (stored) {
      localId = stored;
    } else {
      localStorage.setItem('mono_dev_id', localId);
    }
  } catch {
    // Ignore localStorage error
  }

  return {
    id: localId,
    username: localId,
    displayName: `Игрок #${localId.slice(-4)}`,
    avatarUrl: '',
    elo: savedElo,
    level
  };
}
