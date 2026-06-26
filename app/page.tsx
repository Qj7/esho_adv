import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  buildTelegramMessage,
  extractGeo,
  parseDevice,
  readScanCookies,
  sendTelegramNotification,
  writeScanCookies,
} from '@/lib/qr-scan';

export const dynamic = 'force-dynamic';

export default async function QrRedirectPage() {
  const redirectUrl = process.env.REDIRECT_URL;

  if (!redirectUrl) {
    throw new Error('REDIRECT_URL is not configured');
  }

  const headersList = await headers();
  const cookieStore = await cookies();

  const geo = extractGeo(headersList);
  const userAgent = headersList.get('user-agent') || '';
  const device = parseDevice(userAgent);

  const existing = readScanCookies((name) => cookieStore.get(name));
  const updated = writeScanCookies(
    (name, value, options) => cookieStore.set(name, value, options),
    existing,
  );

  const lastScanAt = new Date().toISOString();

  const text = buildTelegramMessage({
    geo,
    device,
    userAgent,
    cookies: updated,
    lastScanAt,
  });

  sendTelegramNotification(text);

  redirect(redirectUrl);
}
