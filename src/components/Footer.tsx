import React from 'react';

interface FooterProps {
  onConcluir?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onConcluir }) => {
  return (
    <footer className="bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-40 flex justify-between items-center px-4 md:px-6 py-3 h-16 w-full shadow-xs">
      <span className="text-xs sm:text-sm text-slate-500 font-medium truncate">
        © 2026 Estácio - Criador de E-mail Marketing
      </span>

      {onConcluir && (
        <div className="flex items-center gap-3">
          <button
            onClick={onConcluir}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 sm:px-5 py-2 rounded-md transition-all text-xs sm:text-sm flex items-center gap-1.5 shadow-xs active:scale-95"
          >
            <span>IR PARA VISUALIZAÇÃO</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      )}
    </footer>
  );
};

