import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getStore, listAllProducts } from '@/lib/store';
import { adminProductSchema, fieldErrorsFromZod } from '@/lib/validators';
import type { Product } from '@/lib/types';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'admin');
  if (!auth.ok) return auth.response;
  return NextResponse.json({ products: listAllProducts() });
}

export async function POST(request: NextRequest) {
  const auth = requireRole(request, 'admin');
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const parsed = adminProductSchema.safeParse(body);
  if (!parsed.success) {
    const { firstMessage, details } = fieldErrorsFromZod(parsed.error);
    return NextResponse.json({ error: firstMessage, details }, { status: 400 });
  }
  const store = getStore();
  const id = `prod-${String(store.products.size + 1).padStart(3, '0')}-${Date.now().toString(36)}`;
  const product: Product = {
    id,
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price,
    stock: parsed.data.stock,
    imageUrl: parsed.data.imageUrl,
    category: parsed.data.category,
    active: parsed.data.active ?? true,
    createdAt: new Date().toISOString(),
  };
  store.products.set(id, product);
  return NextResponse.json({ product }, { status: 201 });
}
