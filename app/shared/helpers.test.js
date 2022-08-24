/* eslint-disable no-unused-expressions */

import { test } from '@japa/runner';
import { isInvalidBrisca } from './helpers.js';

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
