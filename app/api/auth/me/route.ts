import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { findUserByUsername } from '@/lib/store';

export async function GET(request: NextRequest) {
  const auth = requireAuth(request);
  if (!auth.ok) return auth.response;
  const user = findUserByUsername(auth.payload.username);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
  const { passwordHash, ...publicUser } = user;
  return NextResponse.json({ user: publicUser });
}
