import type { CartItem, CartResponse } from "@/lib/types";

export const createEmptyCartSummary = (): CartResponse["summary"] => ({
  subtotal: 0,
  tax: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
});

export const calculateCartSummary = (items: CartItem[]): CartResponse["summary"] => {
  if (!items.length) {
    return createEmptyCartSummary();
  }

  const subtotal = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const deliveryFee = 20;
  const discount = 0;
  const total = subtotal + tax + deliveryFee - discount;

  return { subtotal, tax, deliveryFee, discount, total };
};
