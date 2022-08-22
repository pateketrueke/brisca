export const EMPTY_GAME = {
  deck: [],
  length: '2',
  players: [],
  triumph: null,
  status: 'pending',
};

export const BRISCA_CARDS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const BRISCA_VALUES = {
  1: 11, 3: 10, 10: 2, 11: 3, 12: 4,
};
export const BRISCA_PRIZE = {
  0: '🥇', 1: '🥈', 2: '🥉', 3: '🍬',
};

export function takeNth(array, length, until) {
  let randomIndex;
  const value = [];
  while (length > 0) {
    randomIndex = Math.floor(Math.random() * array.length);
    // eslint-disable-next-line no-continue
    if (typeof until === 'function' && !until(array[randomIndex])) continue;
    value.push(...array.splice(randomIndex, 1));
    length -= 1;
  }
  return value;
}

export function rotateAt(array, head) {
  const copy = array.slice().concat(array.slice());
  const offset = array.indexOf(head);

  return copy.splice(offset, array.length);
}

export function shuffle(array) {
  let currentIndex = array.length;
  let randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export function random(cards, times = 10) {
  // eslint-disable-next-line no-plusplus
  while (times--) cards = shuffle(cards);
  return cards;
}

export function getCards(kind, cards) {
  return cards.map(card => ({ kind, number: card }));
}

export function getBriscaDeck() {
  return [
    ...getCards('OROS', BRISCA_CARDS),
    ...getCards('COPAS', BRISCA_CARDS),
    ...getCards('BASTOS', BRISCA_CARDS),
    ...getCards('ESPADAS', BRISCA_CARDS),
  ];
}

export function isInvalidBrisca(set, pick, played, triumph) {
  if (set.some(x => x.kind === played.kind)) return pick.kind !== played.kind;
  if (set.some(x => x.kind === triumph.kind)) return pick.kind !== triumph.kind;
  return false;
}
