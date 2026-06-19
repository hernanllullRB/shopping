import { getStore } from './store';
import type { Coupon } from './types';

export interface CouponEvaluation {
  valid: boolean;
  discount: number;
  total: number;
  error?: string;
  code?: string;
  coupon?: Coupon;
}

export function evaluateCoupon(input: {
  code: string;
  subtotal: number;
  username: string;
}): CouponEvaluation {
  const { code, subtotal, username } = input;
  const coupon = getStore().coupons.get(code.toUpperCase());

  if (!coupon || !coupon.active) {
    return { valid: false, discount: 0, total: subtotal, error: 'Cupón inválido', code: 'COUPON_INVALID' };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    return { valid: false, discount: 0, total: subtotal, error: 'Cupón expirado', code: 'COUPON_EXPIRED' };
  }
  if (typeof coupon.maxUses === 'number' && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, discount: 0, total: subtotal, error: 'Cupón agotado', code: 'COUPON_EXHAUSTED' };
  }
  if (coupon.perUserOnce && coupon.usedByUsers.has(username)) {
    return { valid: false, discount: 0, total: subtotal, error: 'Ya usaste este cupón', code: 'COUPON_ALREADY_USED' };
  }
  if (typeof coupon.minSubtotal === 'number' && subtotal < coupon.minSubtotal) {
    return {
      valid: false,
      discount: 0,
      total: subtotal,
      error: `Subtotal mínimo $${coupon.minSubtotal}`,
      code: 'COUPON_MIN_SUBTOTAL',
    };
  }

  const discount =
    coupon.type === 'percent'
      ? Math.round(subtotal * (coupon.value / 100) * 100) / 100
      : Math.min(coupon.value, subtotal);
  const total = Math.round((subtotal - discount) * 100) / 100;
  return { valid: true, discount, total, coupon };
}

export function consumeCoupon(coupon: Coupon, username: string): void {
  coupon.usedCount += 1;
  coupon.usedByUsers.add(username);
}
