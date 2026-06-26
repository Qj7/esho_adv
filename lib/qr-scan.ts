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

export function buildTelegramMessage(params: {
  geo: ScanGeo;
  device: string;
  userAgent: string;
}): string {
  const { geo, device, userAgent } = params;

  return [
    '🔥 Скан QR-кода!',
    `📍 Город: ${geo.city}, ${geo.country}`,
    geo.region !== 'Unknown' ? `🗺 Регион: ${geo.region}` : null,
    `📱 Устройство: ${device}`,
    `🕐 Часовой пояс: ${geo.timezone}`,
    '',
    `🌐 UA: ${userAgent.slice(0, 120)}${userAgent.length > 120 ? '…' : ''}`,
  ]
    .filter(Boolean)
    .join('\n');
}

import { sendTelegramMessage } from '@/lib/telegram';

export async function sendTelegramNotification(text: string): Promise<void> {
  const token = process.env.TG_BOT_TOKEN;
  const chatId = process.env.TG_CHAT_ID;

  if (!token || !chatId) {
    console.error('[qr] TG_BOT_TOKEN или TG_CHAT_ID не заданы');
    return;
  }

  await sendTelegramMessage({ token, chatId, text });
}
