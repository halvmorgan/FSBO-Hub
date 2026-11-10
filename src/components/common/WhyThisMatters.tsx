import React from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';

interface WhyThisMattersProps {
  tip: string;
  nextLabel?: string;
  onNext?: () => void;
}

export const WhyThisMatters: React.FC<WhyThisMattersProps> = ({
  tip,
  nextLabel,
  onNext,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 mb-6 rounded-2xl bg-[#0F2A44]/5 dark:bg-slate-800/60 border border-[#0F2A44]/10 dark:border-slate-700/60">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[#F2B544]/20 text-[#0F2A44] dark:text-[#F2B544] flex items-center justify-center font-bold">
          <Lightbulb className="w-4 h-4 text-[#D99B26] dark:text-[#F2B544]" />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          <strong className="text-[#0F2A44] dark:text-white mr-1.5">Why this matters:</strong>
          {tip}
        </p>
      </div>

      {nextLabel && onNext && (
        <button
          type="button"
          onClick={onNext}
          className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-white bg-[#0F2A44] hover:bg-[#1E4268] dark:bg-[#FF6B5A] dark:hover:bg-[#ff5541] transition-all shadow-sm hover:shadow"
        >
          <span>{nextLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
