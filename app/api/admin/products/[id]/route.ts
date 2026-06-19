import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getStore } from '@/lib/store';
import { adminUpdateProductSchema, fieldErrorsFromZod } from '@/lib/validators';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, 'admin');
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = adminUpdateProductSchema.safeParse(body);
  if (!parsed.success) {
    const { firstMessage, details } = fieldErrorsFromZod(parsed.error);
    return NextResponse.json({ error: firstMessage, details }, { status: 400 });
  }

  const product = getStore().products.get(params.id);
  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado', code: 'NOT_FOUND' }, { status: 404 });
  }
  Object.assign(product, parsed.data);
  return NextResponse.json({ product });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = requireRole(request, 'admin');
  if (!auth.ok) return auth.response;
  const product = getStore().products.get(params.id);
  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado', code: 'NOT_FOUND' }, { status: 404 });
  }
  product.active = false;
  return NextResponse.json({ ok: true });
}
