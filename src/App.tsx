import React, { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { ExecutiveKpiRibbon } from './components/ExecutiveKpiRibbon';
import { LiveHelpGuide } from './components/LiveHelpGuide';
import { ParametersPanel } from './components/Simulator/ParametersPanel';
import { CommercialView } from './components/Simulator/CommercialView';
import { EconomicsView } from './components/Simulator/EconomicsView';
import { SensitivityView } from './components/Simulator/SensitivityView';
import { ExplanationView } from './components/Simulator/ExplanationView';
import { SourcesDrawer } from './components/Simulator/SourcesDrawer';
import { ScenariosView } from './components/ScenariosView';
import { EvidenceView } from './components/EvidenceView';
import { ComparisonView } from './components/ComparisonView';
import { DecisionView } from './components/DecisionView';
import { DEFAULT_SCENARIOS } from './data/defaultScenarios';
import { Scenario, EvaluationResult, ValueKind, ChannelTerms } from './types/simulator';
import { evaluateScenario } from './engine/calculator';
import { TrendingUp, DollarSign, Sliders, BookOpen, AlertTriangle, ArrowRight, Lightbulb, Compass, FileCheck } from 'lucide-react';

export function App() {
  const [currentTab, setCurrentTab] = useState<'simulator' | 'scenarios' | 'evidence' | 'comparison' | 'decision'>('simulator');
  const [simulatorSubTab, setSimulatorSubTab] = useState<'commercial' | 'economics' | 'sensitivity' | 'explanation'>('economics');
  const [horizon, setHorizon] = useState<3 | 6 | 12>(12);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Scenarios and evaluations
  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    try {
      const saved = localStorage.getItem('lumen_scenarios_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load scenarios from localStorage', e);
    }
    return DEFAULT_SCENARIOS;
  });

  const [activeScenarioId, setActiveScenarioId] = useState<string>(DEFAULT_SCENARIOS[0].id);

  // Inspected variable drawer state
  const [inspectedVariable, setInspectedVariable] = useState<{
    name: string;
    kind: ValueKind;
    source: string;
    value: any;
    unit: string;
  } | null>(null);

  // Comparison selection
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([
    'demo-dtc',
    'demo-retail'
  ]);

  // Save to local storage whenever scenarios change
  useEffect(() => {
    try {
      localStorage.setItem('lumen_scenarios_v1', JSON.stringify(scenarios));
    } catch (e) {
      console.warn('Failed to save scenarios to localStorage', e);
    }
  }, [scenarios]);

  // Active scenario object
  const activeScenario = useMemo(() => {
    return scenarios.find(s => s.id === activeScenarioId) || scenarios[0] || DEFAULT_SCENARIOS[0];
  }, [scenarios, activeScenarioId]);

  // Computed evaluations for all scenarios
  const evaluations = useMemo(() => {
    const results: Record<string, EvaluationResult> = {};
    for (const sc of scenarios) {
      results[sc.id] = evaluateScenario(sc);
    }
    return results;
  }, [scenarios]);

  const activeEvaluation = useMemo(() => {
    return evaluations[activeScenario.id] || evaluateScenario(activeScenario);
  }, [evaluations, activeScenario]);

  // Handlers
  const handleUpdateScenario = (updated: Scenario) => {
    setScenarios(prev => prev.map(s => (s.id === updated.id ? updated : s)));
  };

  const handleCalculate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setScenarios(prev => prev.map(s => {
        if (s.id === activeScenario.id) {
          const revMatch = s.revision.match(/rev-(\d+)/);
          const nextRev = revMatch ? `rev-${Number(revMatch[1]) + 1}` : 'rev-2';
          return {
            ...s,
            revision: nextRev,
            status: 'evaluated',
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      }));
      setIsCalculating(false);
    }, 250);
  };

  const handleSaveDraft = () => {
    alert(`Scenario "${activeScenario.name}" saved successfully.`);
  };

  const handleDuplicate = (idToDuplicate?: string) => {
    const targetId = idToDuplicate || activeScenario.id;
    const target = scenarios.find(s => s.id === targetId);
    if (!target) return;

    const newId = `${target.id}-copy-${Date.now().toString().slice(-4)}`;
    const duplicated: Scenario = {
      ...JSON.parse(JSON.stringify(target)),
      id: newId,
      name: `${target.name} (Copy)`,
      revision: 'rev-1',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setScenarios(prev => [...prev, duplicated]);
    setActiveScenarioId(newId);
    setCurrentTab('simulator');
  };

  const handleCreateScenario = (name: string, description: string) => {
    const base = scenarios[0] || DEFAULT_SCENARIOS[0];
    const newId = `option-custom-${Date.now().toString().slice(-4)}`;
    const fresh: Scenario = {
      ...JSON.parse(JSON.stringify(base)),
      id: newId,
      name,
      description,
      revision: 'rev-1',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setScenarios(prev => [...prev, fresh]);
    setActiveScenarioId(newId);
    setCurrentTab('simulator');
  };

  const handleDeleteScenario = (id: string) => {
    if (scenarios.length <= 1) return;
    setScenarios(prev => prev.filter(s => s.id !== id));
    if (activeScenarioId === id) {
      const remaining = scenarios.filter(s => s.id !== id);
      setActiveScenarioId(remaining[0]?.id || DEFAULT_SCENARIOS[0].id);
    }
  };

  const handleToggleCompare = (id: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id].slice(-3);
      }
    });
  };

  // Executive summary values
  const ck = horizon === 3 ? activeEvaluation?.checkpoints?.m3 : horizon === 6 ? activeEvaluation?.checkpoints?.m6 : activeEvaluation?.checkpoints?.m12;
  const channelsList = Object.values(activeScenario.economics?.channels || {}) as ChannelTerms[];
  const primaryShelfPrice = channelsList[0]?.price?.value ?? 2.49;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Global Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeScenario={activeScenario}
        scenarios={scenarios}
        onSelectScenario={setActiveScenarioId}
        activeEvaluation={activeEvaluation}
        horizon={horizon}
        onChangeHorizon={setHorizon}
        onCalculate={handleCalculate}
        onSaveDraft={handleSaveDraft}
        onDuplicate={() => handleDuplicate()}
        onGoToCompare={() => setCurrentTab('comparison')}
        isCalculating={isCalculating}
        onOpenLiveHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Executive Corporate KPI Ribbon (Always visible across all tabs) */}
      <ExecutiveKpiRibbon
        scenario={activeScenario}
        evaluation={activeEvaluation}
        horizon={horizon}
        onChangeHorizon={setHorizon}
        onNavigateToTab={setCurrentTab}
        onNavigateSubtab={setSimulatorSubTab}
      />

      {/* 3. Main Corporate Workspace */}
      <main className="flex-1 pb-16">
        {currentTab === 'simulator' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">
            {/* Stale Warning Banner if parameters modified */}
            {activeEvaluation.isStale && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900 shadow-2xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Model Alert:</strong> Parameter inputs have been modified. Results shown below are out of sync with current assumptions.
                  </span>
                </div>
                <button
                  onClick={handleCalculate}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1"
                >
                  Recalculate Model Now
                </button>
              </div>
            )}

            {/* Quick Executive Briefing Callout */}
            {ck && (
              <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3 max-w-3xl">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <Lightbulb className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Executive Briefing ({horizon} Months)</span>
                      <span className="text-3xs font-normal text-slate-500 font-mono">
                        Base: {activeScenario.name}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      At a consumer shelf price of <strong>€{primaryShelfPrice.toFixed(2)}</strong>, LUMEN generates{' '}
                      <strong>€{Math.round(ck.netRevenue).toLocaleString('en-US')}</strong> net recognized revenue from{' '}
                      <strong>{ck.volumeTotal.toLocaleString('en-US')} cans</strong>. Gross margin capture is{' '}
                      <strong>{(ck.grossMarginRate * 100).toFixed(1)}%</strong>, delivering a net operating contribution of{' '}
                      <strong className={ck.contributionAfterMarketing >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                        {ck.contributionAfterMarketing >= 0 ? '+' : ''}€{Math.round(ck.contributionAfterMarketing).toLocaleString('en-US')}
                      </strong>{' '}
                      after €{Math.round(ck.marketingSpend).toLocaleString('en-US')} marketing spend.
                      {activeEvaluation.paybackCrossingMonth
                        ? ` Capital payback is achieved in Month ${activeEvaluation.paybackCrossingMonth}.`
                        : ' Full capital recovery extends beyond 12 months.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentTab('comparison')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-2xs flex items-center gap-1 shadow-2xs transition-colors"
                  >
                    <span>Benchmark vs Options</span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                  </button>
                  <button
                    onClick={() => setCurrentTab('decision')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-2xs flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <span>Board Sign-off</span>
                    <FileCheck className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Two-Column Responsive Layout: Left = Parameters, Right = Simulation Output */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Interactive Parameters Panel (4 cols) */}
              <div className="lg:col-span-4 sticky top-36 space-y-4">
                <ParametersPanel
                  scenario={activeScenario}
                  onUpdateScenario={handleUpdateScenario}
                  onInspectVariable={(name, kind, source, value, unit) => {
                    setInspectedVariable({ name, kind, source, value, unit });
                  }}
                />
              </div>

              {/* Right Column: Simulation Results & Analytics (8 cols) */}
              <div className="lg:col-span-8 space-y-4">
                {/* Simulator Subtabs */}
                <div className="bg-white p-1.5 border border-slate-200 rounded-xl shadow-xs flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setSimulatorSubTab('economics')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                      simulatorSubTab === 'economics'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Unit Economics (MD-05/06)</span>
                  </button>

                  <button
                    onClick={() => setSimulatorSubTab('commercial')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                      simulatorSubTab === 'commercial'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Commercial Trajectory (Volume)</span>
                  </button>

                  <button
                    onClick={() => setSimulatorSubTab('sensitivity')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                      simulatorSubTab === 'sensitivity'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>Sensitivity & Stress (F06–F07)</span>
                  </button>

                  <button
                    onClick={() => setSimulatorSubTab('explanation')}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
                      simulatorSubTab === 'explanation'
                        ? 'bg-slate-900 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Audit & Formulas (F04)</span>
                  </button>
                </div>

                {/* Subtab Content Panels */}
                {simulatorSubTab === 'economics' && (
                  <EconomicsView
                    evaluation={activeEvaluation}
                    scenario={activeScenario}
                    horizon={horizon}
                  />
                )}

                {simulatorSubTab === 'commercial' && (
                  <CommercialView
                    evaluation={activeEvaluation}
                    scenario={activeScenario}
                    horizon={horizon}
                  />
                )}

                {simulatorSubTab === 'sensitivity' && (
                  <SensitivityView
                    scenario={activeScenario}
                    evaluation={activeEvaluation}
                  />
                )}

                {simulatorSubTab === 'explanation' && (
                  <ExplanationView
                    scenario={activeScenario}
                    evaluation={activeEvaluation}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'scenarios' && (
          <ScenariosView
            scenarios={scenarios}
            evaluations={evaluations}
            activeScenarioId={activeScenarioId}
            onSelectScenario={setActiveScenarioId}
            onDuplicateScenario={handleDuplicate}
            onCreateScenario={handleCreateScenario}
            onDeleteScenario={handleDeleteScenario}
            selectedForCompare={selectedForCompare}
            onToggleCompare={handleToggleCompare}
            onOpenSimulator={() => setCurrentTab('simulator')}
            onGoToCompare={() => setCurrentTab('comparison')}
          />
        )}

        {currentTab === 'evidence' && (
          <EvidenceView activeScenario={activeScenario} />
        )}

        {currentTab === 'comparison' && (
          <ComparisonView
            scenarios={scenarios}
            evaluations={evaluations}
            selectedIds={selectedForCompare}
            onToggleCompare={handleToggleCompare}
            onSelectActiveScenario={id => {
              setActiveScenarioId(id);
              setCurrentTab('simulator');
            }}
            activeScenario={activeScenario}
          />
        )}

        {currentTab === 'decision' && (
          <DecisionView
            scenarios={scenarios}
            evaluations={evaluations}
            activeScenario={activeScenario}
          />
        )}
      </main>

      {/* 4. Slide-out Drawer for Parameter Origin Inspection */}
      <SourcesDrawer
        variable={inspectedVariable}
        onClose={() => setInspectedVariable(null)}
      />

      {/* 5. Live Interactive Strategy Help Guide */}
      <LiveHelpGuide
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        simulatorSubTab={simulatorSubTab}
        onSelectSimulatorSubTab={setSimulatorSubTab}
        activeScenario={activeScenario}
        activeEvaluation={activeEvaluation}
        horizon={horizon}
        onCalculate={handleCalculate}
        isOpen={isHelpOpen}
        onToggleOpen={setIsHelpOpen}
      />
    </div>
  );
}

export default App;
