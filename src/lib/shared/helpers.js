export const EMPTY_GAME = {
  bots: ['p2'],
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

export function getCardPoints(card) {
  return BRISCA_VALUES[card.number] || 0;
}

export function compareBriscaCards(challenger, current, triumph) {
  if (challenger.kind === current.kind) {
    const challengerPoints = getCardPoints(challenger);
    const currentPoints = getCardPoints(current);

    if (challengerPoints || currentPoints) return challengerPoints - currentPoints;
    return challenger.number - current.number;
  }

  if (challenger.kind === triumph.kind && current.kind !== triumph.kind) return 1;
  return -1;
}

export function getTrickCards(game) {
  return game.ordered
    .map(player => ({ player, card: game[player].set[0] }))
    .filter(({ card }) => card);
}

export function getTrickWinner(game, cards = getTrickCards(game)) {
  return cards.reduce((winner, play) => {
    if (!winner) return play;
    return compareBriscaCards(play.card, winner.card, game.triumph) > 0
      ? play
      : winner;
  }, null);
}

export function getLegalCards(game, player) {
  const hand = game[player].hand;
  const opener = game.winner && game[game.winner]?.set[0];

  if (!game.deck.length && opener && game.turn !== game.winner) {
    return hand.filter(card => !isInvalidBrisca(hand, card, opener, game.triumph));
  }

  return hand;
}

export function getPlayerScore(game, player) {
  return game[player].stack.reduce(
    (total, card) => total + getCardPoints(card),
    0
  );
}

function getCardRank(card) {
  if (card.number === 1) return 14;
  if (card.number === 3) return 13;
  return card.number;
}

function getTrickPoints(cards) {
  return cards.reduce((total, { card }) => total + getCardPoints(card), 0);
}

function isLikelyPointCard(card) {
  return getCardPoints(card) >= 3;
}

export function getBotStance(game, player) {
  const score = getPlayerScore(game, player);
  const hand = game[player].hand;
  const trumpPoints = hand
    .filter(card => card.kind === game.triumph.kind)
    .reduce((total, card) => total + getCardPoints(card), 0);
  const handPoints = hand.reduce((total, card) => total + getCardPoints(card), 0);

  if (!game.deck.length || score >= 10) return 'aggressive';
  if (score + trumpPoints + handPoints >= 10) return 'balanced';
  return 'evasive';
}

function scoreLeadCard(game, player, card) {
  const stance = getBotStance(game, player);
  const points = getCardPoints(card);
  const isTrump = card.kind === game.triumph.kind;
  const reservePenalty = (isTrump ? 10 : 0) + points * 2 + getCardRank(card) / 10;

  if (stance === 'evasive') return -reservePenalty - points * 3;
  if (stance === 'balanced') return isTrump || isLikelyPointCard(card) ? -reservePenalty : 6 - reservePenalty;
  return points * 3 + (isTrump ? 4 : 0) + getCardRank(card) / 10;
}

function scoreFollowCard(game, player, card, cards) {
  const stance = getBotStance(game, player);
  const candidate = cards.concat({ player, card });
  const winner = getTrickWinner(game, candidate);
  const points = getCardPoints(card);
  const isTrump = card.kind === game.triumph.kind;
  const trickPoints = getTrickPoints(candidate);
  const winning = winner.player === player;
  const reservePenalty = (isTrump ? 8 : 0) + points * 5 + getCardRank(card) / 10;

  if (winning) {
    const sameSuitWin = cards[0]?.card.kind === card.kind;
    const winBonus = trickPoints * 4 + (sameSuitWin ? 8 : 0);

    if (stance === 'evasive' && getPlayerScore(game, player) + trickPoints >= 10) {
      return winBonus - reservePenalty - 30;
    }

    return winBonus - reservePenalty + (stance === 'aggressive' ? 10 : 0);
  }

  return -points * 3 - (isTrump ? 20 : 0) - getCardRank(card) / 10;
}

export function chooseBotCard(game, player) {
  const legalCards = getLegalCards(game, player);
  const cards = getTrickCards(game);
  const scoreCard = cards.length
    ? card => scoreFollowCard(game, player, card, cards)
    : card => scoreLeadCard(game, player, card);

  return legalCards
    .slice()
    .sort((a, b) => scoreCard(b) - scoreCard(a))[0];
}
