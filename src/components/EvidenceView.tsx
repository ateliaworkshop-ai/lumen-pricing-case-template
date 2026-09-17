import React, { useState } from 'react';
import { EVIDENCE_CATALOG, EvidenceItem } from '../data/evidenceCatalog';
import { Filter, FileText, ShieldAlert, BarChart3, Database } from 'lucide-react';
import { Scenario } from '../types/simulator';
import { CompetitorBenchmarkView } from './CompetitorBenchmarkView';
import { DEFAULT_SCENARIOS } from '../data/defaultScenarios';

interface EvidenceViewProps {
  activeScenario?: Scenario;
}

export const EvidenceView: React.FC<EvidenceViewProps> = ({ activeScenario }) => {
  const [evidenceMode, setEvidenceMode] = useState<'catalog' | 'competitor_benchmark'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeExhibit, setActiveExhibit] = useState<EvidenceItem | null>(null);

  const scenarioToBenchmark = activeScenario || DEFAULT_SCENARIOS[0];

  const categories = ['all', 'Market', 'Pricing & Competition', 'Consumers & Surveys', 'Sales History', 'Economics & Costs', 'Seasonality'];

  const filtered = selectedCategory === 'all'
    ? EVIDENCE_CATALOG
    : EVIDENCE_CATALOG.filter(e => e.category === selectedCategory);

  const statusBadge = (status: EvidenceItem['status']) => {
    switch (status) {
      case 'DATA_AVAILABLE':
        return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-3xs font-semibold">Available Data</span>;
      case 'QUALIFIED_ANALYSIS':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-3xs font-semibold">Qualified Analysis</span>;
      case 'HYPOTHETICAL_TRANSFER':
        return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-3xs font-semibold">Hypothetical Transfer</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Mode Navigation Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/60 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setEvidenceMode('catalog')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              evidenceMode === 'catalog'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audited Evidence Room (12 Exhibits)</span>
          </button>

          <button
            onClick={() => setEvidenceMode('competitor_benchmark')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              evidenceMode === 'competitor_benchmark'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-300" />
            <span>German Competitor Benchmark Suite</span>
            <span className={`px-2 py-0.5 rounded-full text-3xs font-bold uppercase tracking-wider ${
              evidenceMode === 'competitor_benchmark' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Exhibits 2–5 Live
            </span>
          </button>
        </div>

        <span className="text-3xs text-slate-500 font-mono hidden md:inline-block px-3">
          {evidenceMode === 'catalog' ? 'Data Provenance & Governance' : 'Cross-Channel Pricing & Promotion Scanner'}
        </span>
      </div>

      {evidenceMode === 'competitor_benchmark' ? (
        <CompetitorBenchmarkView activeScenario={scenarioToBenchmark} />
      ) : (
        <>
          {/* Notice Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Major Data Room Methodological Constraint</span>
            </div>
            <p className="text-amber-800 text-2xs leading-relaxed">
              There are <strong>no historical sales in Germany</strong> because LUMEN has never commercialized its products there. All longitudinal sales history (Exhibit 6) stems from the Netherlands (NL), Denmark (DK), and Sweden (SE). The German-specific data available comprises consumer surveys (Exhibits 4, 10, 11), competitor pricing audits (Exhibits 2, 3), and climatic indexes (Exhibit 12).
            </p>
          </div>

          {/* Header & Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Data & Evidence Room Catalog (F01–F02)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audited exhibits establishing empirical grounding for the German market simulation.
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-2xs mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Filter:
              </span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-2xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-emerald-700 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Exhibit Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(item => (
              <div
                key={item.id}
                onClick={() => setActiveExhibit(item)}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold text-slate-500 font-mono">
                      Exhibit {item.exhibitNumber}
                    </span>
                    {statusBadge(item.status)}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                    <div className="text-3xs font-mono text-slate-400 mt-1 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>{item.filename}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    <span className="text-3xs font-semibold uppercase tracking-wider text-slate-400 block">
                      Key Insights:
                    </span>
                    <ul className="text-2xs text-slate-700 space-y-1 list-disc pl-4">
                      {item.keyInsights.slice(0, 2).map((ins, i) => (
                        <li key={i} className="line-clamp-2">{ins}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-2xs">
                  <span className="text-slate-400">Category: {item.category}</span>
                  <span className="text-emerald-700 font-semibold hover:underline">
                    View Exhibit Sheet →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Exhibit Detail Modal */}
      {activeExhibit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xs font-bold text-slate-400 font-mono">
                  Exhibit {activeExhibit.exhibitNumber} • {activeExhibit.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {activeExhibit.title}
                </h3>
                <span className="text-2xs text-slate-500 font-mono">{activeExhibit.filename}</span>
              </div>
              <button
                onClick={() => setActiveExhibit(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-800 text-xs font-semibold"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                  Source & Provenance
                </span>
                <p className="text-slate-800 font-medium">{activeExhibit.provenance}</p>
              </div>

              {activeExhibit.metricsSample && (
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                  <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 block">
                    Sample Audited Metrics
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-2xs">
                    {Object.entries(activeExhibit.metricsSample).map(([k, v]) => (
                      <div key={k} className="p-2 bg-slate-50 rounded border border-slate-100">
                        <span className="text-slate-500 block text-3xs">{k}</span>
                        <span className="font-bold text-slate-900 font-mono text-xs">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="text-2xs font-bold text-slate-800 uppercase tracking-wider">
                  Complete Strategic Findings
                </span>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-700 leading-relaxed text-2xs">
                  {activeExhibit.keyInsights.map((ins, i) => (
                    <li key={i}>{ins}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-2xs text-rose-900 leading-normal">
                <strong>Limitations & Cautionary Caveat:</strong> {activeExhibit.caveats}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {(activeExhibit.id === 'ex-2' || activeExhibit.id === 'ex-3' || activeExhibit.id === 'ex-4' || activeExhibit.id === 'ex-5') ? (
                <button
                  onClick={() => {
                    setActiveExhibit(null);
                    setEvidenceMode('competitor_benchmark');
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Open Interactive Benchmark Explorer →</span>
                </button>
              ) : <div />}
              
              <button
                onClick={() => setActiveExhibit(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
