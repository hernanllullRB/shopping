import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { evaluateCoupon } from '@/lib/coupons';
import { fieldErrorsFromZod, validateCouponSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = validateCouponSchema.safeParse(body);
  if (!parsed.success) {
    const { firstMessage, details } = fieldErrorsFromZod(parsed.error);
    return NextResponse.json({ error: firstMessage, details }, { status: 400 });
  }
  const result = evaluateCoupon({
    code: parsed.data.code,
    subtotal: parsed.data.subtotal,
    username: auth.payload.username,
  });
  if (!result.valid) {
    return NextResponse.json(
      { valid: false, error: result.error, code: result.code, discount: 0, total: parsed.data.subtotal },
      { status: 200 },
    );
  }
  return NextResponse.json({ valid: true, discount: result.discount, total: result.total });
}
