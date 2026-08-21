export interface RankTier {
  level: number;
  title: string;
  minElo: number;
  maxElo: number;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  colorName: string;
  iconName: string;
}

export const RANK_TIERS: RankTier[] = [
  {
    level: 1,
    title: 'Стажёр',
    minElo: 0,
    maxElo: 750,
    badgeBg: 'bg-gradient-to-r from-stone-600 to-stone-800',
    badgeBorder: 'border-stone-500/50',
    badgeText: 'text-stone-300',
    colorName: '#78716c',
    iconName: 'Shield'
  },
  {
    level: 2,
    title: 'Младший брокер',
    minElo: 751,
    maxElo: 900,
    badgeBg: 'bg-gradient-to-r from-amber-800 to-stone-800',
    badgeBorder: 'border-amber-700/50',
    badgeText: 'text-amber-300',
    colorName: '#b45309',
    iconName: 'ShieldAlert'
  },
  {
    level: 3,
    title: 'Финансист',
    minElo: 901,
    maxElo: 1050,
    badgeBg: 'bg-gradient-to-r from-blue-700 to-cyan-900',
    badgeBorder: 'border-blue-400/60',
    badgeText: 'text-cyan-300',
    colorName: '#0284c7',
    iconName: 'Award'
  },
  {
    level: 4,
    title: 'Инвестор PRO',
    minElo: 1051,
    maxElo: 1200,
    badgeBg: 'bg-gradient-to-r from-teal-600 to-emerald-900',
    badgeBorder: 'border-teal-400/60',
    badgeText: 'text-teal-300',
    colorName: '#0d9488',
    iconName: 'Zap'
  },
  {
    level: 5,
    title: 'Трейдер',
    minElo: 1201,
    maxElo: 1350,
    badgeBg: 'bg-gradient-to-r from-yellow-600 to-amber-900',
    badgeBorder: 'border-yellow-400/70',
    badgeText: 'text-yellow-300',
    colorName: '#ca8a04',
    iconName: 'TrendingUp'
  },
  {
    level: 6,
    title: 'Банкир',
    minElo: 1351,
    maxElo: 1500,
    badgeBg: 'bg-gradient-to-r from-amber-500 to-orange-800',
    badgeBorder: 'border-amber-300/80',
    badgeText: 'text-amber-200',
    colorName: '#f59e0b',
    iconName: 'Sparkles'
  },
  {
    level: 7,
    title: 'Венчурный капиталист',
    minElo: 1501,
    maxElo: 1700,
    badgeBg: 'bg-gradient-to-r from-indigo-600 via-purple-700 to-pink-800',
    badgeBorder: 'border-purple-400/80',
    badgeText: 'text-purple-200',
    colorName: '#9333ea',
    iconName: 'Gem'
  },
  {
    level: 8,
    title: 'Олигарх',
    minElo: 1701,
    maxElo: 1900,
    badgeBg: 'bg-gradient-to-r from-rose-600 via-red-700 to-amber-800',
    badgeBorder: 'border-rose-400/80',
    badgeText: 'text-rose-200',
    colorName: '#e11d48',
    iconName: 'Flame'
  },
  {
    level: 9,
    title: 'Магнат рынка',
    minElo: 1901,
    maxElo: 2100,
    badgeBg: 'bg-gradient-to-r from-fuchsia-600 via-violet-700 to-cyan-800',
    badgeBorder: 'border-fuchsia-400/90',
    badgeText: 'text-fuchsia-200',
    colorName: '#c026d3',
    iconName: 'Crown'
  },
  {
    level: 10,
    title: 'Властелин капитала',
    minElo: 2101,
    maxElo: 9999,
    badgeBg: 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-400',
    badgeBorder: 'border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.5)]',
    badgeText: 'text-white',
    colorName: '#ea580c',
    iconName: 'Trophy'
  }
];

export function getRankTier(elo: number): RankTier {
  const safeElo = Math.max(0, elo || 1000);
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (safeElo >= RANK_TIERS[i].minElo) {
      return RANK_TIERS[i];
    }
  }
  return RANK_TIERS[0];
}

export function calculateLevelProgress(elo: number) {
  const currentTier = getRankTier(elo);
  const nextTier = RANK_TIERS.find((t) => t.level === currentTier.level + 1) || null;

  if (!nextTier) {
    return {
      currentLevel: currentTier.level,
      nextLevel: null,
      progressPercent: 100,
      minElo: currentTier.minElo,
      maxElo: currentTier.minElo + 500,
      currentInLevel: elo - currentTier.minElo,
      neededForNext: 0
    };
  }

  const range = nextTier.minElo - currentTier.minElo;
  const current = Math.max(0, elo - currentTier.minElo);
  const progressPercent = Math.min(100, Math.max(0, Math.round((current / range) * 100)));

  return {
    currentLevel: currentTier.level,
    nextLevel: nextTier.level,
    progressPercent,
    minElo: currentTier.minElo,
    maxElo: nextTier.minElo,
    currentInLevel: current,
    neededForNext: Math.max(0, nextTier.minElo - elo)
  };
}

export interface UserStats {
  matches: number;
  wins: number;
  losses: number;
  winStreak: number;
  bestElo: number;
  bankruptcies: number;
}

export function getUserRating(): number {
  try {
    const saved = localStorage.getItem('mono_user_elo');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // Ignore storage issues
  }
  return 1000; // Base starting ELO
}

export function setUserRating(elo: number): void {
  try {
    localStorage.setItem('mono_user_elo', String(Math.max(100, Math.round(elo))));
  } catch {
    // Ignore storage issues
  }
}

export function getUserStats(): UserStats {
  try {
    const saved = localStorage.getItem('mono_user_stats');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Ignore storage issues
  }
  return {
    matches: 12,
    wins: 8,
    losses: 4,
    winStreak: 2,
    bestElo: 1050,
    bankruptcies: 15
  };
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem('mono_user_stats', JSON.stringify(stats));
  } catch {
    // Ignore storage issues
  }
}

export function recordMatchResult(won: boolean, bankruptCount: number = 0) {
  const oldElo = getUserRating();
  const oldTier = getRankTier(oldElo);
  const stats = getUserStats();

  let delta = 0;
  if (won) {
    delta = 25 + Math.min(15, bankruptCount * 5); // +25 базово, +5 за каждое банкротство
    stats.wins += 1;
    stats.winStreak += 1;
  } else {
    delta = -20;
    stats.losses += 1;
    stats.winStreak = 0;
  }

  stats.matches += 1;
  stats.bankruptcies += bankruptCount;

  const newElo = Math.max(100, oldElo + delta);
  if (newElo > stats.bestElo) {
    stats.bestElo = newElo;
  }

  setUserRating(newElo);
  saveUserStats(stats);

  const newTier = getRankTier(newElo);
  const rankUp = newTier.level > oldTier.level;
  const rankDown = newTier.level < oldTier.level;

  return {
    delta,
    oldElo,
    newElo,
    rankUp,
    rankDown,
    oldTier,
    newTier,
    stats
  };
}

export interface LeaderboardPlayer {
  id: string;
  rank: number;
  name: string;
  username: string;
  avatarBg: string;
  avatarUrl?: string;
  elo: number;
  level: number;
  wins: number;
  matches: number;
  winrate: number;
  winStreak: number;
  isCurrentUser?: boolean;
  isFriend?: boolean;
}

// Realistic Global Leaderboard Top Players
export const GLOBAL_LEADERBOARD_BASE: LeaderboardPlayer[] = [
  {
    id: 'p_1',
    rank: 1,
    name: 'Артём Смирнов',
    username: 'artem_smirnov',
    avatarBg: 'from-blue-600 to-indigo-800',
    elo: 2420,
    level: 10,
    wins: 142,
    matches: 198,
    winrate: 71,
    winStreak: 6
  },
  {
    id: 'p_2',
    rank: 2,
    name: 'Даня Громов',
    username: 'danya_grom',
    avatarBg: 'from-amber-600 to-red-700',
    elo: 2280,
    level: 10,
    wins: 119,
    matches: 175,
    winrate: 68,
    winStreak: 4
  },
  {
    id: 'p_3',
    rank: 3,
    name: 'Кирилл Воронов',
    username: 'kirill_spb',
    avatarBg: 'from-purple-600 to-pink-700',
    elo: 2090,
    level: 9,
    wins: 96,
    matches: 148,
    winrate: 65,
    winStreak: 3
  },
  {
    id: 'p_4',
    rank: 4,
    name: 'Алина Морозова',
    username: 'alina_fox',
    avatarBg: 'from-rose-500 to-purple-800',
    elo: 1890,
    level: 8,
    wins: 74,
    matches: 118,
    winrate: 63,
    winStreak: 2
  },
  {
    id: 'p_5',
    rank: 5,
    name: 'Макс Волков',
    username: 'm_volkov',
    avatarBg: 'from-emerald-600 to-teal-800',
    elo: 1750,
    level: 8,
    wins: 62,
    matches: 102,
    winrate: 61,
    winStreak: 1
  },
  {
    id: 'p_6',
    rank: 6,
    name: 'Влад Котов',
    username: 'vladik_777',
    avatarBg: 'from-cyan-600 to-blue-800',
    elo: 1620,
    level: 7,
    wins: 53,
    matches: 89,
    winrate: 59,
    winStreak: 3
  },
  {
    id: 'p_7',
    rank: 7,
    name: 'Никита Белов',
    username: 'nikita_b',
    avatarBg: 'from-orange-500 to-amber-700',
    elo: 1510,
    level: 7,
    wins: 48,
    matches: 84,
    winrate: 57,
    winStreak: 0
  },
  {
    id: 'p_8',
    rank: 8,
    name: 'Сергей Кузнецов',
    username: 'sergey_k',
    avatarBg: 'from-slate-600 to-slate-800',
    elo: 1390,
    level: 6,
    wins: 39,
    matches: 71,
    winrate: 55,
    winStreak: 2
  },
  {
    id: 'p_9',
    rank: 9,
    name: 'Денис Попов',
    username: 'denchik_pro',
    avatarBg: 'from-lime-600 to-green-800',
    elo: 1280,
    level: 5,
    wins: 33,
    matches: 62,
    winrate: 53,
    winStreak: 1
  },
  {
    id: 'p_10',
    rank: 10,
    name: 'Илья Соколов',
    username: 'ilya_top',
    avatarBg: 'from-indigo-600 to-blue-900',
    elo: 1190,
    level: 4,
    wins: 28,
    matches: 55,
    winrate: 51,
    winStreak: 0
  }
];

// Realistic Telegram Friends Leaderboard
export const FRIENDS_LEADERBOARD_BASE: LeaderboardPlayer[] = [
  {
    id: 'f_1',
    rank: 1,
    name: 'Алексей Миронов',
    username: 'alex_mironov',
    avatarBg: 'from-blue-500 to-cyan-700',
    elo: 1380,
    level: 6,
    wins: 36,
    matches: 58,
    winrate: 62,
    winStreak: 3,
    isFriend: true
  },
  {
    id: 'f_2',
    rank: 2,
    name: 'Полина Соболева',
    username: 'polina_s',
    avatarBg: 'from-pink-500 to-rose-700',
    elo: 1240,
    level: 5,
    wins: 27,
    matches: 48,
    winrate: 56,
    winStreak: 1,
    isFriend: true
  },
  {
    id: 'f_3',
    rank: 3,
    name: 'Дмитрий Васнецов',
    username: 'dmitry_v',
    avatarBg: 'from-emerald-500 to-green-800',
    elo: 1110,
    level: 4,
    wins: 21,
    matches: 39,
    winrate: 54,
    winStreak: 0,
    isFriend: true
  },
  {
    id: 'f_4',
    rank: 4,
    name: 'Егор Казаков',
    username: 'egor_k',
    avatarBg: 'from-amber-500 to-orange-700',
    elo: 940,
    level: 3,
    wins: 14,
    matches: 32,
    winrate: 44,
    winStreak: 0,
    isFriend: true
  },
  {
    id: 'f_5',
    rank: 5,
    name: 'Михаил Решетников',
    username: 'misha_reshet',
    avatarBg: 'from-purple-500 to-indigo-800',
    elo: 860,
    level: 2,
    wins: 9,
    matches: 25,
    winrate: 36,
    winStreak: 0,
    isFriend: true
  }
];

export function getIntegratedLeaderboard(
  type: 'global' | 'friends',
  currentUser: {
    displayName: string;
    username: string;
    avatarUrl?: string;
    elo: number;
    level: number;
  }
): { list: LeaderboardPlayer[]; userRank: number } {
  const baseList = type === 'global' ? [...GLOBAL_LEADERBOARD_BASE] : [...FRIENDS_LEADERBOARD_BASE];

  const currentStats = getUserStats();
  const userEntry: LeaderboardPlayer = {
    id: 'current_user',
    rank: 0,
    name: currentUser.displayName,
    username: currentUser.username,
    avatarUrl: currentUser.avatarUrl,
    avatarBg: 'from-amber-500 to-orange-600',
    elo: currentUser.elo || getUserRating(),
    level: currentUser.level || getRankTier(currentUser.elo || getUserRating()).level,
    wins: currentStats.wins,
    matches: currentStats.matches,
    winrate: currentStats.matches > 0 ? Math.round((currentStats.wins / currentStats.matches) * 100) : 67,
    winStreak: currentStats.winStreak,
    isCurrentUser: true,
    isFriend: false
  };

  // Combine and sort by ELO descending
  const all = [...baseList, userEntry].sort((a, b) => b.elo - a.elo);

  // Assign 1-based ranks
  const ranked = all.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));

  const userRank = ranked.find((p) => p.isCurrentUser)?.rank || 1;

  return {
    list: ranked,
    userRank
  };
}
