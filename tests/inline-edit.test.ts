import { describe, expect, it } from 'vitest';
import { generateSingleBlockHtml } from '../src/utils/compiler';

describe('inline editing metadata', () => {
  it('marks editable text content in preview HTML', () => {
    const html = generateSingleBlockHtml({ id: 'b1', type: 'text', text: 'Olá' });
    expect(html).toContain('data-inline-edit="text"');
    expect(html).toContain('data-block-id="b1"');
  });

  it('marks button label as editable without exposing the URL as editable text', () => {
    const html = generateSingleBlockHtml({ id: 'b2', type: 'button', buttonLabel: 'Acessar', buttonUrl: 'https://example.com' });
    expect(html).toContain('data-inline-edit="buttonLabel"');
    expect(html).not.toContain('data-inline-edit="buttonUrl"');
  });
});
