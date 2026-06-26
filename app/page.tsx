import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  buildTelegramMessage,
  extractGeo,
  parseDevice,
  sendTelegramNotification,
} from '@/lib/qr-scan';

export const dynamic = 'force-dynamic';

export default async function QrRedirectPage() {
  const redirectUrl = process.env.REDIRECT_URL;

  if (!redirectUrl) {
    throw new Error('REDIRECT_URL is not configured');
  }

  const headersList = await headers();
  const geo = extractGeo(headersList);
  const userAgent = headersList.get('user-agent') || '';
  const device = parseDevice(userAgent);

  const text = buildTelegramMessage({ geo, device, userAgent });
  sendTelegramNotification(text);

  redirect(redirectUrl);
}
