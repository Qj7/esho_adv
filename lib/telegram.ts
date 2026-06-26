import https from 'node:https';
import { setDefaultResultOrder } from 'node:dns';

setDefaultResultOrder('ipv4first');

const TELEGRAM_HOST = 'api.telegram.org';
const TELEGRAM_FALLBACK_IP = '149.154.167.220';

type TelegramResponse = {
  ok: boolean;
  description?: string;
  result?: unknown;
};

type TelegramUpdate = {
  message?: { chat?: { id: number; title?: string; type?: string } };
  channel_post?: { chat?: { id: number; title?: string; type?: string } };
};

function requestTelegram(
  hostname: string,
  path: string,
  method: 'GET' | 'POST',
  body?: string,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        port: 443,
        path,
        method,
        family: 4,
        servername: TELEGRAM_HOST,
        headers: {
          Host: TELEGRAM_HOST,
          ...(body
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
              }
            : {}),
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
    if (body) req.write(body);
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

function parseResponse(body: string): TelegramResponse | null {
  try {
    return JSON.parse(body) as TelegramResponse;
  } catch {
    return null;
  }
}

async function callTelegram(
  hostname: string,
  path: string,
  method: 'GET' | 'POST',
  body?: string,
  label = 'domain',
): Promise<TelegramResponse | 'network_error'> {
  try {
    const result = await requestTelegram(hostname, path, method, body);
    const parsed = parseResponse(result.body);

    if (!parsed) {
      console.error('[qr] Telegram invalid JSON from', label, result.body.slice(0, 200));
      return 'network_error';
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

async function callTelegramApi(
  path: string,
  method: 'GET' | 'POST',
  body?: string,
): Promise<TelegramResponse | 'network_error'> {
  const customBase = process.env.TG_API_URL?.replace(/\/$/, '');
  if (customBase) {
    const customUrl = new URL(`${customBase}${path}`);
    return callTelegram(customUrl.hostname, customUrl.pathname + customUrl.search, method, body, 'proxy');
  }

  const endpoints: Array<{ host: string; label: string }> = [
    { host: TELEGRAM_HOST, label: 'domain' },
    { host: TELEGRAM_FALLBACK_IP, label: 'fallback-ip' },
  ];

  for (const endpoint of endpoints) {
    const result = await callTelegram(endpoint.host, path, method, body, endpoint.label);
    if (result !== 'network_error') return result;
  }

  return 'network_error';
}

export function readTelegramEnv(): { token: string; chatId: string } | null {
  const token = (process.env.TG_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '')
    .trim()
    .replace(/^["']|["']$/g, '');

  const chatId = normalizeChatId(
    (process.env.TG_CHAT_ID || process.env.TELEGRAM_CHAT_ID || '')
      .trim()
      .replace(/^["']|["']$/g, ''),
  );

  if (!token || !chatId) return null;
  return { token, chatId };
}

export function normalizeChatId(raw: string): string {
  const cleaned = raw.replace(/[\u200B-\u200D\uFEFF]/g, '');

  if (cleaned.startsWith('@')) return cleaned;

  const digitsOnly = cleaned.replace(/[^\d-]/g, '');

  // Уже полный ID супергруппы/канала
  if (/^-100\d{6,}$/.test(digitsOnly)) return digitsOnly;

  // Старый формат обычной группы: -123456789
  if (/^-\d{1,10}$/.test(digitsOnly) && !digitsOnly.startsWith('-100')) {
    return digitsOnly;
  }

  // Peer channel_id без префикса: 1234567890 -> -1001234567890
  if (/^\d{6,}$/.test(digitsOnly)) {
    return `-100${digitsOnly}`;
  }

  return digitsOnly;
}

function chatIdCandidates(chatId: string): string[] {
  const candidates = new Set<string>([chatId]);

  // Частая ошибка: к уже полному ID добавили -100
  if (chatId.startsWith('-100100')) {
    candidates.add(`-${chatId.slice(4)}`);
  }

  // Peer channel_id без префикса
  if (/^\d{6,}$/.test(chatId)) {
    candidates.add(`-100${chatId}`);
  }

  return [...candidates];
}

async function logKnownChats(token: string): Promise<void> {
  const result = await callTelegramApi(`/bot${token}/getUpdates?limit=100`, 'GET');

  if (result === 'network_error' || !result.ok || !Array.isArray(result.result)) {
    console.error(
      '[qr] Не удалось получить getUpdates. Напишите любое сообщение в группе после добавления бота.',
    );
    return;
  }

  const chats = new Map<number, string>();

  for (const update of result.result as TelegramUpdate[]) {
    const chat = update.message?.chat ?? update.channel_post?.chat;
    if (!chat) continue;

    const label = [chat.title, chat.type].filter(Boolean).join(' / ') || chat.type || 'chat';
    chats.set(chat.id, label);
  }

  if (chats.size === 0) {
    console.error(
      '[qr] getUpdates пуст. Напишите сообщение в группе (после добавления бота) и обновите TG_CHAT_ID.',
    );
    return;
  }

  const list = [...chats.entries()].map(([id, title]) => `${id} (${title})`).join(', ');
  console.error('[qr] Доступные chat_id для этого бота:', list);
}

export async function sendTelegramMessage(params: {
  token: string;
  chatId: string;
  text: string;
}): Promise<boolean> {
  const { token, text } = params;
  const candidates = chatIdCandidates(normalizeChatId(params.chatId));

  for (const chatId of candidates) {
    const body = JSON.stringify({ chat_id: chatId, text });
    const result = await callTelegramApi(`/bot${token}/sendMessage`, 'POST', body);

    if (result === 'network_error') {
      console.error('[qr] Telegram: network failed');
      return false;
    }

    if (result.ok) return true;

    const description = result.description ?? 'unknown error';
    const isChatNotFound = /chat not found/i.test(description);

    if (!isChatNotFound) {
      console.error('[qr] Telegram API error:', description, `(chat_id=${maskChatId(chatId)})`);
      return false;
    }

    console.error('[qr] Telegram chat not found for', maskChatId(chatId));
  }

  console.error(
    '[qr] Ни один chat_id не подошёл. Проверьте TG_CHAT_ID на Vercel.',
    `Пробовали: ${candidates.map(maskChatId).join(', ')}`,
  );
  await logKnownChats(token);
  return false;
}

function maskChatId(chatId: string): string {
  if (chatId.length <= 6) return chatId;
  return `${chatId.slice(0, 4)}…${chatId.slice(-4)}`;
}
