import { TileDefinition } from './types.js';

export const BOARD_TILES: TileDefinition[] = [
  { index: 0, name: 'СТАРТ', type: 'go', group: 'special', icon: '🚀' },
  { index: 1, name: "McDonald's", type: 'street', group: 'brown', cost: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgage: 30, icon: '🍔', brandColor: '#8D5B4C', accentColor: '#FFC72C', ticker: 'MCD' },
  { index: 2, name: 'Казна', type: 'chest', group: 'special', icon: '🎁' },
  { index: 3, name: 'Burger King', type: 'street', group: 'brown', cost: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgage: 30, icon: '👑', brandColor: '#7A3E2D', accentColor: '#D62300', ticker: 'BK' },
  { index: 4, name: 'Подоходный налог', type: 'tax', group: 'special', taxAmount: 200, icon: '💰' },
  { index: 5, name: 'SpaceX', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '🚀', brandColor: '#005288', accentColor: '#000000', ticker: 'SPCX' },
  { index: 6, name: 'Nivea', type: 'street', group: 'light_blue', cost: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50, icon: '🧴', brandColor: '#23AEEC', accentColor: '#0032A0', ticker: 'NIVEA' },
  { index: 7, name: 'Шанс', type: 'chance', group: 'special', icon: '❓' },
  { index: 8, name: 'Telegram', type: 'street', group: 'light_blue', cost: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50, icon: '✈️', brandColor: '#229ED9', accentColor: '#FFFFFF', ticker: 'TG' },
  { index: 9, name: 'Twitter (X)', type: 'street', group: 'light_blue', cost: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgage: 60, icon: '𝕏', brandColor: '#1DA1F2', accentColor: '#000000', ticker: 'X' },
  { index: 10, name: 'Тюрьма / Экскурсия', type: 'jail', group: 'special', icon: '⛓️' },
  { index: 11, name: 'TikTok', type: 'street', group: 'pink', cost: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70, icon: '🎵', brandColor: '#EE1D52', accentColor: '#69C9D0', ticker: 'TT' },
  { index: 12, name: 'Tesla', type: 'utility', group: 'utility', cost: 150, rent: [4, 10], mortgage: 75, icon: '⚡', brandColor: '#E82127', accentColor: '#000000', ticker: 'TSLA' },
  { index: 13, name: 'Instagram', type: 'street', group: 'pink', cost: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70, icon: '📷', brandColor: '#E1306C', accentColor: '#F77737', ticker: 'INSTA' },
  { index: 14, name: 'Pinterest', type: 'street', group: 'pink', cost: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgage: 80, icon: '📌', brandColor: '#E60023', accentColor: '#FFFFFF', ticker: 'PIN' },
  { index: 15, name: 'Boeing', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '✈️', brandColor: '#0033A0', accentColor: '#FFFFFF', ticker: 'BA' },
  { index: 16, name: 'Amazon', type: 'street', group: 'orange', cost: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90, icon: '📦', brandColor: '#FF9900', accentColor: '#146EB4', ticker: 'AMZN' },
  { index: 17, name: 'Казна', type: 'chest', group: 'special', icon: '🎁' },
  { index: 18, name: 'Nike', type: 'street', group: 'orange', cost: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90, icon: '✔️', brandColor: '#F97316', accentColor: '#111827', ticker: 'NIKE' },
  { index: 19, name: 'Sony', type: 'street', group: 'orange', cost: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgage: 100, icon: '🎮', brandColor: '#EA580C', accentColor: '#FFFFFF', ticker: 'SONY' },
  { index: 20, name: 'Бесплатная стоянка', type: 'free_parking', group: 'special', icon: '🅿️' },
  { index: 21, name: 'Netflix', type: 'street', group: 'red', cost: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, icon: '🎬', brandColor: '#E50914', accentColor: '#000000', ticker: 'NFLX' },
  { index: 22, name: 'Шанс', type: 'chance', group: 'special', icon: '❓' },
  { index: 23, name: 'YouTube', type: 'street', group: 'red', cost: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, icon: '▶️', brandColor: '#FF0000', accentColor: '#282828', ticker: 'YT' },
  { index: 24, name: 'Coca-Cola', type: 'street', group: 'red', cost: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgage: 120, icon: '🥤', brandColor: '#DC2626', accentColor: '#FFFFFF', ticker: 'COCA' },
  { index: 25, name: 'Emirates', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '🛫', brandColor: '#D71921', accentColor: '#FFFFFF', ticker: 'EK' },
  { index: 26, name: 'IKEA', type: 'street', group: 'yellow', cost: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130, icon: '🛋️', brandColor: '#F59E0B', accentColor: '#0058A3', ticker: 'IKEA' },
  { index: 27, name: 'Snapchat', type: 'street', group: 'yellow', cost: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130, icon: '👻', brandColor: '#EAB308', accentColor: '#000000', ticker: 'SNAP' },
  { index: 28, name: 'Mercedes-Benz', type: 'utility', group: 'utility', cost: 150, rent: [4, 10], mortgage: 75, icon: '🏎️', brandColor: '#334155', accentColor: '#C0C0C0', ticker: 'MB' },
  { index: 29, name: 'LEGO', type: 'street', group: 'yellow', cost: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgage: 140, icon: '🧱', brandColor: '#D97706', accentColor: '#D11013', ticker: 'LEGO' },
  { index: 30, name: 'Отправляйтесь в тюрьму', type: 'go_to_jail', group: 'special', icon: '👮' },
  { index: 31, name: 'Spotify', type: 'street', group: 'green', cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150, icon: '🎧', brandColor: '#1DB954', accentColor: '#191414', ticker: 'SPOT' },
  { index: 32, name: 'Xbox', type: 'street', group: 'green', cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150, icon: '🎮', brandColor: '#107C10', accentColor: '#FFFFFF', ticker: 'XBOX' },
  { index: 33, name: 'Казна', type: 'chest', group: 'special', icon: '🎁' },
  { index: 34, name: 'Nvidia', type: 'street', group: 'green', cost: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgage: 160, icon: '👁️', brandColor: '#76B900', accentColor: '#000000', ticker: 'NVDA' },
  { index: 35, name: 'Uber', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '🚗', brandColor: '#1E293B', accentColor: '#FFFFFF', ticker: 'UBER' },
  { index: 36, name: 'Шанс', type: 'chance', group: 'special', icon: '❓' },
  { index: 37, name: 'Microsoft', type: 'street', group: 'dark_blue', cost: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgage: 175, icon: '🪟', brandColor: '#0078D4', accentColor: '#F25022', ticker: 'MSFT' },
  { index: 38, name: 'Сверхналог (Люкс)', type: 'tax', group: 'special', taxAmount: 100, icon: '💎' },
  { index: 39, name: 'Apple', type: 'street', group: 'dark_blue', cost: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgage: 200, icon: '🍏', brandColor: '#0F172A', accentColor: '#A2AAAD', ticker: 'AAPL' }
];

export const COLOR_GROUP_MAP: Record<string, number[]> = {
  brown: [1, 3],
  light_blue: [6, 8, 9],
  pink: [11, 13, 14],
  orange: [16, 18, 19],
  red: [21, 23, 24],
  yellow: [26, 27, 29],
  green: [31, 32, 34],
  dark_blue: [37, 39],
  railroad: [5, 15, 25, 35],
  utility: [12, 28]
};

export const JAIL_POSITION = 10;
export const GO_REWARD = 200;
export const JAIL_FINE = 50;
