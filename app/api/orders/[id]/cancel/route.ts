import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getProduct, getStore } from '@/lib/store';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;

  const store = getStore();
  const order = store.orders.find((o) => o.id === params.id);
  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada', code: 'NOT_FOUND' }, { status: 404 });
  }
  if (order.username !== auth.payload.username && auth.payload.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado', code: 'FORBIDDEN' }, { status: 403 });
  }
  if (order.status !== 'paid') {
    return NextResponse.json(
      { error: `No se puede cancelar una orden en estado ${order.status}`, code: 'INVALID_STATUS_TRANSITION' },
      { status: 422 },
    );
  }

  for (const item of order.items) {
    const product = getProduct(item.productId);
    if (product) product.stock += item.quantity;
  }
  order.status = 'cancelled';
  order.updatedAt = new Date().toISOString();
  return NextResponse.json({ order });
}
