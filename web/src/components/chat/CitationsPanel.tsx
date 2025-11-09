"use client";

import { useState } from 'react';
import { Citation } from '@/types/citations';
import { formatCitationMeta, sanitizeUrl } from '@/lib/citations';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface CitationsPanelProps {
  citations: Citation[];
}

function CitationItem({ citation }: { citation: Citation }) {
  const safeUrl = sanitizeUrl(citation.url);
  const meta = formatCitationMeta(citation);
  
  if (!safeUrl) return null;
  
  return (
    <li className="flex items-start gap-2">
      <a
        href={safeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-1 items-start gap-2 rounded-lg border border-transparent p-2 hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/50"
      >
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
            {citation.title}
          </div>
          {meta && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {meta}
            </div>
          )}
        </div>
        <ArrowTopRightOnSquareIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 flex-shrink-0 mt-0.5" />
      </a>
    </li>
  );
}

export default function CitationsPanel({ citations }: CitationsPanelProps) {
  if (!citations?.length) return null;
  
  return (
    <div 
      className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm dark:border-gray-800 dark:bg-gray-900/40"
      role="region"
      aria-label="Sources and citations"
    >
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
        Sources ({citations.length})
      </div>
      <ul className="space-y-1">
        {citations.map((citation, index) => (
          <CitationItem key={citation.docId || index} citation={citation} />
        ))}
      </ul>
    </div>
  );
}

interface CitationsToggleProps {
  citations?: Citation[];
  className?: string;
}

export function CitationsToggle({ citations, className = "" }: CitationsToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!citations?.length) return null;
  
  return (
    <div className={className}>
      <div className="flex justify-end">
        <button
          className="text-sm text-gray-700 underline underline-offset-4 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(prev => !prev)}
        >
          Citations ›
        </button>
      </div>
      {isOpen && <CitationsPanel citations={citations} />}
    </div>
  );
}