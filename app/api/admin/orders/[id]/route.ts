import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getProduct, getStore } from '@/lib/store';
import { adminUpdateOrderStatusSchema, fieldErrorsFromZod } from '@/lib/validators';
import type { OrderStatus } from '@/lib/types';

const FLOW: Record<OrderStatus, OrderStatus[]> = {
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, 'admin');
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = adminUpdateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    const { firstMessage, details } = fieldErrorsFromZod(parsed.error);
    return NextResponse.json({ error: firstMessage, details }, { status: 400 });
  }

  const order = getStore().orders.find((o) => o.id === params.id);
  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada', code: 'NOT_FOUND' }, { status: 404 });
  }
  const next = parsed.data.status;
  if (!FLOW[order.status].includes(next)) {
    return NextResponse.json(
      { error: `Transición inválida: ${order.status} → ${next}`, code: 'INVALID_STATUS_TRANSITION' },
      { status: 422 },
    );
  }
  if (next === 'cancelled') {
    for (const item of order.items) {
      const product = getProduct(item.productId);
      if (product) product.stock += item.quantity;
    }
  }
  order.status = next;
  order.updatedAt = new Date().toISOString();
  return NextResponse.json({ order });
}
