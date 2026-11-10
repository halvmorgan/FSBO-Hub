import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-white/70 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0F2A44]/10 to-[#FF6B5A]/15 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-[#0F2A44] dark:text-[#FF6B5A] mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-lg font-bold text-[#0F2A44] dark:text-white mb-1.5">{title}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#FF6B5A] hover:bg-[#fa5644] active:scale-[0.98] transition-all shadow-md shadow-[#FF6B5A]/25"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
