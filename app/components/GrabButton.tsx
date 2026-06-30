'use client';

import Image from 'next/image';
import { useEffect } from 'react';

type GrabButtonProps = {
  grabDeepLink: string;
  grabWebUrl: string;
};

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
    <a
      className="btn btn-grab"
      href={grabDeepLink}
      onClick={openGrab}
      aria-label="Order on Grab"
    >
      <Image
        src="/image.png"
        alt=""
        width={876}
        height={184}
        className="btn-grab-image"
        priority
      />
    </a>
  );
}
