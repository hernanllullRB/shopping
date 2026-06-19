import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getStore } from '@/lib/store';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'admin');
  if (!auth.ok) return auth.response;
  const status = request.nextUrl.searchParams.get('status');
  let orders = getStore().orders.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (status) orders = orders.filter((o) => o.status === status);
  return NextResponse.json({ orders });
}
