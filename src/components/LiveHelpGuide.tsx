import React, { useState } from 'react';
import { Scenario, EvaluationResult } from '../types/simulator';
import {
  HelpCircle,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  BarChart2,
  DollarSign,
  FileCheck,
  Compass,
  RotateCcw
} from 'lucide-react';

interface LiveHelpGuideProps {
  currentTab: 'simulator' | 'scenarios' | 'evidence' | 'comparison' | 'decision';
  onSelectTab: (tab: 'simulator' | 'scenarios' | 'evidence' | 'comparison' | 'decision') => void;
  simulatorSubTab?: 'commercial' | 'economics' | 'sensitivity' | 'explanation';
  onSelectSimulatorSubTab?: (subtab: 'commercial' | 'economics' | 'sensitivity' | 'explanation') => void;
  activeScenario: Scenario;
  activeEvaluation: EvaluationResult;
  horizon: 3 | 6 | 12;
  onCalculate: () => void;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
}

export const LiveHelpGuide: React.FC<LiveHelpGuideProps> = ({
  currentTab,
  onSelectTab,
  simulatorSubTab = 'economics',
  onSelectSimulatorSubTab,
  activeScenario,
  activeEvaluation,
  horizon,
  onCalculate,
  isOpen: controlledIsOpen,
  onToggleOpen,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (val: boolean) => {
    if (onToggleOpen) onToggleOpen(val);
    setInternalIsOpen(val);
  };
  const [activeGuideTab, setActiveGuideTab] = useState<'steps' | 'current' | 'diagnostics' | 'glossary'>('current');
  const [glossaryQuery, setGlossaryQuery] = useState('');

  const ck = horizon === 3 ? activeEvaluation?.checkpoints?.m3 : horizon === 6 ? activeEvaluation?.checkpoints?.m6 : activeEvaluation?.checkpoints?.m12;

  // Workflow steps definitions
  const workflowSteps = [
    {
      step: 1,
      id: 'scenarios' as const,
      title: 'Select Baseline Scenario',
      desc: 'Review the 3 pre-modeled go-to-market strategic options (DTC, Omnichannel, Retail) or create a custom one.',
      actionLabel: 'Go to Scenarios',
      isCompleted: true,
    },
    {
      step: 2,
      id: 'simulator' as const,
      subtab: 'economics' as const,
      title: 'Tune Pricing & Channel Margins',
      desc: 'Set consumer shelf price (incl. VAT & Pfand), distributor discounts, and marketing investments.',
      actionLabel: 'Open Parameters',
      isCompleted: !activeEvaluation.isStale,
    },
    {
      step: 3,
      id: 'simulator' as const,
      subtab: 'commercial' as const,
      title: 'Analyze Trajectory & Profitability',
      desc: 'Check 12-month volume ramp, gross margin capture, and verify that payback is under 10 months.',
      actionLabel: 'Review Trajectory',
      isCompleted: !!activeEvaluation.paybackCrossingMonth,
    },
    {
      step: 4,
      id: 'comparison' as const,
      title: 'Benchmark & Stress-Test',
      desc: 'Compare 2 to 3 strategies side-by-side to assess incremental volume vs marketing capital required.',
      actionLabel: 'Compare Options',
      isCompleted: currentTab === 'comparison',
    },
    {
      step: 5,
      id: 'decision' as const,
      title: 'Board Governance Sign-off',
      desc: 'Formalize the strategic recommendation memo, document reverse conditions, and record decision endorsement.',
      actionLabel: 'Execute Sign-off',
      isCompleted: currentTab === 'decision',
    },
  ];

  const currentStepNumber =
    currentTab === 'scenarios'
      ? 1
      : currentTab === 'simulator' && simulatorSubTab === 'economics'
      ? 2
      : currentTab === 'simulator'
      ? 3
      : currentTab === 'comparison'
      ? 4
      : currentTab === 'evidence'
      ? 1
      : 5;

  // Diagnostic health checks
  const healthChecks = [
    {
      title: 'Unit Gross Margin Health',
      status: (ck?.grossMarginRate || 0) >= 0.40 ? 'pass' : 'warn',
      value: `${((ck?.grossMarginRate || 0) * 100).toFixed(1)}%`,
      message:
        (ck?.grossMarginRate || 0) >= 0.40
          ? 'Healthy gross margin above the 40% corporate benchmark.'
          : 'Low gross margin (<40%). High retail discounts or low shelf price may create cash strain.',
    },
    {
      title: 'Capital Payback Period',
      status:
        activeEvaluation.paybackCrossingMonth && activeEvaluation.paybackCrossingMonth <= 10
          ? 'pass'
          : 'warn',
      value: activeEvaluation.paybackCrossingMonth
        ? `Month ${activeEvaluation.paybackCrossingMonth}`
        : 'Over 12 months',
      message:
        activeEvaluation.paybackCrossingMonth && activeEvaluation.paybackCrossingMonth <= 10
          ? 'Meets CFO Jonas Richter’s mandatory target of full cash recovery within 10 months.'
          : 'Fails CFO 10-month constraint. Adjust marketing timing or raise shelf price to accelerate cash recovery.',
    },
    {
      title: 'Calculation Synchronization',
      status: activeEvaluation.isStale ? 'warn' : 'pass',
      value: activeEvaluation.isStale ? 'Stale' : 'Synchronized',
      message: activeEvaluation.isStale
        ? 'Parameters have changed since last calculation. Click "Recalculate" to refresh outputs.'
        : 'Model calculations match current parameters.',
    },
  ];

  // Corporate Glossary items
  const glossaryItems = [
    {
      term: 'Pfand Deposit (€0.25)',
      desc: 'Mandatory German packaging deposit on aluminum cans. Must be subtracted from consumer shelf price before calculating VAT and LUMEN net revenue.',
    },
    {
      term: 'VAT 19% (Mehrwertsteuer)',
      desc: 'Standard German sales tax included in consumer shelf price. Excluded from recognized LUMEN turnover.',
    },
    {
      term: 'Gross Margin (Contribution I)',
      desc: 'Net Revenue recognized by LUMEN minus Cost of Goods Sold (€0.88/can: ingredients, canning, labeling, packaging).',
    },
    {
      term: 'Net Operating Contribution (Contribution II)',
      desc: 'Gross margin minus all localized sales, channel listing fees, and marketing investments over the horizon.',
    },
    {
      term: 'Capital Payback Month',
      desc: 'The exact month in which cumulative operating cash flow turns positive, covering all pre-launch and launch capital.',
    },
    {
      term: 'Incremental ROI',
      desc: 'Ratio of incremental operating contribution generated divided by incremental marketing budget deployed relative to a baseline option.',
    },
  ].filter(
    (item) =>
      item.term.toLowerCase().includes(glossaryQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(glossaryQuery.toLowerCase())
  );

  return (
    <>
      {/* Floating Trigger Button (Always visible on screen) */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-xl border border-slate-700 hover:border-emerald-500 transition-all group"
        >
          <div className="relative">
            <Compass className="w-5 h-5 text-emerald-400 group-hover:rotate-45 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
          </div>
          <div className="text-left">
            <div className="text-2xs font-semibold uppercase tracking-wider text-emerald-400">
              Live Strategy Guide
            </div>
            <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
              <span>Step {currentStepNumber} of 5</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </button>
      </div>

      {/* Slide-in Help & Guidance Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-300 shadow-2xl flex flex-col transition-transform animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Executive Strategy Assistant</h3>
                <p className="text-3xs text-slate-400">Step-by-step guidance to decision results</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Tab Selector inside Guide */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-2xs font-medium">
            <button
              onClick={() => setActiveGuideTab('current')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                activeGuideTab === 'current'
                  ? 'border-emerald-700 text-emerald-900 font-bold bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Current Step
            </button>
            <button
              onClick={() => setActiveGuideTab('steps')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                activeGuideTab === 'steps'
                  ? 'border-emerald-700 text-emerald-900 font-bold bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Workflow (5 Steps)
            </button>
            <button
              onClick={() => setActiveGuideTab('diagnostics')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                activeGuideTab === 'diagnostics'
                  ? 'border-emerald-700 text-emerald-900 font-bold bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Health Check
            </button>
            <button
              onClick={() => setActiveGuideTab('glossary')}
              className={`flex-1 py-2.5 text-center border-b-2 transition-colors ${
                activeGuideTab === 'glossary'
                  ? 'border-emerald-700 text-emerald-900 font-bold bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Glossary
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-slate-700">
            {/* VIEW 1: CURRENT STEP GUIDANCE */}
            {activeGuideTab === 'current' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <Lightbulb className="w-4 h-4 text-emerald-700" />
                    <span>Active Step {currentStepNumber} of 5</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {currentTab === 'simulator' && simulatorSubTab === 'economics' && 'Unit Economics & Margin Capture'}
                    {currentTab === 'simulator' && simulatorSubTab === 'commercial' && 'Sales Volume Ramp & Trajectory'}
                    {currentTab === 'simulator' && simulatorSubTab === 'sensitivity' && 'Stress-Testing & Elasticity'}
                    {currentTab === 'simulator' && simulatorSubTab === 'explanation' && 'Audit Formulas & Methodology'}
                    {currentTab === 'scenarios' && 'Strategy Catalog Selection'}
                    {currentTab === 'evidence' && 'Audited Evidence Data Room (12 Exhibits)'}
                    {currentTab === 'comparison' && 'Multi-Strategy Benchmark Matrix'}
                    {currentTab === 'decision' && 'Executive Sign-off & Governance Dossier'}
                  </h4>
                  <p className="text-2xs text-slate-600 leading-relaxed">
                    {currentTab === 'simulator' && simulatorSubTab === 'economics' &&
                      'Calibrate consumer shelf price (€2.49) and wholesale discounts. Verify that net recognized revenue covers production costs (€0.88 COGS) and leaves sufficient gross margin to fund customer acquisition.'}
                    {currentTab === 'simulator' && simulatorSubTab === 'commercial' &&
                      'Examine the 12-month commercial demand curve. Verify trial vs repeat purchase progression and ensure German seasonal summer peaks (Exhibit 12) align with inventory planning.'}
                    {currentTab === 'simulator' && simulatorSubTab === 'sensitivity' &&
                      'Evaluate resilience under price elasticity (-1.4) and marketing CAC variations (+20% stress). Make sure the business model does not collapse if ad costs spike.'}
                    {currentTab === 'scenarios' &&
                      'Choose between the 3 core strategic avenues: Option A (DTC Premium Focus), Option B (Omnichannel Scale), or Option C (Mass Retail Penetration).'}
                    {currentTab === 'evidence' &&
                      'Audit the 12 underlying exhibits. Note that there are zero observed sales in Germany; all projections are synthesized from Nordic data and German consumer surveys.'}
                    {currentTab === 'comparison' &&
                      'Compare financial metrics side-by-side. Focus on Incremental ROI (ΔContribution / ΔMarketing) to select the most capital-efficient path.'}
                    {currentTab === 'decision' &&
                      'Complete the executive sign-off. Ensure trade-offs and reverse conditions (e.g. CAC thresholds) are formally articulated for the Board.'}
                  </p>
                </div>

                {/* Key Executive Questions for this Step */}
                <div className="space-y-2">
                  <h5 className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                    Key Questions for this Step:
                  </h5>
                  <ul className="space-y-1.5 text-2xs text-slate-700 list-disc pl-4 leading-relaxed">
                    {currentTab === 'simulator' ? (
                      <>
                        <li>Does our unit gross margin exceed the 40% corporate threshold?</li>
                        <li>Is cash payback achieved within CFO Jonas Richter’s 10-month limit?</li>
                        <li>Have we factored in the €0.25 Pfand deposit and 19% German VAT?</li>
                      </>
                    ) : currentTab === 'scenarios' ? (
                      <>
                        <li>Which channel best protects LUMEN&apos;s premium brand positioning?</li>
                        <li>Can we afford mass supermarket listing fees before establishing demand?</li>
                      </>
                    ) : currentTab === 'comparison' ? (
                      <>
                        <li>What is the marginal contribution of adding retail distribution?</li>
                        <li>Does the higher volume of retail compensate for distributor margin loss?</li>
                      </>
                    ) : (
                      <>
                        <li>What are the exact reverse conditions under which we would pivot?</li>
                        <li>Have CFO Jonas Richter and CMO Elena Vance reached alignment?</li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Quick Next Best Action */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 block">
                    Recommended Next Action:
                  </span>
                  {activeEvaluation.isStale ? (
                    <button
                      onClick={onCalculate}
                      className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Recalculate Model with New Inputs</span>
                    </button>
                  ) : currentTab === 'simulator' ? (
                    <button
                      onClick={() => onSelectTab('comparison')}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>Proceed to Step 4: Compare Options</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : currentTab === 'comparison' ? (
                    <button
                      onClick={() => onSelectTab('decision')}
                      className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>Proceed to Step 5: Sign Decision Memo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectTab('simulator')}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                    >
                      <span>Back to Strategy Simulator</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: 5-STEP WORKFLOW NAVIGATOR */}
            {activeGuideTab === 'steps' && (
              <div className="space-y-3">
                <div className="text-2xs text-slate-500">
                  Follow these 5 corporate stages to formulate and validate a sound German market entry strategy:
                </div>
                <div className="space-y-2.5">
                  {workflowSteps.map((ws) => {
                    const isCurrent = currentStepNumber === ws.step;
                    return (
                      <div
                        key={ws.step}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-emerald-50/60 border-emerald-400 ring-1 ring-emerald-400/20'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-3xs font-bold ${
                                isCurrent
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {ws.step}
                            </span>
                            <h5 className="font-bold text-slate-900 text-xs">{ws.title}</h5>
                          </div>
                          {isCurrent && (
                            <span className="text-3xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-2xs text-slate-600 leading-relaxed pl-7">
                          {ws.desc}
                        </p>
                        <div className="mt-2.5 pl-7 flex items-center justify-end">
                          <button
                            onClick={() => {
                              onSelectTab(ws.id);
                              if (ws.subtab && onSelectSimulatorSubTab) {
                                onSelectSimulatorSubTab(ws.subtab);
                              }
                            }}
                            className={`px-2.5 py-1 rounded text-2xs font-semibold flex items-center gap-1 transition-colors ${
                              isCurrent
                                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span>{ws.actionLabel}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 3: LIVE HEALTH CHECK */}
            {activeGuideTab === 'diagnostics' && (
              <div className="space-y-3">
                <div className="text-2xs text-slate-500">
                  Real-time validation against LUMEN&apos;s corporate benchmarks and executive committee constraints:
                </div>
                <div className="space-y-2.5">
                  {healthChecks.map((hc, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border ${
                        hc.status === 'pass'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-amber-50/60 border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          {hc.status === 'pass' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                          <span>{hc.title}</span>
                        </div>
                        <span className="font-mono font-bold text-2xs text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {hc.value}
                        </span>
                      </div>
                      <p className="mt-1.5 text-2xs text-slate-600 leading-relaxed">
                        {hc.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: GLOSSARY */}
            {activeGuideTab === 'glossary' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search FMCG / D2C terms..."
                  value={glossaryQuery}
                  onChange={(e) => setGlossaryQuery(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
                <div className="space-y-2">
                  {glossaryItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-900 text-xs">{item.term}</div>
                      <p className="text-2xs text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer with Quick Step Switching */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-2xs text-slate-600">
            <span>
              LUMEN Executive Decision Engine • DE MVP
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="font-semibold text-slate-800 hover:underline"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </>
  );
};
