import { TileDefinition } from './types.js';

export const BOARD_TILES: TileDefinition[] = [
  { index: 0, name: 'СТАРТ', type: 'go', group: 'special', icon: '🚀' },
  { index: 1, name: 'Житная ул.', type: 'street', group: 'brown', cost: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgage: 30, icon: '🏠' },
  { index: 2, name: 'Казначейство', type: 'chest', group: 'special', icon: '🎁' },
  { index: 3, name: 'Нагатинская', type: 'street', group: 'brown', cost: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgage: 30, icon: '🏠' },
  { index: 4, name: 'Подоходный налог', type: 'tax', group: 'special', taxAmount: 200, icon: '💰' },
  { index: 5, name: 'Рижская ж/д', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '🚆' },
  { index: 6, name: 'Варшавское ш.', type: 'street', group: 'light_blue', cost: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50, icon: '🏠' },
  { index: 7, name: 'Шанс', type: 'chance', group: 'special', icon: '❓' },
  { index: 8, name: 'ул. Огарева', type: 'street', group: 'light_blue', cost: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgage: 50, icon: '🏠' },
  { index: 9, name: 'Первая Парковая', type: 'street', group: 'light_blue', cost: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgage: 60, icon: '🏠' },
  { index: 10, name: 'Тюрьма / Экскурсия', type: 'jail', group: 'special', icon: '⛓️' },
  { index: 11, name: 'ул. Полянка', type: 'street', group: 'pink', cost: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70, icon: '🏠' },
  { index: 12, name: 'Электростанция', type: 'utility', group: 'utility', cost: 150, rent: [4, 10], mortgage: 75, icon: '⚡' },
  { index: 13, name: 'ул. Сретенка', type: 'street', group: 'pink', cost: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgage: 70, icon: '🏠' },
  { index: 14, name: 'Ростовская наб.', type: 'street', group: 'pink', cost: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgage: 80, icon: '🏠' },
  { index: 15, name: 'Курская ж/д', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '🚆' },
  { index: 16, name: 'Рязанский пр-т', type: 'street', group: 'orange', cost: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90, icon: '🏠' },
  { index: 17, name: 'Казначейство', type: 'chest', group: 'special', icon: '🎁' },
  { index: 18, name: 'Сущевский вал', type: 'street', group: 'orange', cost: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgage: 90, icon: '🏠' },
  { index: 19, name: 'Новинский б-р', type: 'street', group: 'orange', cost: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgage: 100, icon: '🏠' },
  { index: 20, name: 'Бесплатная стоянка', type: 'free_parking', group: 'special', icon: '🅿️' },
  { index: 21, name: 'Тверская ул.', type: 'street', group: 'red', cost: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, icon: '🏠' },
  { index: 22, name: 'Шанс', type: 'chance', group: 'special', icon: '❓' },
  { index: 23, name: 'Пушкинская ул.', type: 'street', group: 'red', cost: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgage: 110, icon: '🏠' },
  { index: 24, name: 'Площадь Маяковского', type: 'street', group: 'red', cost: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgage: 120, icon: '🏠' },
  { index: 25, name: 'Казанская ж/д', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '🚆' },
  { index: 26, name: 'ул. Вавилова', type: 'street', group: 'yellow', cost: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130, icon: '🏠' },
  { index: 27, name: 'ул. Щусева', type: 'street', group: 'yellow', cost: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgage: 130, icon: '🏠' },
  { index: 28, name: 'Водопровод', type: 'utility', group: 'utility', cost: 150, rent: [4, 10], mortgage: 75, icon: '🚰' },
  { index: 29, name: 'Смоленская пл.', type: 'street', group: 'yellow', cost: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgage: 140, icon: '🏠' },
  { index: 30, name: 'Отправляйтесь в тюрьму', type: 'go_to_jail', group: 'special', icon: '👮' },
  { index: 31, name: 'ул. Чайковского', type: 'street', group: 'green', cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150, icon: '🏠' },
  { index: 32, name: 'Кутузовский пр-т', type: 'street', group: 'green', cost: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgage: 150, icon: '🏠' },
  { index: 33, name: 'Казначейство', type: 'chest', group: 'special', icon: '🎁' },
  { index: 34, name: 'Ленинский пр-т', type: 'street', group: 'green', cost: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgage: 160, icon: '🏠' },
  { index: 35, name: 'Ленинградская ж/д', type: 'railroad', group: 'railroad', cost: 200, rent: [25, 50, 100, 200], mortgage: 100, icon: '🚆' },
  { index: 36, name: 'Шанс', type: 'chance', group: 'special', icon: '❓' },
  { index: 37, name: 'ул. Малая Бронная', type: 'street', group: 'dark_blue', cost: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgage: 175, icon: '🏠' },
  { index: 38, name: 'Сверхналог (Люкс)', type: 'tax', group: 'special', taxAmount: 100, icon: '💎' },
  { index: 39, name: 'ул. Арбат', type: 'street', group: 'dark_blue', cost: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgage: 200, icon: '👑' }
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
