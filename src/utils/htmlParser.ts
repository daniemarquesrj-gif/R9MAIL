import { EmailBlock } from '../screens/GeradorProScreen';
import { EmailData } from '../types';

/**
 * Converts inline CSS string and HTML attributes into a normalized key-value map.
 */
function parseStylesAndAttrs(node: Element): Record<string, string> {
  const styles: Record<string, string> = {};

  // 1. Read inline style attribute
  const styleString = node.getAttribute('style');
  if (styleString) {
    styleString.split(';').forEach((item) => {
      const parts = item.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const val = parts.slice(1).join(':').trim();
        styles[key] = val;
      }
    });
  }

  // Handle shorthand background property
  if (!styles['background-color'] && styles['background']) {
    const bgCol = parseColorFromStyle(styles['background']);
    if (bgCol) styles['background-color'] = bgCol;
  }

  // 2. Read legacy HTML presentation attributes as fallbacks
  if (!styles['text-align'] && node.getAttribute('align')) {
    styles['text-align'] = node.getAttribute('align')!.toLowerCase();
  }
  if (!styles['background-color'] && node.getAttribute('bgcolor')) {
    styles['background-color'] = node.getAttribute('bgcolor')!;
  }
  if (!styles['color'] && node.getAttribute('color')) {
    styles['color'] = node.getAttribute('color')!;
  }
  if (!styles['width'] && node.getAttribute('width')) {
    styles['width'] = node.getAttribute('width')!;
  }
  if (!styles['height'] && node.getAttribute('height')) {
    styles['height'] = node.getAttribute('height')!;
  }

  return styles;
}

/**
 * Extracts hex or rgb or named color from a CSS property value or string
 */
function parseColorFromStyle(val?: string): string | undefined {
  if (!val) return undefined;
  val = val.trim();
  if (val === 'transparent' || val === 'inherit' || val === 'initial' || val === 'none') return undefined;

  // Match hex color like #ffffff or #fff or #4f46e5
  const hexMatch = val.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
  if (hexMatch) return hexMatch[0];

  // Match rgb / rgba
  const rgbMatch = val.match(/rgba?\([^)]+\)/i);
  if (rgbMatch) return rgbMatch[0];

  // Match hsl
  const hslMatch = val.match(/hsl\([^)]+\)/i);
  if (hslMatch) return hslMatch[0];

  // Match named colors
  const namedColors = ['black', 'white', 'red', 'green', 'blue', 'yellow', 'purple', 'gray', 'grey', 'orange', 'navy'];
  const words = val.toLowerCase().split(/[\s,]+/);
  for (const w of words) {
    if (namedColors.includes(w)) return w;
  }

  return undefined;
}

/**
 * Walks up DOM hierarchy from node to rootContainer to find inherited background color
 */
function getInheritedBgColor(node: Element, rootContainer?: Element): string | undefined {
  let curr: Element | null = node;
  while (curr && curr !== document.documentElement) {
    const styles = parseStylesAndAttrs(curr);
    const bg = parseColor(styles['background-color'] || styles['background']);
    if (bg && bg !== 'transparent' && bg !== 'inherit' && bg !== 'none') {
      return bg;
    }
    if (rootContainer && curr === rootContainer) break;
    curr = curr.parentElement;
  }
  return undefined;
}

/**
 * Walks up DOM hierarchy to find inherited text color
 */
function getInheritedTextColor(node: Element, rootContainer?: Element): string | undefined {
  let curr: Element | null = node;
  while (curr && curr !== document.documentElement) {
    const styles = parseStylesAndAttrs(curr);
    const color = parseColor(styles['color']);
    if (color && color !== 'inherit' && color !== 'initial') {
      return color;
    }
    if (rootContainer && curr === rootContainer) break;
    curr = curr.parentElement;
  }
  return undefined;
}

/**
 * Inspects inner children (span, font, b, strong) for explicit text color overrides.
 * STRICTLY EXCLUDES <a> tags to prevent link colors from turning paragraph text blue!
 */
function getInnerTextColor(node: Element): string | undefined {
  // Check inline text formatting elements ONLY (excluding <a> tags)
  const inlineTags = Array.from(
    node.querySelectorAll('span[style*="color"], font[color], font[style*="color"], b[style*="color"], strong[style*="color"]')
  ).filter((el) => el.tagName.toLowerCase() !== 'a' && !el.closest('a'));

  for (const child of inlineTags) {
    const styles = parseStylesAndAttrs(child);
    const c = parseColor(styles['color']);
    if (c) return c;
  }

  // Check inner paragraph / headings if present
  const blockTags = Array.from(node.querySelectorAll('p[style*="color"], h1[style*="color"], h2[style*="color"], h3[style*="color"]'));
  for (const child of blockTags) {
    const styles = parseStylesAndAttrs(child);
    const c = parseColor(styles['color']);
    if (c) return c;
  }

  return undefined;
}

/**
 * Walks up DOM hierarchy to find inherited font family
 */
function getInheritedFontFamily(node: Element, rootContainer?: Element): string | undefined {
  let curr: Element | null = node;
  while (curr && curr !== document.documentElement) {
    const styles = parseStylesAndAttrs(curr);
    if (styles['font-family']) {
      return cleanFontFamily(styles['font-family']);
    }
    if (rootContainer && curr === rootContainer) break;
    curr = curr.parentElement;
  }
  return undefined;
}

/**
 * Cleans up font family string
 */
function cleanFontFamily(ff?: string): string | undefined {
  if (!ff) return undefined;
  const cleaned = ff.trim().replace(/^['"]|['"]$/g, '');
  if (!cleaned || cleaned.toLowerCase() === 'inherit' || cleaned.toLowerCase() === 'initial') {
    return undefined;
  }
  return cleaned;
}

/**
 * Extracts default font-family from document <style> tags if present
 */
function extractDefaultFontFamilyFromDoc(doc: Document): string | undefined {
  const styles = doc.querySelectorAll('style');
  for (const style of styles) {
    const content = style.textContent || '';
    const match = content.match(/font-family\s*:\s*([^;}]+)/i);
    if (match && match[1]) {
      const ff = cleanFontFamily(match[1]);
      if (ff && !ff.includes('FontAwesome') && !ff.includes('lucide') && !ff.includes('Material')) {
        return ff;
      }
    }
  }
  return undefined;
}

/**
 * Walks up DOM hierarchy to find inherited text alignment
 */
function getInheritedTextAlign(node: Element, rootContainer?: Element): 'left' | 'center' | 'right' | 'justify' | undefined {
  let curr: Element | null = node;
  while (curr && curr !== document.documentElement) {
    const styles = parseStylesAndAttrs(curr);
    const align = styles['text-align'];
    if (align && ['left', 'center', 'right', 'justify'].includes(align.toLowerCase())) {
      return align.toLowerCase() as any;
    }
    if (rootContainer && curr === rootContainer) break;
    curr = curr.parentElement;
  }
  return undefined;
}

/**
 * Helper to extract px integer from CSS font-size string
 */
function parsePxSize(val?: string, fallback = 16): number {
  if (!val) return fallback;
  const num = parseInt(val.replace(/px/i, '').trim(), 10);
  return isNaN(num) || num <= 0 ? fallback : num;
}

/**
 * Helper to clean color hex or rgb
 */
function parseColor(val?: string): string | undefined {
  return parseColorFromStyle(val);
}

/**
 * Checks if a color is dark (returns true if dark, false if light)
 */
function isDarkColor(colorStr?: string): boolean {
  if (!colorStr) return false;
  const c = colorStr.toLowerCase().trim();
  if (c === '#ffffff' || c === 'white' || c === '#fff') return false;
  if (c === '#000000' || c === 'black' || c === '#000') return true;

  if (c.startsWith('#')) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((x) => x + x).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      // Brightness formula
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 160;
    }
  }
  return true;
}

/**
 * Guarantees high text contrast for buttons
 */
function ensureButtonTextColor(bgColor?: string, textColor?: string): string {
  const bg = parseColor(bgColor) || '#4f46e5';
  const text = parseColor(textColor);

  if (text && text.toLowerCase() === bg.toLowerCase()) {
    return isDarkColor(bg) ? '#ffffff' : '#0f172a';
  }

  if (text) {
    const isBgDark = isDarkColor(bg);
    const isTextDark = isDarkColor(text);
    if (isBgDark === isTextDark) {
      return isBgDark ? '#ffffff' : '#0f172a';
    }
    return text;
  }

  return isDarkColor(bg) ? '#ffffff' : '#0f172a';
}

/**
 * Extracts text from an element while converting <br> tags into newlines.
 */
function getTextWithLineBreaks(node: Element): string {
  const clone = node.cloneNode(true) as Element;

  // Replace all <br> with \n
  clone.querySelectorAll('br').forEach((br) => {
    br.replaceWith('\n');
  });

  const rawText = clone.textContent || '';
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && idx < arr.length - 1))
    .join('\n')
    .trim();
}

/**
 * Helper to check if a single tag (or group of tags) wraps 100% of the visible text in a node.
 */
function isTagWrappingEntireContent(node: Element, tagNames: string[]): boolean {
  const fullText = (node.textContent || '').trim();
  if (!fullText) return false;

  const selector = tagNames.join(', ');
  const matchingChildren = Array.from(node.querySelectorAll(selector));

  for (const child of matchingChildren) {
    if ((child.textContent || '').trim() === fullText) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts clean inline HTML from an element while preserving safe formatting tags:
 * <b>, <strong>, <i>, <em>, <u>, <s>, <strike>, <del>, <a href="...">, <span style="color: ...">, <font color="...">, <sub>, <sup>, <mark>, <br>.
 */
function extractCleanInlineHtml(
  node: Element,
  options?: { unwrapEntireBold?: boolean; unwrapEntireItalic?: boolean; unwrapEntireUnderline?: boolean }
): string {
  const clone = node.cloneNode(true) as Element;

  // Convert <br> tags to \n before cleaning
  clone.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));

  // If top-level bold/italic/underline is already handled at the block container level, unwrap top-level wrapper tags
  if (options?.unwrapEntireBold) {
    const fullText = (clone.textContent || '').trim();
    Array.from(clone.querySelectorAll('b, strong')).forEach((el) => {
      if ((el.textContent || '').trim() === fullText) unwrapElement(el);
    });
  }

  if (options?.unwrapEntireItalic) {
    const fullText = (clone.textContent || '').trim();
    Array.from(clone.querySelectorAll('i, em')).forEach((el) => {
      if ((el.textContent || '').trim() === fullText) unwrapElement(el);
    });
  }

  if (options?.unwrapEntireUnderline) {
    const fullText = (clone.textContent || '').trim();
    Array.from(clone.querySelectorAll('u')).forEach((el) => {
      if ((el.textContent || '').trim() === fullText) unwrapElement(el);
    });
  }

  // Clean element hierarchy
  cleanElementChildren(clone);

  let rawHtml = clone.innerHTML.trim();

  // If rawHtml contains inline HTML tags, replace newlines with <br/> for rich editor compatibility
  if (/<[a-z][\s\S]*>/i.test(rawHtml)) {
    rawHtml = rawHtml.replace(/\r?\n/g, '<br/>');
  }

  return rawHtml;
}

function cleanElementChildren(parent: Element) {
  const children = Array.from(parent.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tagName = el.tagName.toLowerCase();

      // Recurse first
      cleanElementChildren(el);

      if (tagName === 'a') {
        const href = el.getAttribute('href') || '#';
        el.setAttribute('href', href);
        el.setAttribute('target', '_blank');
        // Clean non-essential attributes
        Array.from(el.attributes).forEach((attr) => {
          if (!['href', 'target', 'style', 'title', 'class'].includes(attr.name.toLowerCase())) {
            el.removeAttribute(attr.name);
          }
        });
      } else if (tagName === 'span') {
        const style = el.getAttribute('style') || '';
        const color = parseColorFromStyle(style);
        const bg = parseColorFromStyle(style);
        const isBoldSpan = style.includes('font-weight: bold') || style.includes('font-weight: 700') || style.includes('font-weight:600');
        const isItalicSpan = style.includes('font-style: italic') || style.includes('font-style:italic');

        const styleParts: string[] = [];
        if (color) styleParts.push(`color: ${color}`);
        if (bg) styleParts.push(`background-color: ${bg}`);

        if (styleParts.length > 0) {
          el.setAttribute('style', styleParts.join('; ') + ';');
        } else if (isBoldSpan) {
          const b = document.createElement('b');
          b.innerHTML = el.innerHTML;
          el.replaceWith(b);
        } else if (isItalicSpan) {
          const i = document.createElement('i');
          i.innerHTML = el.innerHTML;
          el.replaceWith(i);
        } else {
          unwrapElement(el);
        }
      } else if (tagName === 'font') {
        const color = el.getAttribute('color') || parseColorFromStyle(el.getAttribute('style') || '');
        if (color) {
          const span = document.createElement('span');
          span.setAttribute('style', `color: ${color};`);
          span.innerHTML = el.innerHTML;
          el.replaceWith(span);
        } else {
          unwrapElement(el);
        }
      } else if (['b', 'strong', 'i', 'em', 'u', 's', 'strike', 'del', 'sub', 'sup', 'mark'].includes(tagName)) {
        // Safe inline formatting tag: strip extraneous attributes
        Array.from(el.attributes).forEach((attr) => el.removeAttribute(attr.name));
      } else {
        // Unrecognized structural container (p, div, table, etc. nested inside text block)
        unwrapElement(el);
      }
    }
  }
}

function unwrapElement(el: Element) {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) {
    parent.insertBefore(el.firstChild, el);
  }
  parent.removeChild(el);
}

/**
 * Extracts text from an element while preserving <a>, <b>, <span>, <font>, and formatting tags if present.
 */
function getTextWithFormattedHtml(node: Element): string {
  return extractCleanInlineHtml(node);
}

/**
 * Checks if a node is a standalone button element (<a> or <button> or button wrapper)
 * Crucial: Regular text links inside paragraphs are NOT standalone buttons!
 */
function isButtonElement(node: Element, styles: Record<string, string>): boolean {
  const tagName = node.tagName.toLowerCase();
  const classList = (node.className || '').toString().toLowerCase();

  // If node contains an image and no text, it's an image link, not a text button
  if (node.querySelector('img') && (!node.textContent || node.textContent.trim().length === 0)) {
    return false;
  }

  if (tagName === 'button') return true;

  if (tagName === 'a') {
    // Exclude social links from button classification
    const href = (node.getAttribute('href') || '').toLowerCase();
    if (href.includes('instagram') || href.includes('linkedin') || href.includes('facebook') || href.includes('twitter') || href.includes('youtube') || href.includes('wa.me')) {
      return false;
    }

    // Check if class explicitly suggests a button
    if (classList.includes('btn') || classList.includes('button') || classList.includes('cta') || classList.includes('action')) return true;

    // Check if anchor has explicit background color (not transparent/none)
    const bgColor = styles['background-color'] || styles['background'];
    if (bgColor && bgColor !== 'transparent' && bgColor !== 'inherit' && bgColor !== 'none') {
      // Check that it is a short CTA text, not a long paragraph inside an anchor
      const label = (node.textContent || '').trim();
      if (label.length > 0 && label.length < 80) {
        return true;
      }
    }

    // Check if anchor has padding/border-radius with block or inline-block display
    if (styles['padding'] || styles['border-radius']) {
      if (styles['display'] === 'block' || styles['display'] === 'inline-block') {
        const label = (node.textContent || '').trim();
        if (label.length > 0 && label.length < 80) {
          return true;
        }
      }
    }

    const parent = node.parentElement;
    if (parent) {
      const parentClass = (parent.className || '').toString().toLowerCase();
      if (parentClass.includes('btn') || parentClass.includes('button') || parentClass.includes('cta')) {
        return true;
      }
    }
  }

  // Check if node is a wrapper (div, td, table) explicitly meant as a button container
  if (['div', 'td', 'table'].includes(tagName)) {
    const hasChildAnchor = node.querySelector('a, button');
    if (hasChildAnchor) {
      const label = (hasChildAnchor.textContent || '').trim();
      if (label.length > 0 && label.length < 80) {
        if (classList.includes('btn') || classList.includes('button') || classList.includes('cta')) {
          return true;
        }
        const bgColor = styles['background-color'] || styles['background'];
        if (bgColor && bgColor !== 'transparent' && bgColor !== 'inherit' && bgColor !== 'none' && (styles['padding'] || styles['border-radius'])) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Checks if a node is a title element
 */
function isTitleElement(node: Element, styles: Record<string, string>): boolean {
  const tagName = node.tagName.toLowerCase();
  const classList = (node.className || '').toString().toLowerCase();

  if (tagName === 'h1' || tagName === 'h2') return true;
  if (classList.includes('title') || classList.includes('heading') || classList.includes('titulo')) return true;

  const fontSize = parsePxSize(styles['font-size'], 0);
  if (fontSize >= 22) return true;

  const isBold = styles['font-weight'] === 'bold' || parseInt(styles['font-weight'] || '400', 10) >= 600 || tagName === 'strong' || tagName === 'b';
  const text = node.textContent?.trim() || '';

  if (fontSize >= 18 && isBold && text.length > 0 && text.length < 140) {
    return true;
  }

  return false;
}

/**
 * Checks if a node is a subtitle element
 */
function isSubtitleElement(node: Element, styles: Record<string, string>): boolean {
  const tagName = node.tagName.toLowerCase();
  const classList = (node.className || '').toString().toLowerCase();

  if (tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') return true;
  if (classList.includes('subtitle') || classList.includes('subtitulo')) return true;

  const fontSize = parsePxSize(styles['font-size'], 0);
  if (fontSize >= 17 && fontSize <= 21) return true;

  return false;
}

/**
 * Checks if a node is a header / header_text banner element
 */
function isHeaderElement(node: Element, styles: Record<string, string>): boolean {
  const tagName = node.tagName.toLowerCase();
  const classList = (node.className || '').toString().toLowerCase();

  if (tagName === 'header') return true;
  if (classList.includes('header') || classList.includes('banner') || classList.includes('cabecalho') || classList.includes('topo')) return true;

  // Has prominent background color AND contains h1 or main heading or large font
  if (styles['background-color'] && (node.querySelector('h1, h2') || parsePxSize(styles['font-size'], 0) >= 24)) {
    return true;
  }

  return false;
}

/**
 * Checks if a node is a footer element
 */
function isFooterElement(node: Element, styles: Record<string, string>): boolean {
  const tagName = node.tagName.toLowerCase();
  const classList = (node.className || '').toString().toLowerCase();

  if (tagName === 'footer') return true;
  if (classList.includes('footer') || classList.includes('rodape') || classList.includes('rodapé')) return true;

  const text = (node.textContent || '').toLowerCase();
  if (
    text.includes('©') ||
    text.includes('todos os direitos reservados') ||
    text.includes('descadastrar') ||
    text.includes('cancelar inscrição') ||
    text.includes('enviado por') ||
    text.includes('política de privacidade')
  ) {
    if (text.length < 350) return true;
  }

  return false;
}

/**
 * Checks if a node is a coupon element
 */
function isCouponElement(node: Element, styles: Record<string, string>): boolean {
  const classList = (node.className || '').toString().toLowerCase();
  if (classList.includes('coupon') || classList.includes('cupom') || classList.includes('voucher')) return true;

  const border = styles['border'] || styles['border-style'] || styles['border-top-style'] || '';
  if (border.includes('dashed') || border.includes('dotted')) return true;

  return false;
}

/**
 * Checks if a node is a divider element
 */
function isDividerElement(node: Element, styles: Record<string, string>): boolean {
  const tagName = node.tagName.toLowerCase();
  if (tagName === 'hr') return true;

  const height = parsePxSize(styles['height'], 999);
  if (height <= 4 && (styles['border-top'] || styles['background-color'] || styles['border'])) {
    return true;
  }

  return false;
}

const BLOCK_TAGS = new Set([
  'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
  'table', 'tr', 'td', 'tbody', 'thead', 'ul', 'ol', 'li', 
  'header', 'footer', 'section', 'article', 'hr', 'form', 'blockquote'
]);

/**
 * Checks if a node is or contains a social media block
 */
function isSocialElement(node: Element, _styles?: Record<string, string>): boolean {
  const classList = (node.className || '').toString().toLowerCase();
  const id = (node.id || '').toString().toLowerCase();
  if (classList.includes('social') || id.includes('social') || classList.includes('redes')) return true;

  const anchors = Array.from(node.querySelectorAll('a'));
  if (anchors.length === 0) return false;

  const socialKeywords = [
    'instagram', 'linkedin', 'facebook', 'twitter', 'x.com', 
    'youtube', 'whatsapp', 'wa.me', 'tiktok', 'pinterest', 'website', 'redes'
  ];

  let socialMatchCount = 0;
  for (const a of anchors) {
    const href = (a.getAttribute('href') || '').toLowerCase();
    const text = (a.textContent || '').toLowerCase().trim();

    const isMatch = socialKeywords.some((kw) => href.includes(kw) || text.includes(kw));
    if (isMatch) {
      socialMatchCount++;
    }
  }

  const fullText = (node.textContent || '').trim();

  if (socialMatchCount >= 1) {
    if (fullText.length < 250 || anchors.length >= 2 || classList.includes('social')) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts social platform URLs from a social block node
 */
function parseSocialData(node: Element) {
  const anchors = Array.from(node.querySelectorAll('a'));
  let instagramUrl: string | undefined;
  let linkedinUrl: string | undefined;
  let facebookUrl: string | undefined;
  let websiteUrl: string | undefined;

  anchors.forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (!href || href === '#') return;
    const hrefLower = href.toLowerCase();
    const textLower = (a.textContent || '').toLowerCase().trim();

    if (hrefLower.includes('instagram') || textLower.includes('instagram')) {
      instagramUrl = href;
    } else if (hrefLower.includes('linkedin') || textLower.includes('linkedin')) {
      linkedinUrl = href;
    } else if (hrefLower.includes('facebook') || textLower.includes('facebook')) {
      facebookUrl = href;
    } else if (hrefLower.includes('twitter') || hrefLower.includes('x.com') || textLower.includes('twitter')) {
      if (!websiteUrl) websiteUrl = href;
    } else {
      if (!websiteUrl) websiteUrl = href;
    }
  });

  return { instagramUrl, linkedinUrl, facebookUrl, websiteUrl };
}

/**
 * Checks if a node contains structural block children or buttons/images/social
 */
function hasBlockChildren(node: Element, styles: Record<string, string>): boolean {
  if (node.querySelector('img')) return true;
  if (node.querySelector('hr')) return true;
  if (isSocialElement(node, styles)) return true;

  // Check if node contains a standalone CTA button
  const anchors = Array.from(node.querySelectorAll('a, button'));
  for (const a of anchors) {
    const aStyles = parseStylesAndAttrs(a);
    if (isButtonElement(a, aStyles)) return true;
  }

  // Check element children for block tags
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const tag = child.tagName.toLowerCase();
    if (BLOCK_TAGS.has(tag)) return true;
  }

  return false;
}

/**
 * Parses coupon details (discount, code, bg color, border color)
 */
function parseCouponData(node: Element, styles: Record<string, string>) {
  const fullText = getTextWithLineBreaks(node);
  const lines = fullText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  let discount = 'OFERTA ESPECIAL';
  let code = 'DESCONTO20';

  if (lines.length === 1) {
    if (lines[0].length < 15 && !lines[0].includes(' ') && !lines[0].includes('%')) {
      code = lines[0];
    } else {
      discount = lines[0];
    }
  } else if (lines.length >= 2) {
    const codeIndex = lines.findIndex(
      (l) => (l.length <= 16 && !l.includes(' ') && /[A-Z0-9]/i.test(l)) || l.toLowerCase().startsWith('cupom') || l.toLowerCase().startsWith('código')
    );

    if (codeIndex !== -1) {
      code = lines[codeIndex].replace(/cupom:?/i, '').replace(/código:?/i, '').trim();
      const discountLines = lines.filter((_, idx) => idx !== codeIndex);
      if (discountLines.length > 0) {
        discount = discountLines.join(' ');
      }
    } else {
      discount = lines[0];
      code = lines[1];
    }
  }

  // Extract border color
  let borderColor = parseColorFromStyle(styles['border']) || parseColorFromStyle(styles['border-color']) || parseColorFromStyle(styles['border-top']) || parseColor(styles['border-color']);

  // Extract bg color
  let bgColor = parseColorFromStyle(styles['background']) || parseColor(styles['background-color']);

  if (!borderColor) {
    borderColor = '#5b42f3'; // elegant blue/purple border fallback
  }
  if (!bgColor) {
    bgColor = '#e0e7ff'; // light blue/purple bg fallback
  }

  return { discount, code, bgColor, borderColor };
}

/**
 * Parses an HTML string into structured EmailData fields for Gerador Visual
 */
export function parseHtmlToEmailData(html: string, _currentData: EmailData): Partial<EmailData> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const result: Partial<EmailData> = {
    customCodeHtml: html,
  };

  // 1. Find Header Title
  const h1 = doc.querySelector('h1, h2, header, .header, .banner');
  if (h1) {
    const text = getTextWithLineBreaks(h1);
    if (text) result.headerTitle = text;
    const styles = parseStylesAndAttrs(h1);
    if (styles['color']) result.primaryColor = parseColor(styles['color']);
    if (styles['background-color']) result.primaryColor = parseColor(styles['background-color']);
  }

  // 2. Find Buttons / CTA
  const buttons = doc.querySelectorAll('a.btn, a.button, a[style*="background"], button, a[href^="http"]');
  let mainButton: HTMLAnchorElement | null = null;

  buttons.forEach((btn) => {
    if (btn.tagName.toLowerCase() === 'a') {
      const anchor = btn as HTMLAnchorElement;
      const text = anchor.textContent?.trim();
      if (text && text.length > 0 && !mainButton) {
        mainButton = anchor;
      }
    }
  });

  if (mainButton) {
    result.buttonText = (mainButton as HTMLAnchorElement).textContent?.trim() || 'Clique Aqui';
    result.buttonUrl = (mainButton as HTMLAnchorElement).getAttribute('href') || '#';
    const btnStyle = parseStylesAndAttrs(mainButton as HTMLAnchorElement);
    if (btnStyle['background-color']) {
      result.primaryColor = parseColor(btnStyle['background-color']);
    }
  }

  // 3. Find Paragraphs / Body Text
  const paragraphs = Array.from(doc.querySelectorAll('p, div, td')).filter((el) => {
    const childTags = Array.from(el.children).map((c) => c.tagName.toLowerCase());
    return !childTags.includes('h1') && !childTags.includes('h2') && !childTags.includes('table') && el.textContent && el.textContent.trim().length > 3;
  });

  const bodyTexts: string[] = [];
  let greetingFound = false;
  let footerFound = false;

  paragraphs.forEach((p) => {
    const text = getTextWithLineBreaks(p);
    if (!text) return;

    if (!greetingFound && (text.toLowerCase().startsWith('olá') || text.toLowerCase().startsWith('oi') || text.includes('{{nome}}'))) {
      result.greeting = text;
      greetingFound = true;
      return;
    }

    if (
      !footerFound &&
      (text.toLowerCase().includes('©') ||
        text.toLowerCase().includes('direitos reservados') ||
        text.toLowerCase().includes('enviado para') ||
        text.toLowerCase().includes('descadastrar'))
    ) {
      result.footerText = text;
      footerFound = true;
      return;
    }

    bodyTexts.push(text);
  });

  if (bodyTexts.length > 0) {
    result.bodyText = bodyTexts.join('\n\n');
  }

  return result;
}

/**
 * Parses an imported HTML string into an array of EmailBlock objects for Gerador PRO
 */
export function parseHtmlToBlocks(html: string): EmailBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const blocks: EmailBlock[] = [];
  let blockCounter = 1;

  const createId = () => `block-${Date.now()}-${blockCounter++}`;

  // Find primary email container or body
  const rootContainer = doc.querySelector('.card') || doc.querySelector('table') || doc.body;

  const defaultDocFontFamily = extractDefaultFontFamilyFromDoc(doc) || 'Helvetica, Arial, sans-serif';

  // Set of visited nodes to avoid duplicate block generation
  const visitedNodes = new Set<Element>();

  const markAllVisited = (el: Element) => {
    visitedNodes.add(el);
    el.querySelectorAll('*').forEach((child) => visitedNodes.add(child));
  };

  const processNode = (node: Element) => {
    if (!node || visitedNodes.has(node)) return;

    const tagName = node.tagName.toLowerCase();

    // Ignore script, style, head, meta tags
    if (['script', 'style', 'head', 'meta', 'link', 'title', 'noscript'].includes(tagName)) {
      return;
    }

    const styles = parseStylesAndAttrs(node);

    const fontSizePx = parsePxSize(styles['font-size']);
    // 1. Direct color on current node
    // 2. Inner formatting text color (e.g. span style="color: #fff") -> EXCLUDES <a> tags!
    // 3. Inherited color from parent DOM hierarchy
    const textColor = parseColor(styles['color']) || getInnerTextColor(node) || getInheritedTextColor(node, rootContainer) || '#334155';
    const bgColor = parseColor(styles['background-color'] || styles['background']) || getInheritedBgColor(node, rootContainer);
    const alignment = (styles['text-align'] as any) || getInheritedTextAlign(node, rootContainer) || 'left';

    // Strict bold/italic checks: Only set block-level isBold/isItalic if the container itself has bold/italic style OR if 100% of text is wrapped by bold/italic tag
    const isContainerBold = styles['font-weight'] === 'bold' || parseInt(styles['font-weight'] || '400', 10) >= 600 || tagName === 'b' || tagName === 'strong' || tagName === 'h1' || tagName === 'h2';
    const isEntirelyBold = isTagWrappingEntireContent(node, ['b', 'strong']);
    const isBold = isContainerBold || isEntirelyBold;

    const isContainerItalic = styles['font-style'] === 'italic' || tagName === 'i' || tagName === 'em';
    const isEntirelyItalic = isTagWrappingEntireContent(node, ['i', 'em']);
    const isItalic = isContainerItalic || isEntirelyItalic;

    const fontFamily = styles['font-family'] ? cleanFontFamily(styles['font-family']) : (getInheritedFontFamily(node, rootContainer) || defaultDocFontFamily);
    const lineHeight = styles['line-height'];

    // 1. HEADER IMAGE BANNER
    const isHeaderImgNode = 
      (node.className || '').toString().includes('header-img') || 
      (node.className || '').toString().includes('email-header-img') ||
      node.querySelector('img.email-header-img') !== null ||
      (isHeaderElement(node, styles) && node.querySelector('img') !== null && !node.querySelector('h1, h2, h3'));

    if (isHeaderImgNode) {
      const img = node.tagName.toLowerCase() === 'img' ? (node as HTMLImageElement) : node.querySelector('img');
      if (img) {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || 'Cabeçalho do E-mail';
        const parentAnchor = img.closest('a');
        const caption = img.nextElementSibling?.tagName.toLowerCase() === 'p' ? getTextWithLineBreaks(img.nextElementSibling) : undefined;

        if (src) {
          blocks.push({
            id: createId(),
            type: 'header_image',
            imageUrl: src,
            imageAlt: alt,
            imageLink: parentAnchor?.getAttribute('href') || undefined,
            imageCaption: caption,
            bgColor: bgColor,
          });
          markAllVisited(node);
          return;
        }
      }
    }

    // 2. HEADER TEXT / TEXT BANNER
    if (isHeaderElement(node, styles)) {
      const h1 = node.querySelector('h1, h2, .title, .heading') || node;
      const subtitleEl = node.querySelector('p, h3, h4, .subtitle');

      const titleText = extractCleanInlineHtml(h1, { unwrapEntireBold: true }) || 'CABEÇALHO IMPORTADO';
      const subtitleText = subtitleEl ? extractCleanInlineHtml(subtitleEl) : undefined;

      const headerStyles = parseStylesAndAttrs(h1);
      const headerBg = bgColor || parseColor(styles['background-color']) || '#003bb3';
      const headerTextColor = parseColor(headerStyles['color']) || (textColor !== '#334155' ? textColor : undefined) || '#ffffff';

      blocks.push({
        id: createId(),
        type: 'header_text',
        headerTitle: titleText,
        headerSubtitle: subtitleText,
        headerBgColor: headerBg,
        headerTextColor: headerTextColor,
        headerSubtitleColor: subtitleEl ? parseColor(parseStylesAndAttrs(subtitleEl)['color']) || '#ffffff' : '#ffffff',
        alignment: (styles['text-align'] as any) || 'center',
        fontSizePx: parsePxSize(headerStyles['font-size'], 28),
        headerSubtitleSizePx: subtitleEl ? parsePxSize(parseStylesAndAttrs(subtitleEl)['font-size'], 16) : 16,
        isBold: true,
      });
      markAllVisited(node);
      return;
    }

    // 2. FOOTER
    if (isFooterElement(node, styles)) {
      const footerText = extractCleanInlineHtml(node);
      blocks.push({
        id: createId(),
        type: 'footer',
        footerText: footerText || '© 2026 Minha Empresa. Todos os direitos reservados.',
        footerBgColor: bgColor || '#f8fafc',
        footerTextColor: parseColor(styles['color']) || (textColor !== '#334155' ? textColor : undefined) || '#64748b',
        fontSizePx: fontSizePx || 12,
        alignment: (alignment as any) || 'center',
      });
      markAllVisited(node);
      return;
    }

    // 3. COUPON
    if (isCouponElement(node, styles)) {
      const { discount, code, bgColor: cBg, borderColor: cBorder } = parseCouponData(node, styles);

      blocks.push({
        id: createId(),
        type: 'coupon',
        couponDiscount: discount,
        couponCode: code,
        couponBgColor: cBg,
        couponBorderColor: cBorder,
      });
      markAllVisited(node);
      return;
    }

    // 4. DIVIDER
    if (isDividerElement(node, styles)) {
      const borderColor = parseColorFromStyle(styles['border-top']) || parseColorFromStyle(styles['border']) || parseColor(styles['border-color']) || '#e2e8f0';
      const borderStyle = styles['border-top-style'] || styles['border-style'] || 'solid';

      blocks.push({
        id: createId(),
        type: 'divider',
        dividerStyle: (borderStyle.includes('dash') ? 'dashed' : borderStyle.includes('dot') ? 'dotted' : 'solid') as any,
        dividerColor: borderColor,
      });
      markAllVisited(node);
      return;
    }

    // 5. SOCIAL LINKS
    if (isSocialElement(node, styles)) {
      const { instagramUrl, linkedinUrl, facebookUrl, websiteUrl } = parseSocialData(node);

      blocks.push({
        id: createId(),
        type: 'social',
        instagramUrl,
        linkedinUrl,
        facebookUrl,
        websiteUrl,
      });
      markAllVisited(node);
      return;
    }

    // 6. IMAGE
    if (tagName === 'img' || (node.children.length === 1 && node.children[0].tagName.toLowerCase() === 'img')) {
      const img = tagName === 'img' ? (node as HTMLImageElement) : (node.children[0] as HTMLImageElement);
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || 'Imagem Importada';
      const parentAnchor = img.closest('a');
      const caption = img.nextElementSibling?.tagName.toLowerCase() === 'p' ? getTextWithLineBreaks(img.nextElementSibling) : undefined;

      if (src) {
        blocks.push({
          id: createId(),
          type: 'image',
          imageUrl: src,
          imageAlt: alt,
          imageLink: parentAnchor?.getAttribute('href') || undefined,
          imageCaption: caption,
          bgColor,
        });
        markAllVisited(node);
        return;
      }
    }

    // 7. STANDALONE BUTTON / CTA
    if (isButtonElement(node, styles)) {
      const anchor = tagName === 'a' || tagName === 'button' ? node : node.querySelector('a, button') || node;
      const label = getTextWithLineBreaks(anchor) || 'Clique Aqui';
      const url = anchor.getAttribute('href') || '#';

      const anchorStyles = parseStylesAndAttrs(anchor);
      
      // Look for button background color on anchor, node, or parent
      let btnBg = parseColor(anchorStyles['background-color']) || parseColor(styles['background-color']);
      if (!btnBg && node.parentElement) {
        btnBg = parseColor(parseStylesAndAttrs(node.parentElement)['background-color']);
      }
      btnBg = btnBg || '#4f46e5';

      // Look for button text color on anchor or child span/b
      let rawTextColor = parseColor(anchorStyles['color']) || parseColor(styles['color']);

      // Ensure high contrast text color (never invisible!)
      const btnColor = ensureButtonTextColor(btnBg, rawTextColor);

      // Button width: Default to 'auto' (centered pill button)
      // Never force full width during import, so buttons retain their rounded pill formatting
      const btnWidth: 'full' | 'auto' = 'auto';

      let btnAlign = alignment;
      if (node.parentElement) {
        const parentStyles = parseStylesAndAttrs(node.parentElement);
        if (parentStyles['text-align']) btnAlign = parentStyles['text-align'] as any;
      }

      // Outer block background color (MUST NOT be the button's own background color!)
      let blockBgColor: string | undefined = undefined;
      const parentContainer = (tagName === 'a' || tagName === 'button') ? node.parentElement : node.parentElement?.parentElement;
      if (parentContainer) {
        const parentBg = parseColor(parseStylesAndAttrs(parentContainer)['background-color']);
        if (parentBg && parentBg.toLowerCase() !== btnBg.toLowerCase() && parentBg !== '#ffffff') {
          blockBgColor = parentBg;
        }
      }

      blocks.push({
        id: createId(),
        type: 'button',
        buttonLabel: label,
        buttonUrl: url,
        buttonBgColor: btnBg,
        buttonTextColor: btnColor,
        buttonWidth: btnWidth,
        alignment: (btnAlign as any) || 'center',
        fontSizePx: parsePxSize(anchorStyles['font-size'] || styles['font-size'], 16),
        isBold: true,
        fontFamily,
        bgColor: blockBgColor,
      });
      markAllVisited(node);
      if (node.parentElement && (node.parentElement.tagName.toLowerCase() === 'div' || node.parentElement.tagName.toLowerCase() === 'td')) {
        visitedNodes.add(node.parentElement);
      }
      return;
    }

    // 8. TITLE
    if (isTitleElement(node, styles)) {
      const text = extractCleanInlineHtml(node, { unwrapEntireBold: isEntirelyBold, unwrapEntireItalic: isEntirelyItalic });
      if (text) {
        blocks.push({
          id: createId(),
          type: 'title',
          text,
          fontSizePx: fontSizePx || (tagName === 'h1' ? 28 : 24),
          textColor: textColor !== '#334155' ? textColor : '#1e1b4b',
          bgColor,
          alignment,
          isBold: true,
          isItalic,
          fontFamily,
        });
        markAllVisited(node);
        return;
      }
    }

    // 9. SUBTITLE
    if (isSubtitleElement(node, styles)) {
      const text = extractCleanInlineHtml(node, { unwrapEntireBold: isEntirelyBold, unwrapEntireItalic: isEntirelyItalic });
      if (text) {
        blocks.push({
          id: createId(),
          type: 'subtitle',
          text,
          fontSizePx: fontSizePx || 18,
          textColor: textColor !== '#334155' ? textColor : '#475569',
          bgColor,
          alignment,
          isBold,
          isItalic,
          fontFamily,
        });
        markAllVisited(node);
        return;
      }
    }

    // 10. LISTS (<ul>, <ol>)
    if (tagName === 'ul' || tagName === 'ol') {
      const listItems = Array.from(node.querySelectorAll('li'));
      if (listItems.length > 0) {
        listItems.forEach((li) => {
          const liStyles = parseStylesAndAttrs(li);
          const liIsContainerBold = liStyles['font-weight'] === 'bold' || parseInt(liStyles['font-weight'] || '400', 10) >= 600;
          const liIsEntirelyBold = isTagWrappingEntireContent(li, ['b', 'strong']);
          const liIsBold = liIsContainerBold || liIsEntirelyBold;

          const liIsContainerItalic = liStyles['font-style'] === 'italic';
          const liIsEntirelyItalic = isTagWrappingEntireContent(li, ['i', 'em']);
          const liIsItalic = liIsContainerItalic || liIsEntirelyItalic;

          const liText = extractCleanInlineHtml(li, { unwrapEntireBold: liIsEntirelyBold, unwrapEntireItalic: liIsEntirelyItalic });
          if (liText) {
            blocks.push({
              id: createId(),
              type: 'text',
              text: liText,
              fontSizePx: fontSizePx || 15,
              textColor: textColor || '#334155',
              bgColor,
              alignment,
              isBold: liIsBold,
              isItalic: liIsItalic,
              fontFamily,
              lineHeight,
            });
          }
        });
        markAllVisited(node);
        return;
      }
    }

    // 11. PARAGRAPHS & LEAF TEXT CONTAINERS
    if (tagName === 'p' || tagName === 'li' || !hasBlockChildren(node, styles)) {
      const text = extractCleanInlineHtml(node, { unwrapEntireBold: isEntirelyBold, unwrapEntireItalic: isEntirelyItalic });
      if (text && text.length > 0) {
        // Decide block type based on font size or styling
        if (fontSizePx >= 22) {
          blocks.push({
            id: createId(),
            type: 'title',
            text,
            fontSizePx,
            textColor: textColor !== '#334155' ? textColor : '#1e1b4b',
            bgColor,
            alignment,
            isBold: true,
            isItalic,
            fontFamily,
          });
        } else if (fontSizePx >= 17 && (isBold || tagName === 'h3' || tagName === 'h4')) {
          blocks.push({
            id: createId(),
            type: 'subtitle',
            text,
            fontSizePx,
            textColor: textColor !== '#334155' ? textColor : '#475569',
            bgColor,
            alignment,
            isBold,
            isItalic,
            fontFamily,
          });
        } else {
          blocks.push({
            id: createId(),
            type: 'text',
            text,
            fontSizePx: fontSizePx || 15,
            textColor: textColor || '#334155',
            bgColor,
            alignment,
            isBold,
            isItalic,
            fontFamily,
            lineHeight,
          });
        }
        markAllVisited(node);
        return;
      }
    }

    // 12. STRUCTURAL CONTAINERS (div, td, tr, tbody, table, section, article, etc.)
    const children = Array.from(node.children);
    if (children.length > 0) {
      children.forEach((child) => processNode(child));
    }
  };

  const topChildren = Array.from(rootContainer.children);
  if (topChildren.length > 0) {
    topChildren.forEach((child) => processNode(child));
  } else {
    processNode(rootContainer);
  }

  // Fallback if no blocks were parsed
  if (blocks.length === 0) {
    const rawText = getTextWithLineBreaks(doc.body) || 'Texto do e-mail importado';
    blocks.push({
      id: createId(),
      type: 'text',
      text: rawText,
      fontSizePx: 16,
      textColor: '#334155',
      alignment: 'left',
    });
  }

  return blocks;
}
