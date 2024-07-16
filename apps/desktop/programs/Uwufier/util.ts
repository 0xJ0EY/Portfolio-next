export function capitalize(text: string): string {
  if (text.length === 0) { return ""; }
  if (text.length === 1) { return text.toUpperCase(); }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function isUpperCase(text: string): boolean {
  return text === text.toUpperCase();
}

export function isLowerCase(text: string): boolean {
  return text === text.toLowerCase();
}

export function isCapitalized(text: string): boolean {
  return text === capitalize(text);
}
