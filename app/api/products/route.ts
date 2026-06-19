import { NextRequest, NextResponse } from 'next/server';
import { listActiveProducts } from '@/lib/store';
import type { Product } from '@/lib/types';

const SORTS = new Set(['price-asc', 'price-desc', 'name', 'newest']);

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const search = (sp.get('search') ?? '').trim().toLowerCase();
  const categories = sp.getAll('category');
  const minPrice = sp.get('minPrice') ? Number(sp.get('minPrice')) : undefined;
  const maxPrice = sp.get('maxPrice') ? Number(sp.get('maxPrice')) : undefined;
  const sort = sp.get('sort') ?? 'newest';
  const page = Math.max(1, Number(sp.get('page') ?? '1'));
  const pageSize = Math.min(50, Math.max(1, Number(sp.get('pageSize') ?? '6')));

  let items = listActiveProducts();

  if (search) {
    items = items.filter(
      (p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search),
    );
  }
  if (categories.length) {
    items = items.filter((p) => categories.includes(p.category));
  }
  if (typeof minPrice === 'number' && !Number.isNaN(minPrice)) {
    items = items.filter((p) => p.price >= minPrice);
  }
  if (typeof maxPrice === 'number' && !Number.isNaN(maxPrice)) {
    items = items.filter((p) => p.price <= maxPrice);
  }

  const compare: Record<string, (a: Product, b: Product) => number> = {
    'price-asc': (a, b) => a.price - b.price,
    'price-desc': (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name),
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  };
  items.sort(SORTS.has(sort) ? compare[sort] : compare.newest);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return NextResponse.json({ items: paged, total, page, pageSize, totalPages });
}
