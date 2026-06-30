import Image from 'next/image';

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
      aria-label="Join Esho on Telegram for promos"
    >
      <Image
        src="/telegram-button.png"
        alt=""
        width={876}
        height={184}
        className="btn-telegram-image"
      />
    </a>
  );
}
