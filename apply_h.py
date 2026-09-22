from pathlib import Path
root=Path('/mnt/data/r9bot_phase_h')

# types
p=root/'src/types.ts'; s=p.read_text()
s=s.replace("export interface EmailData {\n  documentId?: string;\n  subject?: string;", "export type ContentSource = 'blocks' | 'html';\n\nexport interface EmailData {\n  documentId?: string;\n  subject?: string;\n  contentSource?: ContentSource;")
p.write_text(s)

# security
p=root/'src/utils/security.ts'; s=p.read_text()
s=s.replace("  'select', 'option', 'button', 'base', 'link', 'meta', 'stylelink'\n", "  'select', 'option', 'button', 'base', 'link', 'stylelink'\n")
s=s.replace("const SAFE_IMAGE_PROTOCOLS = /^(https?:|data:image\\/)/i;", "const SAFE_IMAGE_PROTOCOLS = /^(https?:|data:image\\/(?:png|jpeg|gif|webp);base64,)/i;")
s=s.replace("  'html', 'head', 'body', 'title', 'style', 'center', 'table', 'thead', 'tbody',", "  'html', 'head', 'body', 'title', 'meta', 'style', 'center', 'table', 'thead', 'tbody',")
# allow only safe meta attributes and remove all others
old="""      if (name === 'target' && tag === 'a' && value !== '_blank' && value !== '_self') {\n        element.setAttribute('target', '_blank');\n      }\n"""
new="""      if (tag === 'meta') {\n        const allowedMeta = new Set(['charset', 'name', 'content', 'http-equiv']);\n        if (!allowedMeta.has(name)) element.removeAttribute(attr.name);\n        continue;\n      }\n\n      if (name === 'target' && tag === 'a' && value !== '_blank' && value !== '_self') {\n        element.setAttribute('target', '_blank');\n      }\n"""
s=s.replace(old,new)
p.write_text(s)

# email compiler
p=root/'src/utils/emailCompiler.ts'; s=p.read_text()
s=s.replace("export function compileTransportHtml(data: EmailData, blocks: EmailBlock[]): string {\n  if (data.customCodeHtml) return sanitizeEmailHtml(data.customCodeHtml);\n  return compileBlocksForEmail(blocks, data);\n}", "export function compileTransportHtml(data: EmailData, blocks: EmailBlock[]): string {\n  // The visual editor is authoritative when the document source is blocks.\n  // customCodeHtml is a derived preview cache in that mode, not the transport source.\n  if (data.contentSource === 'html' && data.customCodeHtml) {\n    return sanitizeEmailHtml(data.customCodeHtml);\n  }\n  return compileBlocksForEmail(blocks, data);\n}")
p.write_text(s)

# compiler legacy universal: explicit source only
p=root/'src/utils/compiler.ts'; s=p.read_text()
s=s.replace("  if (data.customCodeHtml) {\n    // Custom HTML is user-controlled. Sanitize before it leaves the editor.\n    return sanitizeEmailHtml(data.customCodeHtml);\n  }", "  if (data.contentSource === 'html' && data.customCodeHtml) {\n    // Custom HTML is user-controlled. Sanitize before it leaves the editor.\n    return sanitizeEmailHtml(data.customCodeHtml);\n  }")
p.write_text(s)

# template store robust draft and metadata versions
p=root/'src/utils/templateStore.ts'; s=p.read_text()
s=s.replace("  id: string;\n  createdAt: string;\n  blocks: EmailBlock[];", "  id: string;\n  createdAt: string;\n  name: string;\n  subject: string;\n  blocks: EmailBlock[];")
s=s.replace("  const previous = existing?.versions?.[0];\n  const sameContent = previous\n    ? JSON.stringify(previous.blocks) === JSON.stringify(input.blocks) && JSON.stringify(previous.emailData) === JSON.stringify(input.emailData)\n    : false;", "  const previous = existing?.versions?.[0];\n  const normalizedName = input.name.trim() || 'Meu template';\n  const normalizedSubject = input.subject.trim() || 'E-mail sem assunto';\n  const sameContent = previous\n    ? previous.name === normalizedName &&\n      previous.subject === normalizedSubject &&\n      JSON.stringify(previous.blocks) === JSON.stringify(input.blocks) &&\n      JSON.stringify(previous.emailData) === JSON.stringify(input.emailData)\n    : false;")
s=s.replace("    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,\n    createdAt: now,\n    blocks: clone(input.blocks),", "    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,\n    createdAt: now,\n    name: normalizedName,\n    subject: normalizedSubject,\n    blocks: clone(input.blocks),")
s=s.replace("    name: input.name.trim() || 'Meu template',\n    subject: input.subject.trim() || 'E-mail sem assunto',", "    name: normalizedName,\n    subject: normalizedSubject,")
s=s.replace("    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,\n    createdAt: now,\n    blocks: clone(version.blocks),", "    id: `version-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,\n    createdAt: now,\n    name: version.name || document.name,\n    subject: version.subject || document.subject,\n    blocks: clone(version.blocks),")
s=s.replace("    subject: version.emailData.headerTitle || document.subject,", "    name: version.name || document.name,\n    subject: version.subject || document.subject,")
# replace draft funcs
start=s.index("export function saveDraft(")
s=s[:start]+'''export interface DraftSnapshot {\n  savedAt: string;\n  documentId: string;\n  blocks: EmailBlock[];\n  emailData: EmailData;\n}\n\nfunction draftKey(documentId: string): string {\n  return `r9bot_mailer_draft_v2_${encodeURIComponent(documentId)}`;\n}\n\nexport function saveDraft(blocks: EmailBlock[], emailData: EmailData, documentId: string): boolean {\n  if (!canUseStorage() || !documentId) return false;\n  try {\n    window.localStorage.setItem(\n      draftKey(documentId),\n      JSON.stringify({ savedAt: new Date().toISOString(), documentId, blocks: clone(blocks), emailData: clone(emailData) })\n    );\n    return true;\n  } catch {\n    return false;\n  }\n}\n\nexport function loadDraft(documentId?: string): DraftSnapshot | null {\n  if (!canUseStorage() || !documentId) return null;\n  try {\n    const raw = window.localStorage.getItem(draftKey(documentId));\n    if (!raw) return null;\n    const parsed = JSON.parse(raw);\n    if (!parsed || parsed.documentId !== documentId || !Array.isArray(parsed.blocks) || !parsed.emailData) return null;\n    return parsed;\n  } catch {\n    return null;\n  }\n}\n\nexport function clearDraft(documentId: string): void {\n  if (!canUseStorage() || !documentId) return;\n  window.localStorage.removeItem(draftKey(documentId));\n}\n'''
p.write_text(s)

# autosave
p=root/'src/hooks/useDraftAutosave.ts'; s=p.read_text()
s=s.replace("        saveDraft(blocks, { ...emailData, documentId }, documentId);\n        setSaveStatus('saved');", "        const saved = saveDraft(blocks, { ...emailData, documentId }, documentId);\n        if (!saved) {\n          setSaveStatus('error');\n          return;\n        }\n        setSaveStatus('saved');")
p.write_text(s)

# App explicit source
p=root/'src/App.tsx'; s=p.read_text()
s=s.replace("    activeTemplateId: defaultTmpl.id,\n    customCodeHtml: defaultTmpl.customCodeHtml,", "    activeTemplateId: defaultTmpl.id,\n    contentSource: 'html',\n    customCodeHtml: defaultTmpl.customCodeHtml,")
p.write_text(s)

# EditorScreen explicit html source and subject
p=root/'src/screens/EditorScreen.tsx'; s=p.read_text()
s=s.replace("      return {\n        ...prev,\n        customCodeHtml: code,\n      };", "      return {\n        ...prev,\n        contentSource: 'html',\n        customCodeHtml: code,\n      };")
s=s.replace("          customCodeHtml: safeContent,\n        }));", "          contentSource: 'html',\n          customCodeHtml: safeContent,\n        }));")
s=s.replace("      customCodeHtml: newHtml,\n    }));", "      contentSource: 'html',\n      customCodeHtml: newHtml,\n    }));")
p.write_text(s)

# Gerador: source, draft per doc, derived preview but transport blocks
p=root/'src/screens/GeradorProScreen.tsx'; s=p.read_text()
# replace draft initialization with document id first
old="""  // Initialize blocks\n  const [draft] = useState(() => loadDraft());\n  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {\n    if (draft?.blocks?.length) return draft.blocks;\n    if (emailData.customCodeHtml) {\n      const parsed = parseHtmlToBlocks(sanitizeEmailHtml(emailData.customCodeHtml));\n      if (parsed && parsed.length > 0) return parsed;\n    }\n    return DEFAULT_BLOCKS;\n  });\n\n  const [documentId, setDocumentId] = useState<string>(() => draft?.documentId || emailData.documentId || `template-${Date.now()}`);\n"""
new="""  // Initialize the document identity first so drafts can never leak between templates.\n  const [documentId, setDocumentId] = useState<string>(() => emailData.documentId || `template-${Date.now()}`);\n  const [draft] = useState(() => loadDraft(documentId));\n  const [blocks, setBlocks] = useState<EmailBlock[]>(() => {\n    if (draft?.blocks?.length) return draft.blocks;\n    if (emailData.contentSource === 'html' && emailData.customCodeHtml) {\n      const parsed = parseHtmlToBlocks(sanitizeEmailHtml(emailData.customCodeHtml));\n      if (parsed && parsed.length > 0) return parsed;\n    }\n    return DEFAULT_BLOCKS;\n  });\n"""
s=s.replace(old,new)
s=s.replace("        setEmailData((prev) => ({ ...prev, ...draft.emailData, documentId: draft.documentId || prev.documentId }));", "        setEmailData((prev) => ({ ...prev, ...draft.emailData, documentId: draft.documentId, contentSource: 'blocks' }));")
# effect source after mount if entering visual editor
s=s.replace("  const { push: pushToHistory", "  useEffect(() => {\n    setEmailData((prev) => ({ ...prev, documentId, contentSource: 'blocks' }));\n  }, []);\n\n  const { push: pushToHistory")
# keep compiled sync but set source blocks
s=s.replace("        customCodeHtml: compiledHtml,\n        documentId,", "        customCodeHtml: compiledHtml,\n        contentSource: 'blocks',\n        documentId,")
# subject save
s=s.replace("        subject: emailData.headerTitle || 'E-mail sem assunto',", "        subject: emailData.subject || 'E-mail sem assunto',")
# load saved template set blocks source and subject
s=s.replace("    setEmailData({ ...template.emailData, customCodeHtml: safeHtml, documentId: template.id });", "    setEmailData({ ...template.emailData, customCodeHtml: safeHtml, documentId: template.id, contentSource: 'blocks', subject: template.subject });")
# save draft should be boolean handled by try; direct save still okay
# template select set blocks source
s=s.replace("      customCodeHtml: safeTemplateHtml,\n    }));", "      customCodeHtml: safeTemplateHtml,\n      contentSource: 'blocks',\n    }));")
# import html -> blocks source
s=s.replace("      customCodeHtml: safeHtml,\n    }));\n    const parsed", "      customCodeHtml: safeHtml,\n      contentSource: 'blocks',\n    }));\n    const parsed")
# topbar subject
s=s.replace("subject={emailData.headerTitle || 'Minha Campanha de E-mail'}\n        onSubjectChange={(newSubject) => setEmailData((prev) => ({ ...prev, headerTitle: newSubject }))}", "subject={emailData.subject || 'E-mail sem assunto'}\n        onSubjectChange={(newSubject) => setEmailData((prev) => ({ ...prev, subject: newSubject }))}")
s=s.replace("subject={emailData.headerTitle}\n        onShowToast", "subject={emailData.subject || ''}\n        onShowToast")
# template manager name/subject
s=s.replace("name: emailData.headerTitle || 'Meu template',\n        subject: emailData.headerTitle || 'E-mail sem assunto',", "name: emailData.headerTitle || 'Meu template',\n        subject: emailData.subject || 'E-mail sem assunto',")
p.write_text(s)

# tests template store update for draft signature and metadata
p=root/'tests/templateStore.test.ts'; s=p.read_text()
s=s.replace("  headerTitle: 'Template Teste', greeting:", "  subject: 'Assunto Teste', contentSource: 'blocks', headerTitle: 'Template Teste', greeting:")
s=s.replace("    const draft = loadDraft();", "    const draft = loadDraft('doc-1');")
s=s.replace("    clearDraft();", "    clearDraft('doc-1');")
s=s.replace("    const second = saveTemplateDocument({ id: 'doc-1', name: 'Teste', subject: 'Assunto', blocks: [{ ...blocks[0], text: 'Novo' }], emailData: data });", "    const second = saveTemplateDocument({ id: 'doc-1', name: 'Teste', subject: 'Assunto', blocks: [{ ...blocks[0], text: 'Novo' }], emailData: data });")
# Add metadata/version test
s=s.replace("  it('restores a previous version', () => {", "  it('persists name and subject changes as document metadata', () => {\n    saveTemplateDocument({ id: 'doc-1', name: 'Teste', subject: 'Assunto', blocks, emailData: data });\n    const updated = saveTemplateDocument({ id: 'doc-1', name: 'Novo Nome', subject: 'Novo Assunto', blocks, emailData: data });\n    expect(updated.name).toBe('Novo Nome');\n    expect(updated.subject).toBe('Novo Assunto');\n    expect(updated.versions).toHaveLength(2);\n  });\n\n  it('restores a previous version', () => {")
p.write_text(s)

# email compiler tests
p=root/'tests/emailCompiler.test.ts'; s=p.read_text()
s=s.replace("    const html = compileBlocksForEmail(blocks, { headerTitle: 'Teste' } as any);", "    const html = compileBlocksForEmail(blocks, { headerTitle: 'Teste' } as any);")
s += """\n\ndescribe('transport source selection', () => {\n  it('uses the block email compiler when the source is blocks, even if preview HTML exists', () => {\n    const html = compileTransportHtml({ headerTitle: 'Teste', subject: 'Assunto', contentSource: 'blocks', customCodeHtml: '<div>preview</div>' } as any, [{ id: '1', type: 'button', buttonLabel: 'CTA', buttonUrl: 'https://example.com' }]);\n    expect(html).toContain('role=\"article\"');\n    expect(html).toContain('CTA');\n  });\n\n  it('uses sanitized custom HTML only when the source is html', () => {\n    const html = compileTransportHtml({ headerTitle: 'Teste', contentSource: 'html', customCodeHtml: '<script>alert(1)</script><p>Seguro</p>' } as any, []);\n    expect(html).not.toContain('<script>');\n    expect(html).toContain('Seguro');\n  });\n});\n"""
p.write_text(s)

# Remove legacy public-host terminology by aliasing a canonical function and update callers
p=root/'src/utils/imageUploader.ts'; s=p.read_text()
s=s.replace("export async function uploadToPublicHost(", "export async function uploadImage(")
s=s.replace("  provider?: string;", "  provider?: string;")
p.write_text(s)
for fn in ['src/screens/EditorScreen.tsx','src/screens/GeradorProScreen.tsx']:
    p=root/fn; s=p.read_text().replace('uploadToPublicHost','uploadImage'); p.write_text(s)
# props naming in panel
p=root/'src/components/gerador/PropertiesPanel.tsx'; s=p.read_text().replace('handleUploadExistingToPublicHost','handleUploadExistingImage'); p.write_text(s)

# Gerador handler name
p=root/'src/screens/GeradorProScreen.tsx'; s=p.read_text().replace('handleUploadExistingToPublicHost','handleUploadExistingImage'); p.write_text(s)

# add phase H note
(root/'FASE_H.md').write_text('''# Fase H — Auditoria, Correção e Consolidação\n\n## Correções aplicadas\n- Separação explícita entre fonte `blocks` e fonte `html`.\n- `compileTransportHtml` usa o compilador de e-mail quando o documento é visual.\n- `customCodeHtml` passa a ser cache/representação derivada no modo visual, não fonte de transporte.\n- Drafts passaram a ser isolados por `documentId` e `saveDraft` retorna sucesso/falha real.\n- Metadados de nome e assunto passaram a fazer parte das versões.\n- Assunto do e-mail foi separado do título visual do template.\n- Sanitização de `<meta>` corrigida e `data:image` restringido a PNG/JPEG/GIF/WEBP.\n- Removida a nomenclatura legada de host público de imagens. O upload continua exclusivamente no Firebase Storage.\n- Testes adicionados para fonte de transporte e metadados de template.\n\n## Auditoria pós-correção\n- Nenhum uso de hosts públicos de imagens foi encontrado no código de produção.\n- Nenhum Gemini/Express/dotenv foi encontrado no código.\n- Ainda existem alguns `any` em componentes/parser; são dívida técnica não bloqueante.\n- `PropertiesPanel` ainda é grande e pode ser decomposto em etapa futura, mas não é uma correção funcional obrigatória.\n- Regras Firebase não estão presentes no ZIP; precisam ser auditadas no projeto Firebase antes de produção.\n- Build/teste completo deve ser executado no ambiente do projeto após `npm install`.\n''')
