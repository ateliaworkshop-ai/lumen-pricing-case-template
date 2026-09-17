import React from 'react';
import { X, Info, ShieldCheck } from 'lucide-react';
import { ValueKind } from '../../types/simulator';

interface InspectedVariable {
  name: string;
  kind: ValueKind;
  source: string;
  value: any;
  unit: string;
}

interface SourcesDrawerProps {
  variable: InspectedVariable | null;
  onClose: () => void;
}

export const SourcesDrawer: React.FC<SourcesDrawerProps> = ({
  variable,
  onClose
}) => {
  if (!variable) return null;

  const badgeColor: Record<ValueKind, string> = {
    DATA: 'bg-blue-100 text-blue-800 border-blue-200',
    ASSUMPTION: 'bg-amber-100 text-amber-800 border-amber-200',
    MODEL: 'bg-purple-100 text-purple-800 border-purple-200',
    EXTERNAL: 'bg-slate-200 text-slate-800 border-slate-300'
  };

  const kindDescription: Record<ValueKind, string> = {
    DATA: 'Verified and directly measured data from LUMEN production systems or statutory tax and regulatory rules.',
    ASSUMPTION: 'Explicit managerial input established for the German launch simulation (not empirically observed in DE).',
    MODEL: 'Arithmetic calculation or deterministic accounting identity (without arbitrary degrees of freedom).',
    EXTERNAL: 'External benchmark data (syndicated market research or direct competitor shelf audit).'
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-white shadow-2xl border-l border-slate-200 z-50 p-5 overflow-y-auto flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-700" />
            <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
              Source & Assumption Sheet
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Variable Title */}
        <div>
          <span className="text-3xs font-medium text-slate-500 uppercase tracking-wider block">
            Audited Parameter
          </span>
          <h4 className="text-sm font-bold text-slate-900 mt-0.5">{variable.name}</h4>
        </div>

        {/* Current Value & Unit */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-3xs text-slate-500 block">Current Value</span>
            <div className="text-base font-bold text-slate-900 font-mono">
              {variable.value} {variable.unit}
            </div>
          </div>
          <span className={`px-2 py-0.5 rounded text-2xs font-semibold border ${badgeColor[variable.kind]}`}>
            {variable.kind}
          </span>
        </div>

        {/* Provenance Details */}
        <div className="space-y-2">
          <span className="text-2xs font-semibold text-slate-700 block">Origin & Reference</span>
          <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed shadow-2xs">
            {variable.source}
          </div>
        </div>

        {/* Kind meaning */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-2xs space-y-1">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            <span>Classification: {variable.kind}</span>
          </div>
          <p className="text-slate-600 leading-normal">
            {kindDescription[variable.kind]}
          </p>
        </div>

        {/* Caution statement */}
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-2xs text-amber-900 leading-normal">
          <strong>LUMEN Governance Rule:</strong> Board acceptance of an assumption does not constitute empirical validation in the German marketplace.
        </div>
      </div>

      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={onClose}
          className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Close Inspector
        </button>
      </div>
    </div>
  );
};
