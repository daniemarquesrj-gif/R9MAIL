export type Screen = 'inicio' | 'editor' | 'visualizacao' | 'gerador_pro';

export type TransitionType = 'none' | 'push' | 'push_back';

export interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  badge?: string;
  image: string;
  headerTitle: string;
  greeting: string;
  buttonText: string;
  buttonUrl: string;
  bodyText: string;
  footerText: string;
  primaryColor: string;
  customCodeHtml?: string;
}

export interface EmailData {
  headerTitle: string;
  greeting: string;
  buttonText: string;
  buttonUrl: string;
  bodyText: string;
  footerText?: string;
  primaryColor: string;
  activeTemplateId: string;
  customCodeHtml?: string;

  // Advanced Layout & Responsive options
  alignment?: 'center' | 'left';
  mobileButtonWidth?: 'full' | 'auto';
  cardBorderRadius?: 'none' | 'soft' | 'modern';
  fontSizeLevel?: 'normal' | 'large_mobile';
}
