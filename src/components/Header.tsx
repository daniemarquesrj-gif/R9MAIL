import React from 'react';
import { Screen, TransitionType } from '../types';

interface HeaderProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen, transition?: TransitionType) => void;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentScreen, onNavigate, subtitle }) => {
  return (
    <header className="bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-6 h-16 w-full shadow-xs">
      {/* Branding */}
      <div 
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={() => onNavigate('inicio', 'none')}
      >
        <img 
          src="/favicon.svg" 
          alt="R9 Logo" 
          className="w-8 h-8 rounded-lg shadow-xs transition-transform hover:scale-105" 
        />
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-slate-800 tracking-tight">
            R9Bot <span className="font-light text-slate-500">Mailer</span>
          </span>
          {subtitle && (
            <span className="hidden lg:inline text-xs text-slate-400 font-medium">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Segmented Control Nav */}
      <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
        <button
          onClick={() => onNavigate('inicio', 'none')}
          className={`px-2.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
            currentScreen === 'inicio'
              ? 'bg-white text-blue-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <span className="material-symbols-outlined text-[16px] hidden sm:inline">home</span>
          <span>Início</span>
        </button>

        <button
          onClick={() => onNavigate('editor', 'none')}
          className={`px-2.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
            currentScreen === 'editor'
              ? 'bg-white text-blue-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Editor de Código
        </button>

        <button
          onClick={() => onNavigate('gerador_pro', 'none')}
          className={`px-2.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
            currentScreen === 'gerador_pro'
              ? 'bg-white text-indigo-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <span>Gerador Visual</span>
          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-extrabold px-1 py-0.2 rounded uppercase">
            PRO
          </span>
        </button>

        <button
          onClick={() => onNavigate('visualizacao', 'none')}
          className={`px-2.5 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
            currentScreen === 'visualizacao'
              ? 'bg-white text-blue-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Visualização
        </button>
      </nav>

    </header>
  );
};
