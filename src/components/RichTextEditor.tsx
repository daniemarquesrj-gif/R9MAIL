import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface RichTextEditorRef {
  focus: () => void;
  execCommand: (command: string, value?: string) => void;
  insertHtml: (html: string) => void;
  insertText: (text: string) => void;
  getSelectionText: () => string;
  hasSelection: () => boolean;
}

interface RichTextEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  minHeight?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onSelectionChange?: (selectedText: string) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Digite o texto aqui...',
      className = '',
      style,
      minHeight = '110px',
      onFocus,
      onBlur,
      onSelectionChange,
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const lastHtmlRef = useRef<string | null>(null);

    // Synchronize innerHTML when value prop changes externally or on mount
    useEffect(() => {
      if (editorRef.current) {
        if (value !== lastHtmlRef.current) {
          let displayHtml = value || '';
          if (displayHtml.includes('\n') && !/<[a-z][\s\S]*>/i.test(displayHtml)) {
            displayHtml = displayHtml.replace(/\n/g, '<br/>');
          }
          editorRef.current.innerHTML = displayHtml;
          lastHtmlRef.current = value || '';
        }
      }
    }, [value]);

    // Handle plain-text paste only (strip all incoming HTML, styles, fonts, etc.)
    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const plainText = e.clipboardData.getData('text/plain');
      if (!plainText) return;

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        range.deleteContents();

        // Convert newline characters into text nodes or break lines cleanly
        const textNode = document.createTextNode(plainText);
        range.insertNode(textNode);

        // Move cursor right after the newly inserted plain text
        range.setStartAfter(textNode);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
      } else if (editorRef.current) {
        editorRef.current.innerText += plainText;
      }
      handleInput();
    };

    // Handle user input
    const handleInput = () => {
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        lastHtmlRef.current = html;
        onChange(html);
      }
    };

    // Check selection
    const handleSelection = () => {
      if (onSelectionChange && window.getSelection) {
        const sel = window.getSelection();
        if (sel && editorRef.current && editorRef.current.contains(sel.anchorNode)) {
          const selectedText = sel.toString();
          onSelectionChange(selectedText);
        }
      }
    };

    // Expose imperative handle for toolbar execution
    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      },
      execCommand: (command: string, value: string = '') => {
        if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand(command, false, value);
          handleInput();
        }
      },
      insertHtml: (html: string) => {
        if (editorRef.current) {
          editorRef.current.focus();
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const el = document.createElement('div');
            el.innerHTML = html;
            const frag = document.createDocumentFragment();
            let node;
            let lastNode;
            while ((node = el.firstChild)) {
              lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
            if (lastNode) {
              range.setStartAfter(lastNode);
              range.collapse(true);
              sel.removeAllRanges();
              sel.addRange(range);
            }
          } else {
            editorRef.current.innerHTML += html;
          }
          handleInput();
        }
      },
      insertText: (text: string) => {
        if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand('insertText', false, text);
          handleInput();
        }
      },
      getSelectionText: () => {
        const sel = window.getSelection();
        return sel ? sel.toString() : '';
      },
      hasSelection: () => {
        const sel = window.getSelection();
        return Boolean(sel && sel.toString().length > 0);
      },
    }));

    return (
      <div className="relative w-full group">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onBlur={() => {
            handleInput();
            if (onBlur) onBlur();
          }}
          onFocus={onFocus}
          onKeyUp={handleSelection}
          onMouseUp={handleSelection}
          onSelect={handleSelection}
          style={{ minHeight, ...style }}
          className={`w-full p-3 text-xs leading-relaxed border border-slate-300 rounded-xl bg-white text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-sans overflow-y-auto ${className}`}
        />
        {(!value || value.trim() === '' || value.trim() === '<br>' || value.trim() === '<br/>') && (
          <div
            onClick={() => editorRef.current?.focus()}
            className="absolute top-3 left-3 text-xs text-slate-400 pointer-events-none select-none font-sans"
          >
            {placeholder}
          </div>
        )}
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
