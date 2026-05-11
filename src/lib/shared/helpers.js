export const TRANSLATIONS = {
  en: {
    title: 'Brisca',
    deal: 'Deal',
    exit: 'Exit',
    ok: 'OK',
    or: 'Or',
    empty: 'Empty',
    autoOk: 'Auto OK',
    players: 'Players',
    human: 'Human',
    bot: 'Bot',
    yourTurn: "Your turn",
    loading: 'Loading...',
    turnsLeft: n => `${n} turn${n === 1 ? '' : 's'} left`,
    winsHand: name => `${name} wins the hand!`,
    winsGame: name => `${name} wins the game!`,
    opensGame: name => `${name} opens`,
    scored: (name, pts) => `${name} scored ${pts} pts`,
    exitConfirm: 'Do you want to end this game?',
    cancel: 'Cancel',
    continue: 'Continue',
    howToPlay: 'How to play',
    rules: {
      title: 'How to play Brisca',
      intro: 'Brisca is a classic Spanish trick-taking card game for 2–4 players.',
      deck: 'The deck has 40 cards in 4 suits: Coins (Oros), Cups (Copas), Clubs (Bastos), and Swords (Espadas). Cards 8 and 9 are removed.',
      values: 'Card values:',
      valueRows: [
        ['1 (Ace)', '11 pts'],
        ['3', '10 pts'],
        ['King (12)', '4 pts'],
        ['Knight (11)', '3 pts'],
        ['Jack (10)', '2 pts'],
        ['2, 4, 5, 6, 7', '0 pts'],
      ],
      triumph: 'Triumph: One card is drawn after dealing and placed under the deck. Its suit is the trump suit — it beats all other suits.',
      turn: 'On your turn, play one card. The highest card of the leading suit wins, unless a trump card is played — the highest trump wins.',
      draw: 'After each trick, the winner draws first, then others in order.',
      lastRound: 'Last round rule: when the deck is empty, you must follow the leading suit if possible, or play trump if you cannot.',
      winning: 'The player with the most points at the end wins. There are 120 points total.',
    },
    about: 'About',
    aboutTitle: 'Brisca',
    aboutDesc: 'A classic Spanish card game, playable offline on any device. Built with Svelte.',
    aboutAuthor: 'by pateketrueke',
    aboutVersion: v => `Version ${v}`,
    aboutSource: 'Source code on GitHub',
    team: n => `Team ${n}`,
    teamWins: n => `Team ${n} wins!`,
    teamPeek: 'See teammate\'s cards',
    teamReturn: 'Return cards',
    defaultNames: { p1: 'You', p2: 'Bot', p3: 'Bot 2', p4: 'Bot 3' },
    room: {
      label: 'Online room',
      linkHint: 'Room link detected — pick a role and join.',
      copy: 'Copy',
      copyLink: 'Copy link',
      closeRoom: 'Close room',
      leaveRoom: 'Leave room',
      close: 'Close',
      leave: 'Leave',
      connected: 'connected',
      roomLabel: 'Room',
      seatLabel: 'seat',
      open: 'open',
      taken: 'taken',
      codePlaceholder: 'Paste room code',
      rolePlayer: 'Player',
      roleSpectator: 'Spectator',
      roleHost: 'Host',
      joinRoom: 'Join room',
      createRoom: 'Create room',
      seat: n => `Seat ${n}`,
      roles: { host: 'Host', player: 'Player', spectator: 'Spectator' },
    },
  },
  es: {
    title: 'Brisca',
    deal: 'Dar cartas',
    exit: 'Salir',
    ok: 'OK',
    or: 'o',
    autoOk: 'Auto OK',
    players: 'Jugadores',
    human: 'Persona',
    bot: 'Bot',
    yourTurn: 'Tu turno',
    loading: 'Cargando...',
    turnsLeft: n => `${n} ${n === 1 ? 'vuelta' : 'vueltas'}`,
    winsHand: name => `¡${name} se lleva la mano!`,
    winsGame: name => `¡${name} ganó el juego!`,
    opensGame: name => `${name} empieza`,
    scored: (name, pts) => `${name} juntó ${pts} pts`,
    exitConfirm: '¿Le paras al juego?',
    empty: 'Nada',
    cancel: 'Cancelar',
    continue: 'Sí, salir',
    howToPlay: '¿Cómo se juega?',
    rules: {
      title: 'Cómo se juega la Brisca',
      intro: 'La Brisca es un clásico juego de cartas español para 2–4 jugadores. El que más puntos junte, gana.',
      deck: 'Se juega con baraja española de 40 cartas: Oros, Copas, Bastos y Espadas.',
      values: 'Valor de las cartas:',
      valueRows: [
        ['1 (As)', '11 pts'],
        ['3', '10 pts'],
        ['Rey (12)', '4 pts'],
        ['Caballo (11)', '3 pts'],
        ['Sota (10)', '2 pts'],
        ['2, 4, 5, 6, 7', '0 pts'],
      ],
      triumph: 'Triunfo: al repartir se voltea una carta y se mete debajo del mazo. Ese palo es el triunfo — le gana a todos los demás palos.',
      turn: 'En tu turno juegas una carta. Gana la carta más alta del palo que salió, a menos que alguien eche triunfo — ahí gana el triunfo más alto.',
      draw: 'Después de cada baza, el ganador agarra carta primero, luego los demás.',
      lastRound: 'Al final, cuando ya no hay mazo, tienes que seguir el palo que salió si puedes, o echar triunfo si no tienes.',
      winning: 'Gana quien tenga más puntos al terminar. En total hay 120 puntos.',
    },
    about: 'Acerca de',
    aboutTitle: 'Brisca',
    aboutDesc: 'El clásico juego de cartas español, disponible sin internet en cualquier dispositivo. Hecho con Svelte.',
    aboutAuthor: 'por pateketrueke',
    aboutVersion: v => `Versión ${v}`,
    aboutSource: 'Código fuente en GitHub',
    team: n => `Equipo ${n}`,
    teamWins: n => `¡Equipo ${n} gana!`,
    teamPeek: 'Ver cartas del compañero',
    teamReturn: 'Regresar cartas',
    defaultNames: { p1: 'Yo', p2: 'Bot', p3: 'Bot 2', p4: 'Bot 3' },
    room: {
      label: 'Sala en línea',
      linkHint: 'Enlace de sala detectado — elige un rol y únete.',
      copy: 'Copiar',
      copyLink: 'Copiar enlace',
      closeRoom: 'Cerrar sala',
      leaveRoom: 'Dejar sala',
      close: 'Cerrar',
      leave: 'Salir',
      connected: 'conectados',
      roomLabel: 'Sala',
      seatLabel: 'lugar',
      open: 'libre',
      taken: 'ocupado',
      codePlaceholder: 'Código de sala',
      rolePlayer: 'Jugador',
      roleSpectator: 'Espectador',
      roleHost: 'Anfitrión',
      joinRoom: 'Unirse',
      createRoom: 'Crear sala',
      seat: n => `Lugar ${n}`,
      roles: { host: 'Anfitrión', player: 'Jugador', spectator: 'Espectador' },
    },
  },
};

export function getLang() {
  try {
    if (localStorage.$lang) return localStorage.$lang;
  } catch { /* ignore */ }
  return navigator.language?.startsWith('es') ? 'es' : 'en';
}

export function setLang(lang) {
  try { localStorage.setItem('$lang', lang); } catch { /* ignore */ }
}

export function t(lang = 'en') {
  return TRANSLATIONS[lang] || TRANSLATIONS.en;
}

export const EMPTY_GAME = {
  bots: ['p2'],
  deck: [],
  length: '2',
  players: [],
  triumph: null,
  status: 'pending',
};

// Team helpers (4-player mode only)
// Seating: p1(12) p2(3) p3(6) p4(9) clockwise — partners sit opposite
export const TEAMS = { p1: 1, p2: 2, p3: 1, p4: 2 };
export const TEAMMATES = { p1: 'p3', p2: 'p4', p3: 'p1', p4: 'p2' };

export function getTeam(player) {
  return TEAMS[player] || null;
}

export function getTeammate(player) {
  return TEAMMATES[player] || null;
}

export function getTeamScore(game, team) {
  return Object.entries(TEAMS)
    .filter(([, t]) => t === team)
    .reduce((s, [p]) => s + (game[p] ? getPlayerScore(game, p) : 0), 0);
}

export function isTeamGame(game) {
  return game.length === '4';
}

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
  const reservePenalty = (isTrump ? 12 : 0) + points * 6 + getCardRank(card) / 5;

  if (stance === 'evasive') return -reservePenalty - points * 3;
  if (stance === 'balanced') return isTrump || isLikelyPointCard(card) ? -reservePenalty : 6 - reservePenalty;
  return isTrump || isLikelyPointCard(card) ? -reservePenalty : 8 - reservePenalty;
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

  if (stance === 'aggressive' && !isTrump && winner.player !== player) {
    const winnerScore = getPlayerScore(game, winner.player);
    const winnerProjectedScore = winnerScore + trickPoints;

    if (winnerScore < 10 && winnerProjectedScore < 10) {
      return points * 6 - getCardRank(card) / 10;
    }
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
