import { NextResponse } from 'next/server';
import { getProduct } from '@/lib/store';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const product = getProduct(params.id);
  if (!product || !product.active) {
    return NextResponse.json({ error: 'Producto no encontrado', code: 'NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({ product });
}
