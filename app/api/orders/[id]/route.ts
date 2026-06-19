import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getStore } from '@/lib/store';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const order = getStore().orders.find((o) => o.id === params.id);
  if (!order) {
    return NextResponse.json({ error: 'Orden no encontrada', code: 'NOT_FOUND' }, { status: 404 });
  }
  if (order.username !== auth.payload.username && auth.payload.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado', code: 'FORBIDDEN' }, { status: 403 });
  }
  return NextResponse.json({ order });
}
