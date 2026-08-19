import { TileDefinition } from './types.js';

export const BOARD_TILES: TileDefinition[] = [
  { index: 0, name: 'СТАРТ', type: 'go', group: 'special', icon: '🚀' },
  { index: 1, name: "McDonald's", type: 'street', group: 'brown', cost: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgage: 30, icon: '🍔', brandColor: '#5A0C38', accentColor: '#FFC72C', ticker: 'MCD' },
  { index: 2, name: 'Казна', type: 'chest', group: 'special', icon: '🎁' },
  { index: 3, name: 'Burger King', type: 'street', group: 'brown', cost: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgage: 30, icon: '👑', brandColor: '#5A0C38', accentColor: '#D62300', ticker: 'BK' },
  { index: 4, name: 'Подоходный налог', type: 'tax', group: 'special', taxAmount: 200, icon: '💰' },
  { index: 5, name: 'SpaceX', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '🚀', brandColor: '#BF00FF', accentColor: '#000000', ticker: 'SPCX' },
  { index: 6, name: 'Nivea', type: 'street', group: 'light_blue', cost: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50, icon: '🧴', brandColor: '#87A5D7', accentColor: '#0032A0', ticker: 'NIVEA' },
  { index: 7, name: 'Шанс', type: 'chance', group: 'special', icon: '❓' },
  { index: 8, name: 'Telegram', type: 'street', group: 'light_blue', cost: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50, icon: '✈️', brandColor: '#87A5D7', accentColor: '#FFFFFF', ticker: 'TG' },
  { index: 9, name: 'Twitter (X)', type: 'street', group: 'light_blue', cost: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgage: 60, icon: '𝕏', brandColor: '#87A5D7', accentColor: '#000000', ticker: 'X' },
  { index: 10, name: 'Тюрьма / Экскурсия', type: 'jail', group: 'special', icon: '⛓️' },
  { index: 11, name: 'TikTok', type: 'street', group: 'pink', cost: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70, icon: '🎵', brandColor: '#F03878', accentColor: '#69C9D0', ticker: 'TT' },
  { index: 12, name: 'BMW', type: 'utility', group: 'utility', cost: 150, rent: [4, 10], mortgage: 75, icon: '🚗', brandColor: '#BF00FF', accentColor: '#0066B1', ticker: 'BMW' },
  { index: 13, name: 'Instagram', type: 'street', group: 'pink', cost: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70, icon: '📷', brandColor: '#F03878', accentColor: '#F77737', ticker: 'INSTA' },
  { index: 14, name: 'Pinterest', type: 'street', group: 'pink', cost: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgage: 80, icon: '📌', brandColor: '#F03878', accentColor: '#FFFFFF', ticker: 'PIN' },
  { index: 15, name: 'Boeing', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '✈️', brandColor: '#BF00FF', accentColor: '#FFFFFF', ticker: 'BA' },
  { index: 16, name: 'Amazon', type: 'street', group: 'orange', cost: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90, icon: '📦', brandColor: '#F38023', accentColor: '#146EB4', ticker: 'AMZN' },
  { index: 17, name: 'Казна', type: 'chest', group: 'special', icon: '🎁' },
  { index: 18, name: 'Nike', type: 'street', group: 'orange', cost: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90, icon: '✔️', brandColor: '#F38023', accentColor: '#111827', ticker: 'NIKE' },
  { index: 19, name: 'Sony', type: 'street', group: 'orange', cost: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgage: 100, icon: '🎮', brandColor: '#F38023', accentColor: '#FFFFFF', ticker: 'SONY' },
  { index: 20, name: 'Бесплатная стоянка', type: 'free_parking', group: 'special', icon: '🅿️' },
  { index: 21, name: 'Netflix', type: 'street', group: 'red', cost: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, icon: '🎬', brandColor: '#EE3A23', accentColor: '#000000', ticker: 'NFLX' },
  { index: 22, name: 'Шанс', type: 'chance', group: 'special', icon: '❓' },
  { index: 23, name: 'YouTube', type: 'street', group: 'red', cost: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, icon: '▶️', brandColor: '#EE3A23', accentColor: '#282828', ticker: 'YT' },
  { index: 24, name: 'Coca-Cola', type: 'street', group: 'red', cost: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgage: 120, icon: '🥤', brandColor: '#EE3A23', accentColor: '#FFFFFF', ticker: 'COCA' },
  { index: 25, name: 'Emirates', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '🛫', brandColor: '#BF00FF', accentColor: '#FFFFFF', ticker: 'EK' },
  { index: 26, name: 'IKEA', type: 'street', group: 'yellow', cost: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130, icon: '🛋️', brandColor: '#FCE604', accentColor: '#0058A3', ticker: 'IKEA' },
  { index: 27, name: 'Snapchat', type: 'street', group: 'yellow', cost: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130, icon: '👻', brandColor: '#FCE604', accentColor: '#000000', ticker: 'SNAP' },
  { index: 28, name: 'Mercedes-Benz', type: 'utility', group: 'utility', cost: 150, rent: [4, 10], mortgage: 75, icon: '🏎️', brandColor: '#BF00FF', accentColor: '#C0C0C0', ticker: 'MB' },
  { index: 29, name: 'LEGO', type: 'street', group: 'yellow', cost: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgage: 140, icon: '🧱', brandColor: '#FCE604', accentColor: '#D11013', ticker: 'LEGO' },
  { index: 30, name: 'Отправляйтесь в тюрьму', type: 'go_to_jail', group: 'special', icon: '👮' },
  { index: 31, name: 'Spotify', type: 'street', group: 'green', cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150, icon: '🎧', brandColor: '#12A45D', accentColor: '#191414', ticker: 'SPOT' },
  { index: 32, name: 'Xbox', type: 'street', group: 'green', cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150, icon: '🎮', brandColor: '#12A45D', accentColor: '#FFFFFF', ticker: 'XBOX' },
  { index: 33, name: 'Казна', type: 'chest', group: 'special', icon: '🎁' },
  { index: 34, name: 'Nvidia', type: 'street', group: 'green', cost: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgage: 160, icon: '👁️', brandColor: '#12A45D', accentColor: '#000000', ticker: 'NVDA' },
  { index: 35, name: 'Uber', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '🚗', brandColor: '#BF00FF', accentColor: '#FFFFFF', ticker: 'UBER' },
  { index: 36, name: 'Шанс', type: 'chance', group: 'special', icon: '❓' },
  { index: 37, name: 'Microsoft', type: 'street', group: 'dark_blue', cost: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgage: 175, icon: '🪟', brandColor: '#294FA2', accentColor: '#F25022', ticker: 'MSFT' },
  { index: 38, name: 'Сверхналог (Люкс)', type: 'tax', group: 'special', taxAmount: 100, icon: '💎' },
  { index: 39, name: 'Apple', type: 'street', group: 'dark_blue', cost: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgage: 200, icon: '🍏', brandColor: '#294FA2', accentColor: '#A2AAAD', ticker: 'AAPL' }
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

export const GAME_RULES = {
  STARTING_BALANCE_CLASSIC: 1000,
  STARTING_BALANCE_TURBO: 1500,
  GO_PASS_REWARD: 200,
  GO_LAND_BONUS: 400, // 400 млн при точном попадании на поле СТАРТ (хоумрул x2)
  JAIL_FINE: 50,
  JAIL_BAIL_OUT: 200, // Выкуп из тюрьмы без ожидания
  JAIL_MAX_TURNS: 3,
  JAIL_DISABLES_RENT: true, // В тюрьме игрок не получает доход от аренды
  AUCTION_START_DISCOUNT: 0.75, // Стартовая цена аукциона — 75% от номинала
  AUCTION_MIN_STEP: 10, // Минимальный шаг ставки 10 млн
  AUCTION_TIMER_SECONDS: 10,
  MORTGAGE_PERCENT: 0.5, // 50% от стоимости при передаче в залог банку
  UNMORTGAGE_FEE_PERCENT: 0.6, // 50% + 10% комиссия при выкупе (итого 60%)
  MORTGAGE_MAX_TURNS: 15, // Если за 15 ходов не выкупить — уходит банку
  MONOPOLY_FULL_HOTEL_BONUS: 1.2, // +20% к аренде при головном офисе (отеле) на всех карточках монополии
  TURN_TIMEOUT_SECONDS: 30,
  DICE_ROLL_TIMEOUT_SECONDS: 15,
  RECONNECT_GRACE_PERIOD_SECONDS: 60
} as const;
