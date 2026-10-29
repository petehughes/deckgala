const callbackOrigin = "https://portal.deckgala.invalid";

export function safeCallbackPath(value: string | undefined): string {
  if (!value) return "/";
  try {
    const destination = new URL(value, callbackOrigin);
    if (destination.origin !== callbackOrigin) return "/";
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/";
  }
}
