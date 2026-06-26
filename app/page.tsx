import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  buildTelegramMessage,
  extractGeo,
  parseDevice,
  sendTelegramNotification,
} from '@/lib/qr-scan';
import { extractIp, trackVisitor } from '@/lib/visitor';

export const dynamic = 'force-dynamic';
export const preferredRegion = ['sin1', 'iad1', 'fra1'];

export default async function QrRedirectPage() {
  const redirectUrl = process.env.REDIRECT_URL;

  if (!redirectUrl) {
    throw new Error('REDIRECT_URL is not configured');
  }

  const headersList = await headers();
  const geo = extractGeo(headersList);
  const ip = extractIp(headersList);
  const userAgent = headersList.get('user-agent') || '';
  const device = parseDevice(userAgent);
  const visitor = await trackVisitor();

  const text = buildTelegramMessage({ geo, device, userAgent, ip, visitor });
  await sendTelegramNotification(text);

  redirect(redirectUrl);
}
