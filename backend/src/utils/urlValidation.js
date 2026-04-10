/**
 * Ensures string is a plausible HTTP(S) URL.
 */
export function isValidHttpUrl(string) {
  try {
    const u = new URL(string);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Allowed characters for custom short codes: alphanumeric, dash, underscore. */
const CUSTOM_CODE_REGEX = /^[a-zA-Z0-9_-]{3,32}$/;

export function isValidCustomCode(code) {
  if (code == null || code === '') return true; // optional
  return CUSTOM_CODE_REGEX.test(String(code));
}
