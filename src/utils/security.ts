/**
 * Central security helpers for user-controlled HTML, URLs and CSS values.
 *
 * The editor runs in a browser, so HTML sanitization uses the platform DOMParser
 * instead of a regex-based HTML parser. The same policy is reused by previews,
 * rich text and imported custom HTML.
 */

const BLOCKED_TAGS = new Set([
  'script', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'textarea',
  'select', 'option', 'button', 'base', 'link', 'stylelink'
]);

const ALLOWED_RICH_TEXT_TAGS = new Set([
  'a', 'b', 'strong', 'i', 'em', 'u', 's', 'strike', 'br', 'p', 'div', 'span',
  'blockquote', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
]);

const ALLOWED_EMAIL_TAGS = new Set([
  'html', 'head', 'body', 'title', 'meta', 'style', 'center', 'table', 'thead', 'tbody',
  'tfoot', 'tr', 'td', 'th', 'div', 'span', 'p', 'br', 'hr', 'h1', 'h2', 'h3',
  'h4', 'h5', 'h6', 'a', 'img', 'b', 'strong', 'i', 'em', 'u', 's', 'strike',
  'blockquote', 'ul', 'ol', 'li', 'small', 'sup', 'sub'
]);

const SAFE_URL_PROTOCOLS = /^(https?:|mailto:|tel:)/i;
const SAFE_IMAGE_PROTOCOLS = /^(https?:|data:image\/(?:png|jpeg|gif|webp);base64,)/i;
const DANGEROUS_CSS = /(expression\s*\(|behavior\s*:|-moz-binding\s*:|@import\b|url\s*\()/i;

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeCssValue(value: unknown, fallback = ''): string {
  const raw = String(value ?? '').trim();
  if (!raw || DANGEROUS_CSS.test(raw)) return fallback;
  return raw
    .replace(/[<>\\{};]/g, '')
    .replace(/\bjavascript\s*:/gi, '')
    .replace(/\bvbscript\s*:/gi, '');
}

export function sanitizeUrl(value: unknown, kind: 'href' | 'src' = 'href'): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';

  if (kind === 'src') {
    return SAFE_IMAGE_PROTOCOLS.test(raw) ? raw.replace(/["'<>]/g, '') : '';
  }

  return SAFE_URL_PROTOCOLS.test(raw) ? raw.replace(/["'<>]/g, '') : '';
}

function sanitizeStyleAttribute(value: string): string {
  if (DANGEROUS_CSS.test(value)) return '';
  return value
    .replace(/url\s*\(\s*(['"]?)\s*javascript:[^)]*\)/gi, '')
    .replace(/url\s*\(\s*(['"]?)\s*vbscript:[^)]*\)/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/behavior\s*:[^;]+;?/gi, '')
    .replace(/-moz-binding\s*:[^;]+;?/gi, '')
    .replace(/@import[^;]+;?/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

function sanitizeStyleElement(styleElement: Element): void {
  const css = styleElement.textContent || '';
  styleElement.textContent = css
    .replace(/@import[^;]+;?/gi, '')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/behavior\s*:[^;]+;?/gi, '')
    .replace(/-moz-binding\s*:[^;]+;?/gi, '')
    .replace(/url\s*\(\s*(['"]?)\s*(?:javascript:|vbscript:)[^)]*\)/gi, '');
}

function sanitizeElements(elements: Element[], allowedTags: Set<string>, allowStyle: boolean): void {

  for (const element of elements) {
    const tag = element.tagName.toLowerCase();

    if (BLOCKED_TAGS.has(tag) || (!allowStyle && tag === 'style')) {
      element.remove();
      continue;
    }

    if (!allowedTags.has(tag)) {
      const parent = element.parentNode;
      if (parent) {
        while (element.firstChild) parent.insertBefore(element.firstChild, element);
        parent.removeChild(element);
      }
      continue;
    }

    if (tag === 'style') {
      sanitizeStyleElement(element);
    }

    for (const attr of Array.from(element.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value;

      if (name.startsWith('on') || name === 'formaction' || name === 'action' || name === 'xlink:href') {
        element.removeAttribute(attr.name);
        continue;
      }

      if (name === 'href') {
        const safe = sanitizeUrl(value, 'href');
        if (safe) element.setAttribute('href', safe);
        else element.removeAttribute(attr.name);
        continue;
      }

      if (name === 'src') {
        const safe = sanitizeUrl(value, 'src');
        if (safe) element.setAttribute('src', safe);
        else element.removeAttribute(attr.name);
        continue;
      }

      if (name === 'style') {
        const safe = sanitizeStyleAttribute(value);
        if (safe) element.setAttribute('style', safe);
        else element.removeAttribute(attr.name);
        continue;
      }

      if (tag === 'meta') {
        const httpEquiv = (element.getAttribute('http-equiv') || '').toLowerCase();
        const metaName = (element.getAttribute('name') || '').toLowerCase();
        const allowed =
          name === 'charset' ||
          (name === 'name' && new Set(['viewport', 'format-detection']).has(metaName)) ||
          (name === 'http-equiv' && httpEquiv === 'x-ua-compatible') ||
          (name === 'content' && (metaName === 'viewport' || metaName === 'format-detection' || httpEquiv === 'x-ua-compatible'));
        if (!allowed) element.removeAttribute(attr.name);
        continue;
      }

      if (name === 'target' && tag === 'a' && value !== '_blank' && value !== '_self') {
        element.setAttribute('target', '_blank');
      }
    }

    if (tag === 'a' && element.getAttribute('target') === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer');
    }
  }
}

function sanitizeDocument(root: Document, allowedTags: Set<string>, allowStyle: boolean): void {
  sanitizeElements(Array.from(root.querySelectorAll('*')), allowedTags, allowStyle);
}

/** Sanitizes rich-text fragments while preserving formatting tags and inline styles. */
export function sanitizeRichText(html: unknown): string {
  const source = String(html ?? '');
  if (!source) return '';

  if (typeof DOMParser === 'undefined') {
    return escapeHtml(source);
  }

  const doc = new DOMParser().parseFromString(`<div>${source}</div>`, 'text/html');
  const container = doc.body.firstElementChild;
  if (!container) return escapeHtml(source);

  sanitizeElements(Array.from(container.querySelectorAll('*')), ALLOWED_RICH_TEXT_TAGS, false);
  return container.innerHTML;
}

/** Sanitizes full HTML intended for preview/import, including safe <style> blocks. */
export function sanitizeEmailHtml(html: unknown): string {
  const source = String(html ?? '');
  if (!source) return '';

  if (typeof DOMParser === 'undefined') {
    return escapeHtml(source);
  }

  const doc = new DOMParser().parseFromString(source, 'text/html');
  sanitizeDocument(doc, ALLOWED_EMAIL_TAGS, true);
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}

/** Returns true when a URL is suitable for an e-mail link. */
export function isSafeEmailUrl(value: unknown): boolean {
  return Boolean(sanitizeUrl(value, 'href'));
}
