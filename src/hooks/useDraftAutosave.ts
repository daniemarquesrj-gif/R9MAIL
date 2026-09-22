import { useEffect, useState } from 'react';
import type { EmailBlock, EmailData } from '../types';
import { saveDraft } from '../utils/templateStore';

export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error';

export function useDraftAutosave(
  blocks: EmailBlock[],
  emailData: EmailData,
  documentId: string,
  delay = 700,
) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSavedTime, setLastSavedTime] = useState('agora há pouco');

  useEffect(() => {
    setSaveStatus('dirty');
    const timer = window.setTimeout(() => {
      setSaveStatus('saving');
      try {
        const saved = saveDraft(blocks, { ...emailData, documentId }, documentId);
        if (!saved) {
          setSaveStatus('error');
          return;
        }
        setSaveStatus('saved');
        setLastSavedTime(`às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } catch {
        setSaveStatus('error');
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [blocks, emailData, documentId, delay]);

  return { saveStatus, setSaveStatus, lastSavedTime, setLastSavedTime };
}
