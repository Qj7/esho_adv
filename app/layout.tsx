import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirecting…',
  robots: 'noindex, nofollow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
