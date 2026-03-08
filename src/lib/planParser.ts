import { hashPlanText, normalizePlanText } from './hash';
import type { PreviewSpec } from '../types';

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'into',
  'have',
  'will',
  'mode',
  'plan',
  'build',
  'user',
  'users',
  'should',
  'could',
  'would',
  'after',
  'before',
  'when',
  'what',
  'where',
  'make',
  'show'
]);

const FALLBACK_SPEC: PreviewSpec = {
  productName: 'Plan Preview Product',
  pageTitle: 'Proposed Feature Screen',
  layoutSections: ['Hero Overview', 'Workspace Canvas', 'Action Rail'],
  coreComponents: ['Status Cards', 'Primary Editor', 'Decision Controls'],
  dataBlocks: ['Plan Snapshot', 'Progress Signals', 'Validation Checklist'],
  visualTone: 'Structured futuristic'
};

const sentenceCase = (value: string): string =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const deBullet = (line: string): string => line.replace(/^([-*]|\d+[.)])\s+/, '').trim();

const cleanPhrase = (value: string): string =>
  value
    .replace(/^[:\-\s]+/, '')
    .replace(/[.;,]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const uniqueOrdered = (items: string[]): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of items) {
    const normalized = item.toLowerCase();
    if (normalized.length < 3 || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    output.push(item);
  }

  return output;
};

const findTaggedValue = (lines: string[], tags: string[]): string | undefined => {
  for (const line of lines) {
    const match = line.match(/^([a-zA-Z ]+):\s*(.+)$/);
    if (!match) {
      continue;
    }

    const key = match[1].trim().toLowerCase();
    if (tags.includes(key)) {
      return cleanPhrase(match[2]);
    }
  }

  return undefined;
};

const extractKeywords = (text: string): string[] => {
  const tokens = text.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  return uniqueOrdered(tokens.filter((token) => !STOP_WORDS.has(token)));
};

const fallbackFromKeywords = (keywords: string[], suffix: string): string[] =>
  keywords.slice(0, 3).map((word) => `${sentenceCase(word)} ${suffix}`);

const deriveProductName = (lines: string[], normalizedText: string): string => {
  const tagged = findTaggedValue(lines, ['product', 'app', 'project', 'feature', 'goal']);
  if (tagged) {
    return sentenceCase(tagged.split(/\s+/).slice(0, 5).join(' '));
  }

  const heading = lines.find((line) => /^#{1,6}\s+/.test(line));
  if (heading) {
    return sentenceCase(cleanPhrase(heading.replace(/^#{1,6}\s+/, '')).split(/\s+/).slice(0, 5).join(' '));
  }

  const firstSentence = normalizedText.split(/[.!?]/)[0] ?? '';
  const words = extractKeywords(firstSentence).slice(0, 3);
  if (words.length > 0) {
    return sentenceCase(words.join(' ')) + ' Studio';
  }

  return FALLBACK_SPEC.productName;
};

const collectBulletItems = (lines: string[]): string[] =>
  lines
    .filter((line) => /^([-*]|\d+[.)])\s+/.test(line))
    .map((line) => cleanPhrase(deBullet(line)))
    .filter(Boolean);

const deriveLayoutSections = (lines: string[], bulletItems: string[], keywords: string[]): string[] => {
  const sectionHints = ['section', 'layout', 'screen', 'panel', 'view', 'page', 'column', 'hero', 'sidebar'];

  const raw = uniqueOrdered(
    [...bulletItems, ...lines]
      .filter((line) => sectionHints.some((hint) => line.toLowerCase().includes(hint)))
      .map((line) => sentenceCase(cleanPhrase(deBullet(line)).split(/\s+/).slice(0, 5).join(' ')))
      .filter(Boolean)
  );

  if (raw.length > 0) {
    return raw.slice(0, 4);
  }

  const keywordSections = fallbackFromKeywords(keywords, 'Section');
  if (keywordSections.length > 0) {
    return keywordSections;
  }

  return FALLBACK_SPEC.layoutSections;
};

const deriveCoreComponents = (lines: string[], bulletItems: string[], keywords: string[]): string[] => {
  const componentHints = [
    'form',
    'table',
    'chart',
    'card',
    'timeline',
    'chat',
    'panel',
    'button',
    'filter',
    'list',
    'editor',
    'modal',
    'feed'
  ];

  const raw = uniqueOrdered(
    [...bulletItems, ...lines]
      .filter((line) => componentHints.some((hint) => line.toLowerCase().includes(hint)))
      .map((line) => sentenceCase(cleanPhrase(deBullet(line)).split(/\s+/).slice(0, 5).join(' ')))
      .filter(Boolean)
  );

  if (raw.length > 0) {
    return raw.slice(0, 5);
  }

  const keywordComponents = fallbackFromKeywords(keywords, 'Module');
  if (keywordComponents.length > 0) {
    return keywordComponents;
  }

  return FALLBACK_SPEC.coreComponents;
};

const deriveDataBlocks = (lines: string[], bulletItems: string[], keywords: string[]): string[] => {
  const dataHints = ['metric', 'data', 'stats', 'kpi', 'events', 'history', 'summary', 'checklist', 'progress', 'signal'];

  const raw = uniqueOrdered(
    [...bulletItems, ...lines]
      .filter((line) => dataHints.some((hint) => line.toLowerCase().includes(hint)))
      .map((line) => sentenceCase(cleanPhrase(deBullet(line)).split(/\s+/).slice(0, 5).join(' ')))
      .filter(Boolean)
  );

  if (raw.length > 0) {
    return raw.slice(0, 4);
  }

  const keywordData = fallbackFromKeywords(keywords, 'Signal');
  if (keywordData.length > 0) {
    return keywordData;
  }

  return FALLBACK_SPEC.dataBlocks;
};

const deriveVisualTone = (normalizedText: string): string => {
  const value = normalizedText.toLowerCase();

  if (/(bold|vibrant|expressive|dramatic)/.test(value)) {
    return 'Bold contrast';
  }

  if (/(clean|minimal|calm|simple)/.test(value)) {
    return 'Clean editorial';
  }

  if (/(enterprise|professional|b2b|formal)/.test(value)) {
    return 'Professional dashboard';
  }

  return FALLBACK_SPEC.visualTone;
};

const derivePageTitle = (lines: string[], productName: string): string => {
  const tagged = findTaggedValue(lines, ['screen', 'page', 'view', 'title', 'ui']);
  if (tagged) {
    return sentenceCase(tagged.split(/\s+/).slice(0, 6).join(' '));
  }

  const namedLine = lines.find((line) => /(screen|page|dashboard|workspace|console)/i.test(line));
  if (namedLine) {
    return sentenceCase(cleanPhrase(deBullet(namedLine)).split(/\s+/).slice(0, 6).join(' '));
  }

  return `${productName} Workspace`;
};

export const parsePlanToPreviewSpec = (planText: string): PreviewSpec => {
  const normalizedText = normalizePlanText(planText);
  if (!normalizedText) {
    return FALLBACK_SPEC;
  }

  const lines = normalizedText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletItems = collectBulletItems(lines);
  const keywords = extractKeywords(normalizedText);
  const productName = deriveProductName(lines, normalizedText);

  return {
    productName,
    pageTitle: derivePageTitle(lines, productName),
    layoutSections: deriveLayoutSections(lines, bulletItems, keywords),
    coreComponents: deriveCoreComponents(lines, bulletItems, keywords),
    dataBlocks: deriveDataBlocks(lines, bulletItems, keywords),
    visualTone: deriveVisualTone(normalizedText)
  };
};

export const isPreviewStale = (planText: string, sourcePlanHash: string): boolean =>
  hashPlanText(planText) !== sourcePlanHash;
