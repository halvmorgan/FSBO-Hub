import React from 'react';
import { Loader2 } from 'lucide-react';

interface AiWaitNoticeProps {
  message: string | null;
  className?: string;
}

export const AiWaitNotice: React.FC<AiWaitNoticeProps> = ({ message, className = '' }) => {
  if (!message) return null;
  return (
    <div
      className={`inline-flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-xl animate-fade-in ${className}`}
    >
      <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-amber-600 dark:text-amber-400" />
      <span>{message}</span>
    </div>
  );
};
