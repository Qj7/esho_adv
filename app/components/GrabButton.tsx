'use client';

import { useEffect } from 'react';

type GrabButtonProps = {
  grabDeepLink: string;
  grabWebUrl: string;
};

function GrabIcon() {
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
    </svg>
  );
}

export function GrabButton({ grabDeepLink, grabWebUrl }: GrabButtonProps) {
  useEffect(() => {
    fetch('/api/visit', { credentials: 'same-origin' }).catch(() => {});
  }, []);

  function openGrab(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    window.location.href = grabDeepLink;
    window.setTimeout(() => {
      window.location.href = grabWebUrl;
    }, 1500);
  }

  return (
    <a className="btn btn-grab" href={grabDeepLink} onClick={openGrab}>
      <GrabIcon />
      Заказать в Grab
    </a>
  );
}
