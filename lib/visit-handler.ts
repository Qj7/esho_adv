import { NextRequest, NextResponse } from 'next/server';
import {
  trackVisitor,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  visitorCookiePayload,
} from '@/lib/visitor';

export async function handleVisit(request: NextRequest): Promise<NextResponse> {
  const visitor = trackVisitor(request.cookies.get(VISITOR_COOKIE)?.value);

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(VISITOR_COOKIE, visitorCookiePayload(visitor), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: VISITOR_COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}
