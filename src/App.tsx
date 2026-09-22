import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Screen, TransitionType, EmailData } from './types';
import { DEFAULT_TEMPLATES } from './data/templates';

import { Header } from './components/Header';
import { Footer } from './components/Footer';

import { EditorScreen } from './screens/EditorScreen';
import { VisualizacaoScreen } from './screens/VisualizacaoScreen';
import { GeradorProScreen } from './screens/GeradorProScreen';
import { InicioScreen } from './screens/InicioScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('inicio');
  const [transitionType, setTransitionType] = useState<TransitionType>('none');

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
      case 'editor':
        return '/ editor-de-codigo.html';
      case 'visualizacao':
        return '/ visualizacao-real.html';
      case 'gerador_pro':
        return '/ gerador-pro-blocos.html';
      default:
        return '/ modelo-de-email.html';
    }
  };

  return (
    <ErrorBoundary fallbackTitle="R9Bot Mailer" fallbackMessage="O aplicativo encontrou um erro inesperado. Seus dados salvos localmente permanecem protegidos. Tente novamente." resetLabel="Tentar novamente">
      <div className={`flex flex-col bg-background text-on-surface font-body-md ${currentScreen === 'gerador_pro' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Shared Header */}
      <Header
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        subtitle={getSubtitle()}
      />

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
              <InicioScreen onNavigate={handleNavigate} />
            )}

            {currentScreen === 'editor' && (
              <EditorScreen
                emailData={emailData}
                setEmailData={setEmailData}
                onNavigate={handleNavigate}
              />
            )}

            {currentScreen === 'visualizacao' && (
              <VisualizacaoScreen
                emailData={emailData}
                setEmailData={setEmailData}
                onNavigate={handleNavigate}
              />
            )}

            {currentScreen === 'gerador_pro' && (
              <GeradorProScreen
                emailData={emailData}
                setEmailData={setEmailData}
                onNavigate={handleNavigate}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Shared Footer - hidden on gerador_pro to avoid overlapping full-height workspace */}
      {currentScreen !== 'gerador_pro' && (
        <Footer
          onConcluir={
            currentScreen !== 'visualizacao'
              ? () => handleNavigate('visualizacao', 'push')
              : undefined
          }
        />
      )}
      </div>
    </ErrorBoundary>
  );
}
