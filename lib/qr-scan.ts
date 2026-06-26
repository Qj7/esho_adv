export function parseDevice(userAgent: string): string {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'iOS';
  if (/Android/i.test(userAgent)) return 'Android';
  return 'Desktop/Other';
}

function decodeHeader(value: string | null): string {
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
  timezone: string;
};

export function extractGeo(headersList: Headers): ScanGeo {
  return {
    country: decodeHeader(headersList.get('x-vercel-ip-country')),
    city: decodeHeader(headersList.get('x-vercel-ip-city')),
    region: decodeHeader(headersList.get('x-vercel-ip-country-region')),
    timezone: headersList.get('x-vercel-ip-timezone') || 'Unknown',
  };
}

function formatDateTime(iso: string, timezone: string): string {
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: 'short',
    timeStyle: 'short',
  };

  if (timezone !== 'Unknown') {
    options.timeZone = timezone;
  }

  return new Date(iso).toLocaleString('ru-RU', options);
}

export function buildTelegramMessage(params: {
  geo: ScanGeo;
  device: string;
  userAgent: string;
  ip: string;
  visitor: {
    id: string;
    visits: number;
    firstSeenAt: string;
    isReturning: boolean;
  };
}): string {
  const { geo, device, userAgent, ip, visitor } = params;

  const title = visitor.isReturning
    ? `🔄 Повторный визит! (#${visitor.visits})`
    : '🔥 Новый посетитель — скан QR-кода!';

  return [
    title,
    `📍 Город: ${geo.city}, ${geo.country}`,
    geo.region !== 'Unknown' ? `🗺 Регион: ${geo.region}` : null,
    `🌐 IP: ${ip}`,
    `📱 Устройство: ${device}`,
    `🕐 Часовой пояс: ${geo.timezone}`,
    '',
    visitor.isReturning
      ? `👤 Первый визит: ${formatDateTime(visitor.firstSeenAt, geo.timezone)}`
      : `👤 ID: ${visitor.id.slice(0, 8)}…`,
    '',
    `🌐 UA: ${userAgent.slice(0, 120)}${userAgent.length > 120 ? '…' : ''}`,
  ]
    .filter(Boolean)
    .join('\n');
}

import { readTelegramEnv, sendTelegramMessage } from '@/lib/telegram';

export async function sendTelegramNotification(text: string): Promise<void> {
  const config = readTelegramEnv();

  if (!config) {
    console.error('[qr] TG_BOT_TOKEN/TG_CHAT_ID (или TELEGRAM_*) не заданы на Vercel');
    return;
  }

  await sendTelegramMessage({ ...config, text });
}
