function TelegramIcon() {
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9.78 15.28 9.5 19.5c.36 0 .52-.16.71-.35l1.7-1.63 3.53 2.58c.65.36 1.11.17 1.28-.6l2.32-10.9h.01c.21-.97-.35-1.35-.99-1.1L3.9 10.28c-.95.37-.93.9-.16 1.14l4.86 1.52 11.28-7.11c.53-.33 1.01-.15.61.18" />
    </svg>
  );
}

type TelegramButtonProps = {
  telegramUrl: string;
};

export function TelegramButton({ telegramUrl }: TelegramButtonProps) {
  return (
    <a
      className="btn btn-telegram"
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      <TelegramIcon />
      Message on Telegram
    </a>
  );
}
