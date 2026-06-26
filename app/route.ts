import { NextRequest, NextResponse } from 'next/server';
import {
  buildTelegramMessage,
  extractGeo,
  parseDevice,
  sendTelegramNotification,
} from '@/lib/qr-scan';
import {
  extractIp,
  trackVisitor,
  VISITOR_COOKIE,
  VISITOR_COOKIE_MAX_AGE,
  visitorCookiePayload,
} from '@/lib/visitor';

export const dynamic = 'force-dynamic';
export const preferredRegion = ['sin1', 'iad1', 'fra1'];

export async function GET(request: NextRequest) {
  const redirectUrl = process.env.REDIRECT_URL;

  if (!redirectUrl) {
    return new NextResponse('REDIRECT_URL is not configured', { status: 500 });
  }

  const headersList = request.headers;
  const geo = extractGeo(headersList);
  const ip = extractIp(headersList);
  const userAgent = headersList.get('user-agent') || '';
  const device = parseDevice(userAgent);
  const visitor = trackVisitor(request.cookies.get(VISITOR_COOKIE)?.value);

  const text = buildTelegramMessage({ geo, device, userAgent, ip, visitor });
  await sendTelegramNotification(text);

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(VISITOR_COOKIE, visitorCookiePayload(visitor), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: VISITOR_COOKIE_MAX_AGE,
    path: '/',
  });

  return response;
}
