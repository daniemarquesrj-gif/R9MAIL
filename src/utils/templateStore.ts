import type { EmailBlock, EmailData } from '../types';

const STORAGE_KEY = 'r9bot_mailer_templates_v1';
const MAX_VERSIONS = 20;

export interface TemplateVersion {
  id: string;
  createdAt: string;
  name: string;
  subject: string;
  blocks: EmailBlock[];
  emailData: EmailData;
}

export interface TemplateDocument {
  id: string;
  name: string;
  subject: string;
  blocks: EmailBlock[];
  emailData: EmailData;
  createdAt: string;
  updatedAt: string;
  currentVersionId: string;
  versions: TemplateVersion[];
}

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readTemplates(): TemplateDocument[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTemplates(templates: TemplateDocument[]): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function listSavedTemplates(): TemplateDocument[] {
  return readTemplates().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getSavedTemplate(id: string): TemplateDocument | null {
  return readTemplates().find((item) => item.id === id) || null;
}

export function saveTemplateDocument(
  input: Pick<TemplateDocument, 'id' | 'name' | 'subject' | 'blocks' | 'emailData'>
): TemplateDocument {
  const templates = readTemplates();
  const now = new Date().toISOString();
  const existingIndex = templates.findIndex((item) => item.id === input.id);
  const existing = existingIndex >= 0 ? templates[existingIndex] : null;
  const previous = existing?.versions?.[0];
  const normalizedName = input.name.trim() || 'Meu template';
  const normalizedSubject = input.subject.trim() || 'E-mail sem assunto';
  const sameContent = previous
    ? previous.name === normalizedName &&
      previous.subject === normalizedSubject &&
      JSON.stringify(previous.blocks) === JSON.stringify(input.blocks) &&
      JSON.stringify(previous.emailData) === JSON.stringify(input.emailData)
    : false;
  if (existing && sameContent) return clone(existing);

  const version: TemplateVersion = {
    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    name: normalizedName,
    subject: normalizedSubject,
    blocks: clone(input.blocks),
    emailData: clone(input.emailData),
  };

  const document: TemplateDocument = {
    id: input.id,
    name: normalizedName,
    subject: normalizedSubject,
    blocks: clone(input.blocks),
    emailData: clone(input.emailData),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    currentVersionId: version.id,
    versions: [version, ...(existing?.versions || [])].slice(0, MAX_VERSIONS),
  };

  if (existingIndex >= 0) templates[existingIndex] = document;
  else templates.push(document);
  writeTemplates(templates);
  return clone(document);
}

export function deleteSavedTemplate(id: string): void {
  writeTemplates(readTemplates().filter((item) => item.id !== id));
}

export function restoreTemplateVersion(templateId: string, versionId: string): TemplateDocument | null {
  const templates = readTemplates();
  const index = templates.findIndex((item) => item.id === templateId);
  if (index < 0) return null;
  const document = templates[index];
  const version = document.versions.find((item) => item.id === versionId);
  if (!version) return null;

  const now = new Date().toISOString();
  const restoredVersion: TemplateVersion = {
    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    name: version.name || document.name,
    subject: version.subject || document.subject,
    blocks: clone(version.blocks),
    emailData: clone(version.emailData),
  };

  const restored: TemplateDocument = {
    ...document,
    blocks: clone(version.blocks),
    emailData: clone(version.emailData),
    name: version.name || document.name,
    subject: version.subject || document.subject,
    updatedAt: now,
    currentVersionId: restoredVersion.id,
    versions: [restoredVersion, ...document.versions].slice(0, MAX_VERSIONS),
  };
  templates[index] = restored;
  writeTemplates(templates);
  return clone(restored);
}

export interface DraftSnapshot {
  savedAt: string;
  documentId: string;
  blocks: EmailBlock[];
  emailData: EmailData;
}

function draftKey(documentId: string): string {
  return `r9bot_mailer_draft_v2_${encodeURIComponent(documentId)}`;
}

export function saveDraft(blocks: EmailBlock[], emailData: EmailData, documentId: string): boolean {
  if (!canUseStorage() || !documentId) return false;
  try {
    window.localStorage.setItem(
      draftKey(documentId),
      JSON.stringify({ savedAt: new Date().toISOString(), documentId, blocks: clone(blocks), emailData: clone(emailData) })
    );
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(documentId?: string): DraftSnapshot | null {
  if (!canUseStorage() || !documentId) return null;
  try {
    const raw = window.localStorage.getItem(draftKey(documentId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.documentId !== documentId || !Array.isArray(parsed.blocks) || !parsed.emailData) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(documentId: string): void {
  if (!canUseStorage() || !documentId) return;
  window.localStorage.removeItem(draftKey(documentId));
}
