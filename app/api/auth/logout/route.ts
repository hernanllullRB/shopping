import { NextRequest, NextResponse } from 'next/server';
import { extractToken, invalidateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (token) invalidateToken(token);
  return NextResponse.json({ ok: true });
}
