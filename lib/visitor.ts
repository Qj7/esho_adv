import { cookies } from 'next/headers';

const VISITOR_COOKIE = 'qr_visitor';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type VisitorInfo = {
  id: string;
  visits: number;
  firstSeenAt: string;
  isReturning: boolean;
};

type VisitorCookie = {
  id: string;
  visits: number;
  firstSeenAt: string;
};

function parseVisitorCookie(raw: string | undefined): VisitorCookie | null {
  if (!raw) return null;

  try {
    const data = JSON.parse(raw) as VisitorCookie;
    if (typeof data.id === 'string' && typeof data.visits === 'number' && typeof data.firstSeenAt === 'string') {
      return data;
    }
  } catch {
    return null;
  }

  return null;
}

export function extractIp(headersList: Headers): string {
  const forwarded = headersList.get('x-forwarded-for');
  if (forwarded) {
    const clientIp = forwarded.split(',')[0]?.trim();
    if (clientIp) return clientIp;
  }

  return headersList.get('x-real-ip') || 'Unknown';
}

export async function trackVisitor(): Promise<VisitorInfo> {
  const cookieStore = await cookies();
  const existing = parseVisitorCookie(cookieStore.get(VISITOR_COOKIE)?.value);
  const now = new Date().toISOString();

  const visitor: VisitorCookie = existing
    ? {
        ...existing,
        visits: existing.visits + 1,
      }
    : {
        id: crypto.randomUUID(),
        visits: 1,
        firstSeenAt: now,
      };

  cookieStore.set(VISITOR_COOKIE, JSON.stringify(visitor), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });

  return {
    ...visitor,
    isReturning: visitor.visits > 1,
  };
}
