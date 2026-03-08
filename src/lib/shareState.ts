import type { ShareState } from '../types';

const toBase64 = (value: string): string => {
  const encoded = new TextEncoder().encode(value);
  let binary = '';

  for (const item of encoded) {
    binary += String.fromCharCode(item);
  }

  return btoa(binary);
};

const fromBase64 = (value: string): string => {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const toBase64Url = (value: string): string =>
  value
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const fromBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padLength = (4 - (normalized.length % 4)) % 4;
  return `${normalized}${'='.repeat(padLength)}`;
};

export const serializeShareState = (state: ShareState): string => {
  const payload = JSON.stringify(state);
  return toBase64Url(toBase64(payload));
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const deserializeShareState = (encoded: string): ShareState | null => {
  try {
    const decoded = fromBase64(fromBase64Url(encoded));
    const parsed = JSON.parse(decoded);

    if (!isObject(parsed)) {
      return null;
    }

    if (typeof parsed.scenarioId !== 'string' || !isObject(parsed.session)) {
      return null;
    }

    return parsed as unknown as ShareState;
  } catch {
    return null;
  }
};
