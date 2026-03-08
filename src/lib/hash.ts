export const normalizePlanText = (value: string): string =>
  value
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();

export const hashPlanText = (value: string): string => {
  const normalized = normalizePlanText(value);
  let hash = 0x811c9dc5;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = (hash * 0x01000193) >>> 0;
  }

  return hash.toString(16).padStart(8, '0');
};
