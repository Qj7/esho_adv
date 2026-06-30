/** Wraps a Grab web URL as grab://food/… for opening the native app when installed. */
export function toGrabFoodDeepLink(webUrl: string): string {
  const trimmed = webUrl.trim();

  if (trimmed.startsWith('https://')) {
    return `grab://food/${trimmed.slice('https://'.length)}`;
  }

  if (trimmed.startsWith('http://')) {
    return `grab://food/${trimmed.slice('http://'.length)}`;
  }

  return `grab://food/${trimmed}`;
}
