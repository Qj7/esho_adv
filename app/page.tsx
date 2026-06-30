import Image from 'next/image';
import { GrabButton } from '@/app/components/GrabButton';
import { TelegramButton } from '@/app/components/TelegramButton';
import { toGrabFoodDeepLink } from '@/lib/grab';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const grabWebUrl = process.env.REDIRECT_URL?.trim();
  const telegramUrl = process.env.TELEGRAM_URL?.trim();

  if (!grabWebUrl) {
    return (
      <main className="page">
        <p>REDIRECT_URL is not configured</p>
      </main>
    );
  }

  const grabDeepLink = toGrabFoodDeepLink(grabWebUrl);

  return (
    <main className="page">
      <div className="brand">
        <Image src="/logo.png" alt="ESHO" className="logo" width={200} height={120} priority />
        <div className="card">
          <p className="brand-tagline">
            Slavic Food
            <br />
            with Slavic Soul
          </p>
          <p className="text">
            Order via Grab — for menu questions and reservations, message us on Telegram.
          </p>
          <div className="buttons">
            <GrabButton grabDeepLink={grabDeepLink} grabWebUrl={grabWebUrl} />
            {telegramUrl ? <TelegramButton telegramUrl={telegramUrl} /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
