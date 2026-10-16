import type { EmailBlock } from '../types';
import { parseHtmlToBlocks } from './htmlParser';
import { sanitizeEmailHtml } from './security';

export interface HtmlImportAnalysis {
  blocks: EmailBlock[];
  blockCount: number;
  sourceWordCount: number;
  retainedWordCount: number;
  textCoveragePercent: number | null;
  sourceImageCount: number;
  retainedImageCount: number;
  sourceLinkCount: number;
  retainedLinkCount: number;
  hasContentLoss: boolean;
}

const CONTENT_FIELDS: Array<keyof EmailBlock> = [
  'text', 'headerTitle', 'headerSubtitle', 'footerText', 'buttonLabel',
  'couponCode', 'couponDiscount', 'couponTitle', 'couponExpiry', 'imageAlt', 'imageCaption',
];

function getWords(value: string): string[] {
  return value.toLocaleLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
}

function countRetainedWords(sourceWords: string[], outputWords: string[]): number {
  const available = new Map<string, number>();
  sourceWords.forEach((word) => available.set(word, (available.get(word) || 0) + 1));
  let retained = 0;
  outputWords.forEach((word) => {
    const remaining = available.get(word) || 0;
    if (remaining > 0) {
      retained += 1;
      available.set(word, remaining - 1);
    }
  });
  return retained;
}

function appendHtmlValue(doc: Document, value: string, outputParts: string[], outputImages: string[], outputLinks: string[]) {
  const fragment = doc.createElement('div');
  if (/<\/?[a-z][^>]*>/i.test(value)) {
    fragment.innerHTML = value;
  } else {
    fragment.textContent = value;
  }
  outputParts.push(fragment.textContent || '');
  fragment.querySelectorAll('img[src]').forEach((image) => {
    const src = image.getAttribute('src')?.trim();
    if (src) outputImages.push(src);
  });
  fragment.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href')?.trim();
    if (href) outputLinks.push(href);
  });
}

function countMatchingOccurrences(source: string[], output: string[]): number {
  const available = new Map<string, number>();
  output.forEach((value) => available.set(value, (available.get(value) || 0) + 1));
  let matched = 0;
  source.forEach((value) => {
    const remaining = available.get(value) || 0;
    if (remaining > 0) {
      matched += 1;
      available.set(value, remaining - 1);
    }
  });
  return matched;
}

/**
 * Estimates how much visible text, image, and link content survives the conversion
 * into editable blocks. This intentionally measures content, not visual fidelity:
 * complex layout/styling can still be simplified during block conversion.
 */
export function analyzeHtmlConversion(html: string): HtmlImportAnalysis {
  const safeHtml = sanitizeEmailHtml(html);
  const blocks = parseHtmlToBlocks(safeHtml);
  const parser = new DOMParser();
  const sourceDoc = parser.parseFromString(safeHtml, 'text/html');
  const root = sourceDoc.querySelector('.card') || sourceDoc.body;

  root.querySelectorAll('script, style, noscript, template').forEach((node) => node.remove());
  const sourceWords = getWords(root.textContent || '');
  const sourceImages = Array.from(root.querySelectorAll('img[src]'))
    .map((image) => image.getAttribute('src')?.trim())
    .filter((src): src is string => Boolean(src));
  const sourceLinks = Array.from(root.querySelectorAll('a[href]'))
    .map((anchor) => anchor.getAttribute('href')?.trim())
    .filter((href): href is string => Boolean(href));

  const outputParts: string[] = [];
  const outputImages: string[] = [];
  const outputLinks: string[] = [];
  blocks.forEach((block) => {
    CONTENT_FIELDS.forEach((field) => {
      const value = block[field];
      if (typeof value === 'string' && value.trim()) {
        appendHtmlValue(sourceDoc, value, outputParts, outputImages, outputLinks);
      }
    });
    if (block.imageUrl?.trim()) outputImages.push(block.imageUrl.trim());
    if (block.imageLink?.trim()) outputLinks.push(block.imageLink.trim());
    if (block.buttonUrl?.trim()) outputLinks.push(block.buttonUrl.trim());
  });

  const outputWords = outputParts.flatMap(getWords);
  const retainedWordCount = countRetainedWords(sourceWords, outputWords);
  const textCoveragePercent = sourceWords.length
    ? Math.max(0, Math.min(100, Math.round((retainedWordCount / sourceWords.length) * 100)))
    : null;
  const retainedImageCount = countMatchingOccurrences(sourceImages, outputImages);
  const retainedLinkCount = countMatchingOccurrences(sourceLinks, outputLinks);
  const hasContentLoss =
    (textCoveragePercent !== null && textCoveragePercent < 100) ||
    retainedImageCount < sourceImages.length ||
    retainedLinkCount < sourceLinks.length;

  return {
    blocks,
    blockCount: blocks.length,
    sourceWordCount: sourceWords.length,
    retainedWordCount,
    textCoveragePercent,
    sourceImageCount: sourceImages.length,
    retainedImageCount,
    sourceLinkCount: sourceLinks.length,
    retainedLinkCount,
    hasContentLoss,
  };
}
