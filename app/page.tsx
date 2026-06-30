import Image from 'next/image';
import { GrabButton } from '@/app/components/GrabButton';
import { toGrabFoodDeepLink } from '@/lib/grab';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const grabWebUrl = process.env.REDIRECT_URL?.trim();

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
      <div className="card">
        <Image src="/logo.png" alt="Logo" className="logo" width={200} height={120} priority />
        <div>
          <h1 className="heading">Order food with us</h1>
          <p className="text">
            Hungry? Tap the button below to order on Grab — opens the app if you have it installed.
          </p>
        </div>
        <GrabButton grabDeepLink={grabDeepLink} grabWebUrl={grabWebUrl} />
      </div>
    </main>
  );
}
