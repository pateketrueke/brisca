/* eslint-disable no-unused-expressions */

import { test } from '@japa/runner';
import {
  chooseBotCard,
  getBotStance,
  getLegalCards,
  isInvalidBrisca,
} from './helpers.js';

test.group('Brisca rules', () => {
  const triumph = { kind: 'BASTOS' };
  const card = { kind: 'ESPADAS' };

  test('should disable all non-triumph cards', ({ expect }) => {
    const set = [
      { kind: 'OROS' },
      { kind: 'COPAS' },
      { kind: 'BASTOS' },
    ];

    expect(isInvalidBrisca(set, set[0], card, triumph)).toBeTruthy();
    expect(isInvalidBrisca(set, set[1], card, triumph)).toBeTruthy();
    expect(isInvalidBrisca(set, set[2], card, triumph)).toBeFalsy();
  });

  test('should disable cards if played are present', ({ expect }) => {
    const set = [
      { kind: 'COPAS' },
      { kind: 'ESPADAS' },
    ];

    expect(isInvalidBrisca(set, set[0], card, triumph)).toBeTruthy();
    expect(isInvalidBrisca(set, set[1], card, triumph)).toBeFalsy();
  });

  test('should enable all cards if not played/triumph', ({ expect }) => {
    const set = [
      { kind: 'OROS' },
      { kind: 'COPAS' },
    ];

    expect(isInvalidBrisca(set, set[0], card, triumph)).toBeFalsy();
    expect(isInvalidBrisca(set, set[1], card, triumph)).toBeFalsy();
  });

  test('should disable triumphs if played cards are present', ({ expect }) => {
    const set = [
      { kind: 'BASTOS' },
      { kind: 'ESPADAS' },
    ];

    expect(isInvalidBrisca(set, set[0], card, triumph)).toBeTruthy();
    expect(isInvalidBrisca(set, set[1], card, triumph)).toBeFalsy();
  });
});

test.group('Brisca bot', () => {
  const triumph = { kind: 'BASTOS', number: 4 };

  function createGame(overrides = {}) {
    return {
      deck: [{ kind: 'OROS', number: 2 }],
      length: '2',
      ordered: ['p1', 'p2'],
      players: ['p1', 'p2'],
      triumph,
      turn: 'p2',
      winner: 'p1',
      p1: {
        hand: [],
        set: [{ kind: 'COPAS', number: 10 }],
        stack: [],
      },
      p2: {
        hand: [
          { kind: 'COPAS', number: 11 },
          { kind: 'BASTOS', number: 1 },
          { kind: 'OROS', number: 4 },
        ],
        set: [],
        stack: [],
      },
      ...overrides,
    };
  }

  test('chooses the lowest same-suit winner instead of spending trump', ({ expect }) => {
    const game = createGame({
      deck: [],
      p2: {
        hand: [
          { kind: 'COPAS', number: 11 },
          { kind: 'COPAS', number: 1 },
          { kind: 'BASTOS', number: 1 },
        ],
        set: [],
        stack: [{ kind: 'OROS', number: 1 }],
      },
    });

    expect(chooseBotCard(game, 'p2')).toEqual({ kind: 'COPAS', number: 11 });
  });

  test('discards low non-trump cards when it cannot win', ({ expect }) => {
    const game = createGame({
      p1: {
        hand: [],
        set: [{ kind: 'COPAS', number: 4 }],
        stack: [],
      },
      p2: {
        hand: [
          { kind: 'OROS', number: 4 },
          { kind: 'OROS', number: 5 },
          { kind: 'ESPADAS', number: 12 },
        ],
        set: [],
        stack: [],
      },
    });

    expect(chooseBotCard(game, 'p2')).toEqual({ kind: 'OROS', number: 4 });
  });

  test('uses last-round legal card rules when the deck is empty', ({ expect }) => {
    const game = createGame({
      deck: [],
      p2: {
        hand: [
          { kind: 'OROS', number: 4 },
          { kind: 'BASTOS', number: 1 },
          { kind: 'ESPADAS', number: 12 },
        ],
        set: [],
        stack: [],
      },
    });

    expect(getLegalCards(game, 'p2')).toEqual([{ kind: 'BASTOS', number: 1 }]);
  });

  test('switches to aggressive stance when already safely in the game', ({ expect }) => {
    const game = createGame({
      p2: {
        hand: [{ kind: 'OROS', number: 4 }],
        set: [],
        stack: [{ kind: 'OROS', number: 1 }],
      },
    });

    expect(getBotStance(game, 'p2')).toBe('aggressive');
  });

  test('does not lead with high trump just because it is aggressive', ({ expect }) => {
    const game = createGame({
      turn: 'p2',
      winner: 'p2',
      p1: {
        hand: [],
        set: [],
        stack: [],
      },
      p2: {
        hand: [
          { kind: 'BASTOS', number: 1 },
          { kind: 'OROS', number: 3 },
          { kind: 'COPAS', number: 4 },
        ],
        set: [],
        stack: [{ kind: 'OROS', number: 1 }],
      },
    });

    expect(getBotStance(game, 'p2')).toBe('aggressive');
    expect(chooseBotCard(game, 'p2')).toEqual({ kind: 'COPAS', number: 4 });
  });

  test('feeds controlled points to low-score opponents instead of letting them avoid joining', ({ expect }) => {
    const game = createGame({
      p1: {
        hand: [],
        set: [{ kind: 'COPAS', number: 4 }],
        stack: [],
      },
      p2: {
        hand: [
          { kind: 'OROS', number: 4 },
          { kind: 'ESPADAS', number: 12 },
          { kind: 'OROS', number: 5 },
        ],
        set: [],
        stack: [{ kind: 'OROS', number: 1 }],
      },
    });

    expect(chooseBotCard(game, 'p2')).toEqual({ kind: 'ESPADAS', number: 12 });
  });
});
