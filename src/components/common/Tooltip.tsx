import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { REAL_ESTATE_GLOSSARY } from '../../lib/defaults';

interface TooltipProps {
  term: string;
  definition?: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ term, definition, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const text = definition || REAL_ESTATE_GLOSSARY[term] || 'Click for plain English explanation';

  return (
    <span className="relative inline-flex items-center gap-1 group">
      <span className="cursor-help underline decoration-dotted decoration-[#FF6B5A]/60 underline-offset-2">
        {children || term}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-slate-400 hover:text-[#0F2A44] dark:hover:text-amber-300 p-0.5 rounded transition-colors"
        aria-label={`Definition of ${term}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 text-xs font-normal text-white bg-[#0F2A44] rounded-xl shadow-xl ring-1 ring-black/10 transition-all pointer-events-none">
          <strong className="block text-[#F2B544] font-semibold mb-1">{term}</strong>
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F2A44]" />
        </span>
      )}
    </span>
  );
};
