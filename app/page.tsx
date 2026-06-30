import Image from 'next/image';
import { OrderLinks } from '@/app/components/OrderLinks';
import { toGrabFoodDeepLink } from '@/lib/grab';
import logo from '../logo.png';

export const dynamic = 'force-dynamic';

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export default function HomePage() {
  const grabWebUrl = readEnv('REDIRECT_URL');
  const telegramUrl = readEnv('TELEGRAM_URL');
  const odooUrl = readEnv('ODOO_URL');

  if (!grabWebUrl || !telegramUrl || !odooUrl) {
    const missing = [
      !grabWebUrl && 'REDIRECT_URL',
      !telegramUrl && 'TELEGRAM_URL',
      !odooUrl && 'ODOO_URL',
    ].filter(Boolean);

    return (
      <main className="page">
        <p>Missing environment variables: {missing.join(', ')}</p>
      </main>
    );
  }

  const grabDeepLink = toGrabFoodDeepLink(grabWebUrl);

  return (
    <main className="page">
      <div className="card">
        <Image src={logo} alt="Logo" className="logo" priority />
        <div>
          <h1 className="heading">Order food with us</h1>
          <p className="text">
            Hungry? Choose your preferred platform below and place your order in just a few taps.
          </p>
        </div>
        <OrderLinks
          grabDeepLink={grabDeepLink}
          grabWebUrl={grabWebUrl}
          telegramUrl={telegramUrl}
          odooUrl={odooUrl}
        />
      </div>
    </main>
  );
}
