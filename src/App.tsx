import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Screen, TransitionType, EmailData, EmailTemplate } from './types';
import { DEFAULT_TEMPLATES } from './data/templates';
import { createDocumentId } from './utils/templateStore';

import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DailyNoticeModal } from './components/DailyNoticeModal';

import { GeradorProScreen } from './screens/GeradorProScreen';
import { InicioScreen } from './screens/InicioScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginScreen } from './components/auth/LoginScreen';
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen';
import { supabase, isSupabaseConfigured } from './lib/supabase';

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [showDailyNotice, setShowDailyNotice] = useState(false);
  const [passwordResetMode, setPasswordResetMode] = useState(() => {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return search.get('auth') === 'password-reset' || hash.get('type') === 'recovery';
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) { setAuthReady(true); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setAuthenticated(Boolean(data.session));
      setAuthUserId(data.session?.user.id ?? null);
      setAuthReady(true);
    }).catch(() => { if (alive) setAuthReady(true); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordResetMode(true);
      setAuthenticated(Boolean(session));
      setAuthUserId(session?.user.id ?? null);
      setAuthReady(true);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!authReady || !authenticated || !authUserId) {
      setShowDailyNotice(false);
      return;
    }

    // Stores only the last date the notice was dismissed, not user content or templates.
    const today = getLocalDateKey();
    const storageKey = `r9bot-mailer-daily-notice:v1:${authUserId}`;
    try {
      setShowDailyNotice(window.localStorage.getItem(storageKey) !== today);
    } catch {
      // If browser storage is unavailable, show the notice for this session.
      setShowDailyNotice(true);
    }
  }, [authReady, authenticated, authUserId]);

  const handleDismissDailyNotice = () => {
    if (authUserId) {
      const storageKey = `r9bot-mailer-daily-notice:v1:${authUserId}`;
      try {
        window.localStorage.setItem(storageKey, getLocalDateKey());
      } catch {
        // Closing still works when browser storage is blocked.
      }
    }
    setShowDailyNotice(false);
  };

  const [currentScreen, setCurrentScreen] = useState<Screen>('inicio');
  const [transitionType, setTransitionType] = useState<TransitionType>('none');
  const [openLibraryOnEditor, setOpenLibraryOnEditor] = useState(false);

  const defaultTmpl = DEFAULT_TEMPLATES[0];

  const [emailData, setEmailData] = useState<EmailData>({
    headerTitle: defaultTmpl.headerTitle,
    greeting: defaultTmpl.greeting,
    buttonText: defaultTmpl.buttonText,
    buttonUrl: defaultTmpl.buttonUrl,
    bodyText: defaultTmpl.bodyText,
    footerText: defaultTmpl.footerText,
    primaryColor: defaultTmpl.primaryColor,
    activeTemplateId: defaultTmpl.id,
    subject: defaultTmpl.headerTitle,
    contentSource: 'html',
    customCodeHtml: defaultTmpl.customCodeHtml,
  });

  const handleNavigate = (screen: Screen, transition: TransitionType = 'none') => {
    setTransitionType(transition);
    setCurrentScreen(screen);
  };

  const handleSignOut = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setAuthenticated(false);
      setPasswordResetMode(false);
      setOpenLibraryOnEditor(false);
      setCurrentScreen('inicio');
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Não foi possível sair da conta: ${error.message}`);

    setAuthenticated(false);
    setPasswordResetMode(false);
    setOpenLibraryOnEditor(false);
    setCurrentScreen('inicio');
  };

  const handleSelectHomeTemplate = (template: EmailTemplate) => {
    setEmailData((prev) => ({
      ...prev,
      headerTitle: template.headerTitle,
      greeting: template.greeting,
      buttonText: template.buttonText,
      buttonUrl: template.buttonUrl,
      bodyText: template.bodyText,
      footerText: template.footerText,
      primaryColor: template.primaryColor,
      activeTemplateId: template.id,
      subject: template.headerTitle,
      customCodeHtml: template.customCodeHtml,
      contentSource: 'html',
      documentId: createDocumentId(),
    }));
    handleNavigate('gerador_pro', 'push');
  };

  const getVariants = () => {
    if (transitionType === 'push') {
      return {
        initial: { x: '100%', opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: '-100%', opacity: 0 },
      };
    }
    if (transitionType === 'push_back') {
      return {
        initial: { x: '-100%', opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: '100%', opacity: 0 },
      };
    }
    // 'none' transition
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    };
  };

  const getSubtitle = () => {
    switch (currentScreen) {
      case 'inicio':
        return '/ inicio-guia.html';
      case 'gerador_pro':
        return '/ gerador-pro-blocos.html';
      default:
        return '/ modelo-de-email.html';
    }
  };

  if (!authReady) return <div className="min-h-screen flex items-center justify-center bg-white text-slate-500 text-sm">Carregando acesso seguro...</div>;
  if (passwordResetMode) {
    return <ResetPasswordScreen
      onContinue={() => setPasswordResetMode(false)}
      onBackToLogin={() => { setPasswordResetMode(false); setAuthenticated(false); }}
    />;
  }
  if (!authenticated) return <LoginScreen onAuthenticated={() => setAuthenticated(true)} />;

  return (
    <ErrorBoundary fallbackTitle="R9Bot Mailer" fallbackMessage="O aplicativo encontrou um erro inesperado. Seus rascunhos e modelos ficam na nuvem quando o salvamento é confirmado. Tente novamente." resetLabel="Tentar novamente">
      <div className={`flex flex-col bg-background text-on-surface font-body-md ${currentScreen === 'gerador_pro' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Shared navigation is hidden inside the editor workspace to avoid duplicate headers. */}
      {currentScreen !== 'gerador_pro' && (
        <Header
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          subtitle={getSubtitle()}
          onOpenLibrary={() => {
            setOpenLibraryOnEditor(true);
            handleNavigate('gerador_pro', 'push');
          }}
          onSignOut={handleSignOut}
        />
      )}

      {/* Screen Content Container with Motion Animations */}
      <main className="flex-grow flex flex-col relative w-full min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            variants={getVariants()}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: transitionType === 'none' ? 0.15 : 0.35, ease: 'easeInOut' }}
            className="flex-grow flex flex-col w-full min-h-0"
          >
            {currentScreen === 'inicio' && (
              <InicioScreen
                onNavigate={handleNavigate}
                onSelectTemplate={handleSelectHomeTemplate}
                onOpenLibrary={() => {
                  setOpenLibraryOnEditor(true);
                  handleNavigate('gerador_pro', 'push');
                }}
              />
            )}

            {currentScreen === 'gerador_pro' && (
              <GeradorProScreen
                emailData={emailData}
                setEmailData={setEmailData}
                onNavigate={handleNavigate}
                openLibraryOnStart={openLibraryOnEditor}
                onLibraryStartHandled={() => setOpenLibraryOnEditor(false)}
                onSignOut={handleSignOut}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Shared Footer - hidden on gerador_pro to avoid overlapping full-height workspace */}
      {currentScreen !== 'gerador_pro' && <Footer />}
      {showDailyNotice && <DailyNoticeModal onDismiss={handleDismissDailyNotice} />}
      </div>
    </ErrorBoundary>
  );
}
