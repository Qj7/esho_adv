export const VISITOR_COOKIE = 'qr_visitor';
export const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

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

export function trackVisitor(cookieValue: string | undefined): VisitorInfo {
  const existing = parseVisitorCookie(cookieValue);
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

  return {
    ...visitor,
    isReturning: visitor.visits > 1,
  };
}

export function visitorCookiePayload(visitor: VisitorInfo): string {
  return JSON.stringify({
    id: visitor.id,
    visits: visitor.visits,
    firstSeenAt: visitor.firstSeenAt,
  });
}
