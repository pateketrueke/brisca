/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import { isInvalidBrisca } from '../src/app/shared/helpers.js';

describe('Brisca rules', () => {
  const triumph = { kind: 'BASTOS' };
  const card = { kind: 'ESPADAS' };

  it('should disable all non-triumph cards', () => {
    const set = [
      { kind: 'OROS' },
      { kind: 'COPAS' },
      { kind: 'BASTOS' },
    ];

    expect(isInvalidBrisca(set, set[0], card, triumph)).to.be.true;
    expect(isInvalidBrisca(set, set[1], card, triumph)).to.be.true;
    expect(isInvalidBrisca(set, set[2], card, triumph)).to.be.false;
  });

  it('should disable cards if played are present', () => {
    const set = [
      { kind: 'COPAS' },
      { kind: 'ESPADAS' },
    ];

    expect(isInvalidBrisca(set, set[0], card, triumph)).to.be.true;
    expect(isInvalidBrisca(set, set[1], card, triumph)).to.be.false;
  });

  it('should enable all cards if not played/triumph', () => {
    const set = [
      { kind: 'OROS' },
      { kind: 'COPAS' },
    ];

    expect(isInvalidBrisca(set, set[0], card, triumph)).to.be.false;
    expect(isInvalidBrisca(set, set[1], card, triumph)).to.be.false;
  });

  it('should disable triumphs if played cards are present', () => {
    const set = [
      { kind: 'BASTOS' },
      { kind: 'ESPADAS' },
    ];

    expect(isInvalidBrisca(set, set[0], card, triumph)).to.be.true;
    expect(isInvalidBrisca(set, set[1], card, triumph)).to.be.false;
  });
});
