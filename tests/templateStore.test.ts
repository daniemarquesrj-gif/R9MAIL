import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearDraft,
  listSavedTemplates,
  loadDraft,
  restoreTemplateVersion,
  saveDraft,
  saveTemplateDocument,
} from '../src/utils/templateStore';
import { EmailBlock, EmailData } from '../src/types';

const blocks: EmailBlock[] = [{ id: '1', type: 'text', text: 'Olá {{nome}}' }];
const data: EmailData = {
  subject: 'Assunto Teste', contentSource: 'blocks', headerTitle: 'Template Teste', greeting: '', buttonText: '', buttonUrl: '', bodyText: '', primaryColor: '#000', activeTemplateId: 'x', customCodeHtml: '<p>Teste</p>',
};

describe('template persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists and reloads a draft', () => {
    saveDraft(blocks, data, 'doc-1');
    const draft = loadDraft('doc-1');
    expect(draft?.documentId).toBe('doc-1');
    expect(draft?.blocks[0].text).toBe('Olá {{nome}}');
  });

  it('creates versions without duplicating identical saves', () => {
    const first = saveTemplateDocument({ id: 'doc-1', name: 'Teste', subject: 'Assunto', blocks, emailData: data });
    const same = saveTemplateDocument({ id: 'doc-1', name: 'Teste', subject: 'Assunto', blocks, emailData: data });
    expect(same.versions).toHaveLength(1);
    const second = saveTemplateDocument({ id: 'doc-1', name: 'Teste', subject: 'Assunto', blocks: [{ ...blocks[0], text: 'Novo' }], emailData: data });
    expect(second.versions.length).toBe(2);
    expect(listSavedTemplates()).toHaveLength(1);
    expect(first.id).toBe(second.id);
  });

  it('persists name and subject changes as document metadata', () => {
    saveTemplateDocument({ id: 'doc-1', name: 'Teste', subject: 'Assunto', blocks, emailData: data });
    const updated = saveTemplateDocument({ id: 'doc-1', name: 'Novo Nome', subject: 'Novo Assunto', blocks, emailData: data });
    expect(updated.name).toBe('Novo Nome');
    expect(updated.subject).toBe('Novo Assunto');
    expect(updated.versions).toHaveLength(2);
  });

  it('restores a previous version', () => {
    saveTemplateDocument({ id: 'doc-1', name: 'Teste', subject: 'Assunto', blocks, emailData: data });
    const second = saveTemplateDocument({ id: 'doc-1', name: 'Teste', subject: 'Assunto', blocks: [{ ...blocks[0], text: 'Novo' }], emailData: data });
    const oldVersion = second.versions[1];
    const restored = restoreTemplateVersion('doc-1', oldVersion.id);
    expect(restored?.blocks[0].text).toBe('Olá {{nome}}');
    clearDraft('doc-1');
  });
});
