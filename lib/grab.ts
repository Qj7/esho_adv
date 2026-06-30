const MERCHANT_ID_RE = /^\d+-[A-Z0-9]+$/;

/** GrabFood merchant ID, e.g. `6-C62XAUJEAN2TC6`. */
export function extractGrabMerchantId(url: string): string | null {
  const trimmed = url.trim();

  if (trimmed.startsWith('grab://')) {
    const match = trimmed.match(/[?&]merchantIDs=([^&]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.hostname === 'food.grab.com') {
      const lastSegment = parsed.pathname.split('/').filter(Boolean).at(-1);
      if (lastSegment && MERCHANT_ID_RE.test(lastSegment)) {
        return lastSegment;
      }
    }

    if (parsed.hostname === 'r.grab.com') {
      const match = parsed.pathname.match(/(\d+-[A-Z0-9]+)$/);
      if (match?.[1] && MERCHANT_ID_RE.test(match[1])) {
        return match[1];
      }
    }

    if (parsed.hostname.endsWith('onelink.me')) {
      const campaignId = parsed.searchParams.get('c');
      if (campaignId && MERCHANT_ID_RE.test(campaignId)) {
        return campaignId;
      }

      const afDp = parsed.searchParams.get('af_dp');
      const merchantFromAfDp = afDp?.match(/[?&]merchantIDs=([^&]+)/)?.[1];
      if (merchantFromAfDp && MERCHANT_ID_RE.test(merchantFromAfDp)) {
        return merchantFromAfDp;
      }
    }
  } catch {
    // Not a valid URL — try a loose match below.
  }

  const looseMatch = trimmed.match(/(\d+-[A-Z0-9]+)(?:[/?#&]|$)/);
  if (looseMatch?.[1] && MERCHANT_ID_RE.test(looseMatch[1])) {
    return looseMatch[1];
  }

  return null;
}

function extractGrabSourceId(url: string): string | null {
  const trimmed = url.trim();

  if (trimmed.startsWith('grab://')) {
    const match = trimmed.match(/[?&]sourceID=([^&]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }

  try {
    const parsed = new URL(trimmed);
    const fromQuery = parsed.searchParams.get('sourceID');
    if (fromQuery) {
      return fromQuery;
    }

    if (parsed.hostname === 'r.grab.com' && parsed.pathname.startsWith('/g/')) {
      const body = parsed.pathname.slice('/g/'.length);
      const merchantId = extractGrabMerchantId(trimmed);
      if (!merchantId) {
        return null;
      }

      const merchantSuffix = `-${merchantId}`;
      const merchantIndex = body.lastIndexOf(merchantSuffix);
      if (merchantIndex <= 0) {
        return null;
      }

      const prefix = body.slice(0, merchantIndex);
      const dashIndex = prefix.indexOf('-');
      if (dashIndex < 0) {
        return null;
      }

      return prefix.slice(dashIndex + 1);
    }

    const afDp = parsed.searchParams.get('af_dp');
    const sourceFromAfDp = afDp?.match(/[?&]sourceID=([^&]+)/)?.[1];
    if (sourceFromAfDp) {
      return decodeURIComponent(sourceFromAfDp);
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Builds a Grab app deep link that opens a specific GrabFood merchant.
 *
 * Grab expects `grab://open?screenType=GRABFOOD&merchantIDs={id}` — not
 * `grab://food/r.grab.com/...`, which only lands on the app home screen.
 */
export function toGrabFoodDeepLink(webUrl: string): string {
  const trimmed = webUrl.trim();

  if (trimmed.startsWith('grab://open?')) {
    return trimmed;
  }

  const merchantId = extractGrabMerchantId(trimmed);
  if (merchantId) {
    const params = new URLSearchParams({
      screenType: 'GRABFOOD',
      merchantIDs: merchantId,
    });

    const sourceId = extractGrabSourceId(trimmed);
    if (sourceId) {
      params.set('sourceID', sourceId);
    }

    return `grab://open?${params.toString()}`;
  }

  if (trimmed.startsWith('https://')) {
    return `grab://food/${trimmed.slice('https://'.length)}`;
  }

  if (trimmed.startsWith('http://')) {
    return `grab://food/${trimmed.slice('http://'.length)}`;
  }

  return `grab://food/${trimmed}`;
}
