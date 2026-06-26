import https from 'node:https';
import { setDefaultResultOrder } from 'node:dns';

setDefaultResultOrder('ipv4first');

const TELEGRAM_HOST = 'api.telegram.org';

// Запасной IP Bot API, если основной (149.154.166.110) недоступен из сети.
const TELEGRAM_FALLBACK_IP = '149.154.167.220';

type TelegramResponse = {
  ok: boolean;
  description?: string;
};

function postJson(
  hostname: string,
  path: string,
  body: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        port: 443,
        path,
        method: 'POST',
        family: 4,
        servername: TELEGRAM_HOST,
        headers: {
          Host: TELEGRAM_HOST,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        timeout: 12_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode ?? 500,
            body: Buffer.concat(chunks).toString('utf8'),
          });
        });
      },
    );

    req.on('timeout', () => {
      req.destroy(new Error(`timeout: ${hostname}`));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function isNetworkError(err: unknown): boolean {
  if (!(err instanceof Error)) return true;
  const code = (err as NodeJS.ErrnoException).code;
  return (
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    code === 'ECONNREFUSED' ||
    code === 'EPROTO' ||
    err.message.startsWith('timeout:')
  );
}

async function tryEndpoint(
  hostname: string,
  path: string,
  body: string,
  label: string,
): Promise<TelegramResponse | 'network_error'> {
  try {
    const result = await postJson(hostname, path, body);
    let parsed: TelegramResponse;

    try {
      parsed = JSON.parse(result.body) as TelegramResponse;
    } catch {
      console.error('[qr] Telegram invalid JSON from', label, result.body.slice(0, 200));
      return 'network_error';
    }

    if (!parsed.ok) {
      console.error('[qr] Telegram API error via', label, parsed.description ?? result.body);
      return parsed;
    }

    return parsed;
  } catch (err) {
    if (isNetworkError(err)) {
      console.error('[qr] Telegram network error via', label, err);
      return 'network_error';
    }

    console.error('[qr] Telegram unexpected error via', label, err);
    return 'network_error';
  }
}

export async function sendTelegramMessage(params: {
  token: string;
  chatId: string;
  text: string;
}): Promise<boolean> {
  const { token, chatId, text } = params;
  const body = JSON.stringify({ chat_id: chatId, text });
  const path = `/bot${token}/sendMessage`;

  const customBase = process.env.TG_API_URL?.replace(/\/$/, '');
  if (customBase) {
    const customUrl = new URL(`${customBase}${path}`);
    const result = await tryEndpoint(customUrl.hostname, customUrl.pathname, body, 'proxy');
    return result !== 'network_error' && result.ok;
  }

  const endpoints: Array<{ host: string; label: string }> = [
    { host: TELEGRAM_HOST, label: 'domain' },
    { host: TELEGRAM_FALLBACK_IP, label: 'fallback-ip' },
  ];

  for (const endpoint of endpoints) {
    const result = await tryEndpoint(endpoint.host, path, body, endpoint.label);
    if (result === 'network_error') continue;
    return result.ok;
  }

  console.error('[qr] Telegram: all endpoints failed');
  return false;
}
