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
        src="/image2.png"
        alt=""
        fill
        sizes="200px"
        className="btn-telegram-image"
      />
    </a>
  );
}
