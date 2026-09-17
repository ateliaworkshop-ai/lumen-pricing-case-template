import React from 'react';
import {
  Play,
  Save,
  Copy,
  BarChart2,
  ShieldAlert,
  Sparkles,
  SlidersHorizontal,
  Database,
  GitCompare,
  CheckCircle2,
  AlertCircle,
  Compass,
  FileCheck,
  ChevronDown
} from 'lucide-react';
import { Scenario, EvaluationResult } from '../types/simulator';

interface HeaderProps {
  currentTab: 'simulator' | 'scenarios' | 'evidence' | 'comparison' | 'decision';
  onSelectTab: (tab: 'simulator' | 'scenarios' | 'evidence' | 'comparison' | 'decision') => void;
  activeScenario: Scenario;
  scenarios?: Scenario[];
  onSelectScenario?: (id: string) => void;
  activeEvaluation: EvaluationResult;
  horizon: 3 | 6 | 12;
  onChangeHorizon: (horizon: 3 | 6 | 12) => void;
  onCalculate: () => void;
  onSaveDraft: () => void;
  onDuplicate: () => void;
  onGoToCompare: () => void;
  isCalculating: boolean;
  onOpenLiveHelp?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  activeScenario,
  scenarios = [],
  onSelectScenario,
  activeEvaluation,
  onCalculate,
  onSaveDraft,
  onDuplicate,
  isCalculating,
  onOpenLiveHelp
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      {/* Top Banner: Corporate Governance & Regulatory Note */}
      <div className="bg-slate-900 text-slate-300 px-4 sm:px-6 py-1.5 flex items-center justify-between text-3xs font-medium border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-white font-bold tracking-wider uppercase">LUMEN BEVERAGE CO.</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">German Market Strategic Entry Suite (MVP)</span>
        </div>
        <div className="hidden sm:flex items-center gap-4 text-slate-400">
          <span>Target Market: <strong className="text-slate-200">Germany (DE)</strong></span>
          <span>Launch: <strong className="text-slate-200">{activeScenario.launchDate}</strong></span>
          <span>Fiscal: <strong className="text-slate-200">19% VAT + €0.25 Pfand</strong></span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Deterministic Engine Certified
          </span>
        </div>
      </div>

      {/* Main Executive Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Strategy Fast Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 font-black text-base shadow-xs border border-slate-700">
              LM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  Strategy Simulator
                </h1>
                <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 uppercase tracking-wider">
                  Corporate
                </span>
              </div>
              <p className="text-3xs text-slate-500 font-medium">
                Pricing Architecture & Financial Feasibility
              </p>
            </div>
          </div>

          <div className="hidden md:block h-7 w-px bg-slate-200" />

          {/* Quick Scenario Dropdown Switcher */}
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="text-slate-500 text-2xs font-semibold uppercase tracking-wider">
              Active Strategy:
            </span>
            {scenarios.length > 0 && onSelectScenario ? (
              <select
                value={activeScenario.id}
                onChange={(e) => onSelectScenario(e.target.value)}
                className="bg-slate-50 border border-slate-300 hover:border-slate-400 font-bold text-slate-900 rounded-lg px-2.5 py-1 text-xs cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {scenarios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.revision})
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-bold text-slate-900 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                {activeScenario.name}
              </span>
            )}

            {/* Stale / Synchronized Status Badge */}
            {activeEvaluation.isStale ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-3xs font-bold border border-amber-300">
                <AlertCircle className="w-3 h-3 text-amber-600" />
                Inputs Modified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-3xs font-bold border border-emerald-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                Synchronized
              </span>
            )}
          </div>
        </div>

        {/* Corporate Actions: Recalculate, Help Assistant, Save */}
        <div className="flex items-center gap-2">
          {/* Live Strategy Guide Quick Button */}
          {onOpenLiveHelp && (
            <button
              onClick={onOpenLiveHelp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold text-xs shadow-2xs transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              <span>Live Step Guide</span>
            </button>
          )}

          {/* Primary Action: Recalculate Model */}
          <button
            onClick={onCalculate}
            disabled={isCalculating}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs shadow-xs transition-all ${
              activeEvaluation.isStale
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-500/40 animate-pulse'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isCalculating ? 'Computing Model...' : 'Recalculate Model'}</span>
          </button>

          {/* Secondary Actions */}
          <button
            onClick={onSaveDraft}
            title="Save scenario draft"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={onDuplicate}
            title="Duplicate current scenario"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 5-Stage Corporate Workflow Navigation Tabs */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center border-t border-slate-200/80 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onSelectTab('scenarios')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            currentTab === 'scenarios'
              ? 'border-emerald-700 text-emerald-950 font-bold bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-3xs font-bold flex items-center justify-center">
            1
          </span>
          <span>Scenarios Catalog</span>
        </button>

        <button
          onClick={() => onSelectTab('simulator')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            currentTab === 'simulator'
              ? 'border-emerald-700 text-emerald-950 font-bold bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-3xs font-bold flex items-center justify-center">
            2
          </span>
          <span>Strategy Simulator</span>
        </button>

        <button
          onClick={() => onSelectTab('comparison')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            currentTab === 'comparison'
              ? 'border-emerald-700 text-emerald-950 font-bold bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-3xs font-bold flex items-center justify-center">
            3
          </span>
          <span>Comparative Benchmark (F06–F07)</span>
        </button>

        <button
          onClick={() => onSelectTab('evidence')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            currentTab === 'evidence'
              ? 'border-emerald-700 text-emerald-950 font-bold bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-3xs font-bold flex items-center justify-center">
            4
          </span>
          <span>Evidence Data Room (12 Exhibits)</span>
        </button>

        <button
          onClick={() => onSelectTab('decision')}
          className={`py-2.5 px-4 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
            currentTab === 'decision'
              ? 'border-emerald-700 text-emerald-950 font-bold bg-emerald-50/40'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-900 text-3xs font-bold flex items-center justify-center">
            5
          </span>
          <span className="flex items-center gap-1">
            <span>Executive Sign-off (F08)</span>
            <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
          </span>
        </button>
      </nav>
    </header>
  );
};
