import React, { useState, useEffect, useRef } from 'react';
import { EmailData, EmailTemplate, Screen, TransitionType } from '../types';
import { DEFAULT_TEMPLATES } from '../data/templates';
import { generateEmailHtml } from '../utils/htmlGenerator';
import { uploadToPublicHost, checkImageSize } from '../utils/imageUploader';

interface EditorScreenProps {
  emailData: EmailData;
  setEmailData: React.Dispatch<React.SetStateAction<EmailData>>;
  onNavigate: (screen: Screen, transition?: TransitionType) => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  emailData,
  setEmailData,
  onNavigate,
}) => {
  const [code, setCode] = useState<string>(
    () => emailData.customCodeHtml || generateEmailHtml(emailData)
  );
  const [activeTab, setActiveTab] = useState<'visual' | 'html'>('html');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // If code is modified in editor, reflect in emailData
    setEmailData((prev) => ({
      ...prev,
      customCodeHtml: code,
    }));
  }, [code, setEmailData]);

  const insertVariable = (variable: string) => {
    setCode((prev) => prev + ` ${variable} `);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html') && !file.name.endsWith('.htm') && file.type !== 'text/html') {
      alert('Por favor, selecione um arquivo de texto com extensão .html ou .htm');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setCode(content);
        setEmailData((prev) => ({
          ...prev,
          customCodeHtml: content,
        }));
        setToastMessage(`Arquivo HTML "${file.name}" importado com sucesso!`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    };
    reader.onerror = () => {
      alert('Ocorreu um erro ao ler o arquivo. Tente novamente.');
    };
    reader.readAsText(file);
    // Reset file input value so user can upload the same file again if edited
    e.target.value = '';
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).');
      return;
    }

    const sizeCheck = checkImageSize(file, 5);
    if (!sizeCheck.valid) {
      alert(`⚠️ ${sizeCheck.message}`);
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    setToastMessage('🔥 Enviando imagem para o Firebase Storage...');

    try {
      const res = await uploadToPublicHost(file, file.name);
      const imgTag = `\n<img src="${res.url}" alt="${file.name.replace(/\.[^/.]+$/, '')}" style="max-width: 100%; height: auto; display: block; margin: 16px auto; border: 0; outline: none; border-radius: 6px;" />\n`;
      
      setCode((prev) => prev + imgTag);
      setToastMessage(res.message);
    } catch (err: any) {
      console.error('Erro no upload de imagem:', err);
      alert(err?.message || 'Não foi possível realizar o upload da imagem.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleLoadModelClick = (tmpl: EmailTemplate) => {
    const newHtml = tmpl.customCodeHtml || generateEmailHtml({
      headerTitle: tmpl.headerTitle,
      greeting: tmpl.greeting,
      buttonText: tmpl.buttonText,
      buttonUrl: tmpl.buttonUrl,
      bodyText: tmpl.bodyText,
      footerText: tmpl.footerText,
      primaryColor: tmpl.primaryColor,
      activeTemplateId: tmpl.id,
    });

    setCode(newHtml);
    setEmailData((prev) => ({
      ...prev,
      headerTitle: tmpl.headerTitle,
      greeting: tmpl.greeting,
      buttonText: tmpl.buttonText,
      buttonUrl: tmpl.buttonUrl,
      bodyText: tmpl.bodyText,
      footerText: tmpl.footerText,
      primaryColor: tmpl.primaryColor,
      activeTemplateId: tmpl.id,
      customCodeHtml: newHtml,
    }));

    setToastMessage(`Modelo "${tmpl.name}" carregado com sucesso no editor!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex-grow pt-16 pb-20 flex flex-col items-center w-full min-h-[calc(100vh-64px)] relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 bg-emerald-600 text-white font-semibold px-4 py-3 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
      {/* Editor Toolbar */}
      <div className="w-full bg-white border-b border-slate-200 px-4 md:px-6 py-2.5 flex flex-wrap items-center gap-3 sticky top-16 z-30 shadow-xs">
        <div className="flex items-center space-x-1 border-r border-slate-200 pr-3">
          <button 
            onClick={() => setCode((prev) => prev + ' <b>Texto em Negrito</b> ')}
            className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-600 hover:text-blue-600" 
            title="Negrito"
          >
            <span className="material-symbols-outlined text-[20px]">format_bold</span>
          </button>
          <button 
            onClick={() => setCode((prev) => prev + ' <i>Texto em Itálico</i> ')}
            className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-600 hover:text-blue-600" 
            title="Itálico"
          >
            <span className="material-symbols-outlined text-[20px]">format_italic</span>
          </button>
          <button 
            onClick={() => setCode((prev) => prev + ' <u>Texto Sublinhado</u> ')}
            className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-600 hover:text-blue-600" 
            title="Sublinhado"
          >
            <span className="material-symbols-outlined text-[20px]">format_underlined</span>
          </button>
        </div>

        <div className="flex items-center space-x-1 border-r border-slate-200 pr-3">
          <button className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-600">
            <span className="material-symbols-outlined text-[20px]">format_align_left</span>
          </button>
          <button className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-600">
            <span className="material-symbols-outlined text-[20px]">format_align_center</span>
          </button>
          <button className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-600">
            <span className="material-symbols-outlined text-[20px]">format_align_right</span>
          </button>
        </div>

        <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
          <button className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-600">
            <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
          </button>
          <button className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-600">
            <span className="material-symbols-outlined text-[20px]">link</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">swipe_left</span> Variáveis:
          </span>
          <button
            onClick={() => insertVariable('{{nome}}')}
            className="bg-blue-50 px-2 py-1 rounded border border-blue-200 text-xs font-mono text-blue-700 font-semibold hover:bg-blue-100 transition-colors shrink-0"
            title="Inserir {{nome}}"
          >
            &#123;&#123;nome&#125;&#125;
          </button>
          <button
            onClick={() => insertVariable('{{email}}')}
            className="bg-blue-50 px-2 py-1 rounded border border-blue-200 text-xs font-mono text-blue-700 font-semibold hover:bg-blue-100 transition-colors shrink-0"
            title="Inserir {{email}}"
          >
            &#123;&#123;email&#125;&#125;
          </button>
          <button
            onClick={() => insertVariable('{{var1}}')}
            className="bg-blue-50 px-2 py-1 rounded border border-blue-200 text-xs font-mono text-blue-700 font-semibold hover:bg-blue-100 transition-colors shrink-0"
            title="Inserir {{var1}}"
          >
            &#123;&#123;var1&#125;&#125;
          </button>
          <button
            onClick={() => insertVariable('{{var2}}')}
            className="bg-blue-50 px-2 py-1 rounded border border-blue-200 text-xs font-mono text-blue-700 font-semibold hover:bg-blue-100 transition-colors shrink-0"
            title="Inserir {{var2}}"
          >
            &#123;&#123;var2&#125;&#125;
          </button>
          <button
            onClick={() => insertVariable('{{var3}}')}
            className="bg-blue-50 px-2 py-1 rounded border border-blue-200 text-xs font-mono text-blue-700 font-semibold hover:bg-blue-100 transition-colors shrink-0"
            title="Inserir {{var3}}"
          >
            &#123;&#123;var3&#125;&#125;
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Hidden HTML File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".html,.htm,text/html"
            className="hidden"
          />

          {/* Hidden Image Upload Input */}
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploadingImage}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-3 py-1.5 rounded-md border border-indigo-300 transition-all text-xs flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50"
            title="Anexar e hospedar imagem no Firebase Storage com URL pública"
          >
            <span className="material-symbols-outlined text-[17px]">
              {isUploadingImage ? 'sync' : 'add_photo_alternate'}
            </span>
            <span className="hidden sm:inline">
              {isUploadingImage ? 'Enviando...' : 'Anexar Imagem (Firebase)'}
            </span>
            <span className="sm:hidden">Imagem</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold px-3 py-1.5 rounded-md border border-emerald-300 transition-all text-xs flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="Importar um arquivo HTML do computador para edição"
          >
            <span className="material-symbols-outlined text-[17px]">upload_file</span>
            <span className="hidden sm:inline">Importar HTML</span>
            <span className="sm:hidden">Importar</span>
          </button>

          <div className="flex bg-slate-100 rounded-md p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === 'visual'
                  ? 'bg-white shadow-xs text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">description</span>
              <span>Visual</span>
            </button>
            <button
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === 'html'
                  ? 'bg-white shadow-xs text-blue-600 font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">code</span>
              <span>HTML</span>
            </button>
          </div>

          <button
            onClick={() => onNavigate('visualizacao', 'push')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-md transition-all text-xs flex items-center gap-1.5 shadow-xs active:scale-95"
            title="Ir para tela de Visualização"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Ver Visualização</span>
          </button>
        </div>
      </div>

      {/* Split Screen Workspace */}
      <div className="w-full flex-grow flex flex-col lg:flex-row overflow-hidden min-h-[500px]">
        {/* Code Editor Side */}
        <div className="w-full lg:w-1/2 h-auto lg:h-full bg-slate-50 border-r border-slate-200 flex flex-col">
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              EDITOR DE CÓDIGO (LIVE)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded transition-all active:scale-95"
                title="Carregar arquivo .html do seu computador"
              >
                <span className="material-symbols-outlined text-[15px]">file_open</span>
                <span>Importar Arquivo HTML</span>
              </button>
              <span className="text-xs text-slate-400 font-mono">modelo-email.html</span>
            </div>
          </div>

          <div className="flex-grow p-4 md:p-6 relative min-h-[400px]">
            <div className="absolute inset-4 md:inset-6 bg-[#1e293b] rounded-xl overflow-hidden shadow-sm flex flex-col border border-slate-700">
              <div className="flex items-center px-4 py-2.5 gap-2 bg-[#0f172a] border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="ml-2 text-xs font-mono text-slate-400">modelo-email.html</span>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-grow bg-transparent text-slate-200 font-mono text-sm p-4 focus:outline-none resize-none custom-scrollbar w-full h-full leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Live Preview Side */}
        <div className="w-full lg:w-1/2 h-auto lg:h-full bg-slate-100 flex flex-col items-center p-4 md:p-6 overflow-y-auto custom-scrollbar min-h-[400px]">
          <div className="w-full max-w-[620px] bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
              <span className="text-xs text-slate-500 font-mono ml-2">Pré-visualização do Servidor</span>
            </div>
            <div 
              className="p-2 sm:p-4 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: code }}
            />
          </div>
        </div>
      </div>

      {/* Templates Shelf */}
      <section className="w-full bg-slate-50 px-4 md:px-8 py-6 border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-4 text-blue-600">
            <span className="material-symbols-outlined text-xl">auto_awesome</span>
            <h3 className="font-bold uppercase tracking-tight text-sm text-slate-800">
              MODELOS PROFISSIONAIS DE ALTA ENTREGABILIDADE
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {DEFAULT_TEMPLATES.map((tmpl) => {
              const isActive = emailData.activeTemplateId === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  className={`bg-white border rounded-lg overflow-hidden transition-all flex flex-col ${
                    isActive
                      ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-blue-400 hover:shadow-xs'
                  }`}
                >
                  <div className="p-3.5 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-slate-800">{tmpl.name}</h4>
                        {isActive && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3 line-clamp-2 leading-tight">
                        {tmpl.description}
                      </p>
                    </div>
                    {/* Button text explicitly 'Carregar Modelo' as required by spec */}
                    <button
                      onClick={() => handleLoadModelClick(tmpl)}
                      className={`w-full font-semibold text-xs py-1.5 border rounded-md transition-all active:scale-95 ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border-blue-200'
                      }`}
                    >
                      {isActive ? 'Modelo Carregado' : 'Carregar Modelo'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
