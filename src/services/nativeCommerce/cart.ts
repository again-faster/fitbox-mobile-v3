export const MAX_NATIVE_CART_QUANTITY = 99;

export type NativeCartInputLine = {
  variant_id: string;
  quantity: number;
};

const normalizedQuantity = (quantity: number): number => {
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(MAX_NATIVE_CART_QUANTITY, Math.max(0, Math.floor(quantity)));
};

export const removeCartLine = (
  lines: NativeCartInputLine[],
  variantId: string,
): NativeCartInputLine[] => lines.filter(line => line.variant_id !== variantId);

export const setCartLineQuantity = (
  lines: NativeCartInputLine[],
  variantId: string,
  quantity: number,
): NativeCartInputLine[] => {
  const nextQuantity = normalizedQuantity(quantity);
  if (nextQuantity === 0) return removeCartLine(lines, variantId);

  return lines.map(line =>
    line.variant_id === variantId
      ? { ...line, quantity: nextQuantity }
      : line,
  );
};

export const addCartLine = (
  lines: NativeCartInputLine[],
  variantId: string,
): NativeCartInputLine[] => {
  const existing = lines.find(line => line.variant_id === variantId);
  if (!existing) return [...lines, { variant_id: variantId, quantity: 1 }];

  return setCartLineQuantity(lines, variantId, existing.quantity + 1);
};
