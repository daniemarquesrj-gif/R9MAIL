import { useCallback, useRef, useState } from 'react';
import type { EmailBlock } from '../types';

const MAX_HISTORY = 50;

export function useEditorHistory(initialBlocks: EmailBlock[]) {
  const [history, setHistory] = useState<EmailBlock[][]>([initialBlocks]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyRef = useRef<EmailBlock[][]>([initialBlocks]);
  const historyIndexRef = useRef(0);

  const push = useCallback((newBlocks: EmailBlock[]) => {
    const current = historyRef.current.slice(0, historyIndexRef.current + 1);
    const next = [...current, newBlocks].slice(-MAX_HISTORY);
    const nextIndex = next.length - 1;
    historyRef.current = next;
    historyIndexRef.current = nextIndex;
    setHistory(next);
    setHistoryIndex(nextIndex);
  }, []);

  const undo = useCallback(() => {
    const index = historyIndexRef.current;
    if (index <= 0) return null;
    const nextIndex = index - 1;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    return historyRef.current[nextIndex];
  }, []);

  const reset = useCallback((newBlocks: EmailBlock[]) => {
    historyRef.current = [newBlocks];
    historyIndexRef.current = 0;
    setHistory([newBlocks]);
    setHistoryIndex(0);
  }, []);

  const redo = useCallback(() => {
    const index = historyIndexRef.current;
    if (index >= historyRef.current.length - 1) return null;
    const nextIndex = index + 1;
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    return historyRef.current[nextIndex];
  }, []);

  return {
    push,
    undo,
    redo,
    reset,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
