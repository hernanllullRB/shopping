import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getStore } from '@/lib/store';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const orders = getStore()
    .orders.filter((o) => o.username === auth.payload.username)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ orders });
}
