import React from 'react';
import { VoiceIntent } from '../types';
import { Terminal, CheckCircle2, ChevronDown, ChevronUp, Bug } from 'lucide-react';

interface DebugPanelProps {
  intent: VoiceIntent | null;
  isOpen: boolean;
  onToggle: () => void;
  displayedCount: number;
  totalCatalogCount: number;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  intent,
  isOpen,
  onToggle,
  displayedCount,
  totalCatalogCount,
}) => {
  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Header bar / Toggle */}
      <div
        onClick={onToggle}
        className="px-4 py-2.5 bg-slate-900/80 hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between select-none"
      >
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Diagnostic & NLP Intent Inspector
          </span>
          <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-mono">
            {intent ? intent.intent : 'idle'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>{isOpen ? 'Collapse' : 'Expand Inspector'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded Body */}
      {isOpen && (
        <div className="p-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Column 1: Speech & Recognition */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="text-[11px] font-bold text-orange-400 uppercase tracking-wider">
              1. Speech Input
            </div>
            <div>
              <span className="text-slate-500">Transcript: </span>
              <span className="text-slate-200 font-semibold">"{intent?.transcript || 'None'}"</span>
            </div>
            <div>
              <span className="text-slate-500">Language: </span>
              <span className="text-emerald-400">{intent?.detectedLanguage || 'en'}</span>
            </div>
          </div>

          {/* Column 2: Structured Intent Extraction */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
              2. Extracted Attributes
            </div>
            <div>
              <span className="text-slate-500">Intent: </span>
              <span className="text-amber-300 font-bold">{intent?.intent || 'none'}</span>
            </div>
            <div>
              <span className="text-slate-500">Type: </span>
              <span className="text-slate-200">{intent?.parameters.requestedType || 'Any'}</span>
            </div>
            <div>
              <span className="text-slate-500">Color: </span>
              <span className="text-slate-200 capitalize font-bold text-orange-300">
                {intent?.parameters.requestedColor || 'Any'}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Max Price: </span>
              <span className="text-emerald-300">
                {intent?.parameters.maxPrice ? `₹${intent.parameters.maxPrice}` : 'None'}
              </span>
            </div>
          </div>

          {/* Column 3: Filter Pipeline Result */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              3. Strict Filter Results
            </div>
            <div>
              <span className="text-slate-500">Exact Matches: </span>
              <span className="text-emerald-400 font-bold">{displayedCount} items</span>
            </div>
            <div>
              <span className="text-slate-500">Total Catalogue: </span>
              <span className="text-slate-300">{totalCatalogCount} demo items</span>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
              Rule: Color & Category must strictly match. No silent substitutions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
