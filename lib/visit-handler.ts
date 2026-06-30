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

export async function handleVisit(request: NextRequest): Promise<NextResponse> {
  const headersList = request.headers;
  const geo = extractGeo(headersList);
  const ip = extractIp(headersList);
  const userAgent = headersList.get('user-agent') || '';
  const device = parseDevice(userAgent);
  const visitor = trackVisitor(request.cookies.get(VISITOR_COOKIE)?.value);

  const text = buildTelegramMessage({ geo, device, userAgent, ip, visitor });
  await sendTelegramNotification(text);

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
