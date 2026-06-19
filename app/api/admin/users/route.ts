import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getStore } from '@/lib/store';

export async function GET(request: NextRequest) {
  const auth = requireRole(request, 'admin');
  if (!auth.ok) return auth.response;
  const users = Array.from(getStore().users.values()).map((u) => {
    const { passwordHash, ...rest } = u;
    return rest;
  });
  return NextResponse.json({ users });
}
