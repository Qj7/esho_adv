export function parseDevice(userAgent: string): string {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Android/i.test(userAgent)) return 'Android';
  return 'Desktop/Other';
}

export function decodeHeader(value: string | null): string {
  if (!value) return 'Unknown';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export type ScanGeo = {
  country: string;
  city: string;
  region: string;
  latitude: string;
  timezone: string;
};

export function extractGeo(headersList: Headers): ScanGeo {
  return {
    country: decodeHeader(headersList.get('x-vercel-ip-country')),
    city: decodeHeader(headersList.get('x-vercel-ip-city')),
    region: decodeHeader(headersList.get('x-vercel-ip-country-region')),
    latitude: headersList.get('x-vercel-ip-latitude') || 'Unknown',
    timezone: headersList.get('x-vercel-ip-timezone') || 'Unknown',
  };
}

export type CookieScanData = {
  scanCount: number;
  firstScanAt: string;
  visitorId: string;
  isReturning: boolean;
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 год

export function readScanCookies(
  get: (name: string) => { value: string } | undefined,
): CookieScanData {
  const scanCount = parseInt(get('qr_scan_count')?.value || '0', 10);
  const firstScanAt = get('qr_first_scan')?.value || '';
  const visitorId = get('qr_visitor_id')?.value || '';

  return {
    scanCount,
    firstScanAt,
    visitorId,
    isReturning: scanCount > 0,
  };
}

export function writeScanCookies(
  set: (
    name: string,
    value: string,
    options: { maxAge: number; path: string; httpOnly: boolean; sameSite: 'lax' },
  ) => void,
  existing: CookieScanData,
): CookieScanData {
  const now = new Date().toISOString();
  const visitorId =
    existing.visitorId || crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const firstScanAt = existing.firstScanAt || now;
  const scanCount = existing.scanCount + 1;

  const opts = {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
  };

  set('qr_visitor_id', visitorId, opts);
  set('qr_first_scan', firstScanAt, opts);
  set('qr_scan_count', String(scanCount), opts);
  set('qr_last_scan', now, opts);

  return { scanCount, firstScanAt, visitorId, isReturning: existing.scanCount > 0 };
}

export function buildTelegramMessage(params: {
  geo: ScanGeo;
  device: string;
  userAgent: string;
  cookies: CookieScanData;
  lastScanAt: string;
}): string {
  const { geo, device, userAgent, cookies, lastScanAt } = params;
  const visitLabel = cookies.isReturning ? 'повторный визит' : 'новый посетитель';

  return [
    '🔥 Скан QR-кода!',
    `📍 Город: ${geo.city}, ${geo.country}`,
    geo.region !== 'Unknown' ? `🗺 Регион: ${geo.region}` : null,
    `📱 Устройство: ${device}`,
    `🕐 Часовой пояс: ${geo.timezone}`,
    '',
    '🍪 Визиты:',
    `• ID посетителя: ${cookies.visitorId}`,
    `• Сканов: ${cookies.scanCount} (${visitLabel})`,
    `• Первый: ${cookies.firstScanAt}`,
    `• Последний: ${lastScanAt}`,
    '',
    `🌐 UA: ${userAgent.slice(0, 120)}${userAgent.length > 120 ? '…' : ''}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function sendTelegramNotification(text: string): void {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    console.error('[qr] TG_BOT_TOKEN или TG_CHAT_ID не заданы');
    return;
  }

  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((err) => console.error('[qr] Telegram error:', err));
}
