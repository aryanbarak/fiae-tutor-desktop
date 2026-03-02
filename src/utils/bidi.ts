export function isLikelyLTR(text: string): boolean {
  if (!text) return false;
  if (/[A-Za-z]/.test(text)) return true;
  return /[0-9].*[=<>+\-/*^():]/.test(text);
}

export function isMostlyLTR(text: string): boolean {
  if (!text) return false;
  const ltr = text.match(/[A-Za-z0-9_]/g)?.length ?? 0;
  const rtl = text.match(/[\u0600-\u06FF]/g)?.length ?? 0;
  if (ltr === 0 && rtl === 0) return false;
  return ltr >= rtl;
}
