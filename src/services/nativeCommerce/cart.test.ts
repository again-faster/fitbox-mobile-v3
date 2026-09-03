import { describe, expect, it } from '@jest/globals';
import {
  addCartLine,
  removeCartLine,
  setCartLineQuantity,
} from './cart';

describe('native commerce cart operations', () => {
  const lines = [
    { variant_id: 'shirt-black-m', quantity: 1 },
    { variant_id: 'grips-medium', quantity: 2 },
  ];

  it('increments an existing line without moving it between gyms', () => {
    expect(addCartLine(lines, 'shirt-black-m')).toEqual([
      { variant_id: 'shirt-black-m', quantity: 2 },
      { variant_id: 'grips-medium', quantity: 2 },
    ]);
  });

  it('clamps quantities and removes a line at zero', () => {
    expect(setCartLineQuantity(lines, 'shirt-black-m', 500)).toEqual([
      { variant_id: 'shirt-black-m', quantity: 99 },
      { variant_id: 'grips-medium', quantity: 2 },
    ]);
    expect(setCartLineQuantity(lines, 'shirt-black-m', 0)).toEqual([
      { variant_id: 'grips-medium', quantity: 2 },
    ]);
  });

  it('removes only the requested variant', () => {
    expect(removeCartLine(lines, 'shirt-black-m')).toEqual([
      { variant_id: 'grips-medium', quantity: 2 },
    ]);
  });
});
