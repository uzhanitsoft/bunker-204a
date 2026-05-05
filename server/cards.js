// БУНКЕР 204-А — 13 сетапов карточек
// Каждый сетап содержит 6 характеристик: Профессия, Биология, Здоровье, Хобби, Факт, Багаж

export const CARD_SETS = [
  {
    id: 1,
    profession: 'Хирург',
    biology: 'М, 101 год',
    health: 'Тремор рук',
    hobby: 'Вуайеризм',
    fact: 'Маньяк-убийца',
    baggage: 'Шапочка из фольги',
  },
  {
    id: 2,
    profession: 'Вирусолог',
    biology: 'Ж, 99 лет',
    health: 'Мания преследования',
    hobby: 'Флудить в чатах',
    fact: 'Только из очага эпидемии',
    baggage: 'Надувная кукла',
  },
  {
    id: 3,
    profession: 'Патологоанатом',
    biology: 'М, 42, гомосексуален',
    health: 'Лунатизм',
    hobby: 'Вскрытие',
    fact: 'Дважды клинически умирал',
    baggage: 'Спиритическая доска',
  },
  {
    id: 4,
    profession: 'Браконьер',
    biology: 'Ж, 65 лет',
    health: 'Повышенная волосатость',
    hobby: 'Холодное оружие',
    fact: 'Сделает алкоголь из чего угодно',
    baggage: 'Кукла вуду',
  },
  {
    id: 5,
    profession: 'Знахарь',
    biology: 'М, 75 лет',
    health: 'Клептомания',
    hobby: 'Нетрадиционная медицина',
    fact: 'Не пускают в казино',
    baggage: 'Энциклопедия грибника',
  },
  {
    id: 6,
    profession: 'Грабитель',
    biology: 'М, 18 лет',
    health: 'Синдром чужой руки',
    hobby: 'Пиротехника',
    fact: 'Отчислен из клуба «Навыки выживания»',
    baggage: 'Дефибриллятор',
  },
  {
    id: 7,
    profession: 'Коуч',
    biology: 'Гуманоид',
    health: 'Не обследовался',
    hobby: 'Разговоры по душам',
    fact: 'Прошёл 2-недельные курсы психолога',
    baggage: 'Инкубатор с набором яиц',
  },
  {
    id: 8,
    profession: 'Экстрасенс',
    biology: 'Ж, 19, гомосексуальна',
    health: 'Гигантизм отдельных частей тела',
    hobby: 'Уфология и мистика',
    fact: 'Добровольно сдал все органы. Живой',
    baggage: '3 слитка золота',
  },
  {
    id: 9,
    profession: 'Гомеопат',
    biology: 'М, 24, бисексуален',
    health: 'Хвост',
    hobby: 'Алхимия',
    fact: 'Держал дома 40 кошек',
    baggage: 'Чемоданчик фельдшера',
  },
  {
    id: 10,
    profession: 'Папарацци',
    biology: 'Ж, 18 лет',
    health: 'Кофейная зависимость',
    hobby: 'Грибы и гомеопатия',
    fact: 'Подходит сзади и дышит',
    baggage: 'Капканы и набор ядов',
  },
  {
    id: 11,
    profession: 'Маркетолог',
    biology: 'Андроид',
    health: 'Раздвоение личности',
    hobby: 'Чёрная магия',
    fact: 'Пишит с ашипками',
    baggage: 'Книги Айзека Азимова',
  },
  {
    id: 12,
    profession: 'Философ',
    biology: 'Котгендер',
    health: 'Карлик',
    hobby: 'Краеведение',
    fact: 'Писается по ночам',
    baggage: 'Миллион долларов',
  },
  {
    id: 13,
    profession: 'Психолог',
    biology: 'Ж, 33 года',
    health: 'Понос',
    hobby: 'Буллить Фирдавса',
    fact: 'Строил подобные бункеры',
    baggage: 'Набор отмычек',
  },
];

// Названия типов карт и их цвета рамок
export const CARD_TYPES = {
  profession: { label: 'Профессия', color: '#FFFFFF', icon: '💼' },
  biology:    { label: 'Биология',  color: '#4A90D9', icon: '🧬' },
  health:     { label: 'Здоровье',  color: '#E63946', icon: '❤️‍🩹' },
  hobby:      { label: 'Хобби',     color: '#2D9B6F', icon: '🎯' },
  fact:       { label: 'Факт',      color: '#87CEEB', icon: '⚡' },
  baggage:    { label: 'Багаж',     color: '#FFD700', icon: '🎒' },
};

// Структура раундов
export const ROUND_CONFIG = [
  { round: 1, players: 13, eliminates: 2, remaining: 11 },
  { round: 2, players: 11, eliminates: 2, remaining: 9 },
  { round: 3, players: 9,  eliminates: 2, remaining: 7 },
  { round: 4, players: 7,  eliminates: 2, remaining: 5 },
  { round: 5, players: 5,  eliminates: 1, remaining: 4 },
  { round: 6, players: 4,  eliminates: 2, remaining: 2 },
];

// Текст катастрофы
export const CATASTROPHE_TEXT = `Неизвестный вирус за 48 часов охватил город. Больницы переполнены, персонал разбегается, пациенты агрессивны. Вы заперты в подвале городской больницы. Выйти нельзя — снаружи карантин. Еды на 2 недели. Кислорода строго на определённое число людей. Вас больше чем мест. Кто-то должен уйти.`;
