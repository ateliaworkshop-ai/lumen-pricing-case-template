import React, { useState } from 'react';
import { Scenario, EvaluationResult } from '../types/simulator';
import { CheckCircle2, AlertTriangle, ShieldCheck, Printer, FileSignature } from 'lucide-react';

interface DecisionViewProps {
  scenarios: Scenario[];
  evaluations: Record<string, EvaluationResult>;
  activeScenario: Scenario;
}

export const DecisionView: React.FC<DecisionViewProps> = ({
  evaluations,
  activeScenario
}) => {
  const [signerName, setSignerName] = useState('Elena Vance & Jonas Richter');
  const [signerRole, setSignerRole] = useState('Executive Committee (CFO & CMO)');
  const [decisionStatus, setDecisionStatus] = useState<'APPROVED' | 'CONDITIONAL' | 'REJECTED'>('APPROVED');
  const [decisionRationale, setDecisionRationale] = useState(
    'We endorse Option A (DTC Premium Focus) at €2.49 gross shelf price in Phase 1. This option safeguards unit gross margin (€1.08/can) and achieves capital recovery within Month 8 without premature brand dilution across mass supermarket channels prior to community brand loyalty validation.'
  );
  const [isSigned, setIsSigned] = useState(false);
  const [signedDate, setSignedDate] = useState<string | null>(null);

  const evalResult = evaluations[activeScenario.id];
  const kpi12 = evalResult?.checkpoints.m12;

  const handleSign = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigned(true);
    setSignedDate(new Date().toLocaleString('en-US'));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header & Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Stage F08
            </span>
            <h2 className="text-lg font-bold text-slate-900">Decision Dossier & Governance Sign-off</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Executive strategic briefing prepared for the Board of LUMEN Beverage Co.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Synthesis Card: Recommended Strategy */}
      <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Selected Strategic Recommendation
          </span>
          <span className="text-2xs font-mono text-slate-400">Target Market: Germany (DE)</span>
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-900">{activeScenario.name}</h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {activeScenario.description}
          </p>
        </div>

        {/* Snapshot Metrics */}
        {kpi12 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-3xs font-semibold text-slate-500 uppercase">Target Annual Volume</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {kpi12.volumeTotal.toLocaleString('en-US')} cans
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-3xs font-semibold text-slate-500 uppercase">Net Recognized Revenue</span>
              <div className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                €{Math.round(kpi12.netRevenue).toLocaleString('en-US')}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-3xs font-semibold text-slate-500 uppercase">Net Contribution</span>
              <div className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                €{Math.round(kpi12.contributionAfterMarketing).toLocaleString('en-US')}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-3xs font-semibold text-slate-500 uppercase">Capital Payback</span>
              <div className="text-base font-bold text-purple-700 font-mono mt-0.5">
                {evalResult?.paybackCrossingMonth ? `Month ${evalResult.paybackCrossingMonth}` : 'Not achieved'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stakeholder Perspectives Grid (Freya, Jonas, Elena) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs">F</div>
            <div>
              <div>Freya Lindqvist</div>
              <div className="text-3xs font-normal text-slate-400">CEO & Founder</div>
            </div>
          </div>
          <p className="text-2xs text-slate-600 leading-relaxed">
            &ldquo;Safeguard LUMEN&apos;s premium aura and science-backed nootropic positioning. Avoid the mass discount trap that would erode our brand equity across Europe.&rdquo;
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs">J</div>
            <div>
              <div>Jonas Richter</div>
              <div className="text-3xs font-normal text-slate-400">CFO & Treasurer</div>
            </div>
          </div>
          <p className="text-2xs text-slate-600 leading-relaxed">
            &ldquo;Strict requirement for cash payback within 10 months. Zero long-term retail listing commitments with slotting fees or out-of-stock penalties without pilot proof.&rdquo;
          </p>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center text-xs">E</div>
            <div>
              <div>Elena Vance</div>
              <div className="text-3xs font-normal text-slate-400">CMO & Go-to-Market</div>
            </div>
          </div>
          <p className="text-2xs text-slate-600 leading-relaxed">
            &ldquo;Concentrate acquisition spend on Berlin and Munich with tech/founder creators to validate empirical blended CAC before scaling national media spend.&rdquo;
          </p>
        </div>
      </div>

      {/* Trade-offs & Reverse Conditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Deliberate Sacrifices & Trade-offs</span>
          </h4>
          <ul className="text-2xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>Lower initial absolute volume compared to aggressive hypermarket distribution (Edeka/Rewe nationwide).</li>
            <li>Initial dependency on disciplined paid performance marketing execution (Meta / TikTok / Search Ads).</li>
            <li>Higher 3PL packaging and delivery fee per unit for direct-to-consumer delivery (€0.45 vs €0.15 on pallet retail).</li>
          </ul>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
          <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Reverse Conditions & Pivot Thresholds</span>
          </h4>
          <ul className="text-2xs text-slate-600 space-y-1.5 list-disc pl-4 leading-relaxed">
            <li>If blended CAC in urban hubs exceeds €38 per initial order, reallocate ad spend toward localized direct office sampling.</li>
            <li>If 60-day repeat purchase rate drops below 20%, adjust multipack tier discounts or launch a monthly subscriber bundle with 10% saving.</li>
            <li>If monthly run-rate exceeds 20,000 cans by Month 6, initiate selective organic grocery discussions (Alnatura / Denn&apos;s Biomarkt).</li>
          </ul>
        </div>
      </div>

      {/* Formal Sign-off Form */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <FileSignature className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Executive Sign-off & Decision Endorsement
            </h3>
            <p className="text-3xs text-slate-500">
              In accordance with corporate governance standards, strategic execution requires explicit managerial authorization.
            </p>
          </div>
        </div>

        {isSigned ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Strategic Dossier Formally Endorsed & Executed</span>
            </div>
            <div className="text-2xs text-emerald-800 space-y-1">
              <div>Signatory: <strong>{signerName}</strong> ({signerRole})</div>
              <div>Decision Verdict: <strong>{decisionStatus}</strong></div>
              <div>Official Timestamp: <strong>{signedDate}</strong></div>
              <div className="italic pt-1">&ldquo;{decisionRationale}&rdquo;</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSign} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Signatory Names
                </label>
                <input
                  type="text"
                  value={signerName ?? ''}
                  onChange={e => setSignerName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-700 mb-1">
                  Role / Governance Body
                </label>
                <input
                  type="text"
                  value={signerRole ?? ''}
                  onChange={e => setSignerRole(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Formal Verdict
              </label>
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={decisionStatus === 'APPROVED'}
                    onChange={() => setDecisionStatus('APPROVED')}
                    className="text-emerald-700 focus:ring-emerald-600"
                  />
                  <span className="font-semibold text-emerald-800">Option Endorsed</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={decisionStatus === 'CONDITIONAL'}
                    onChange={() => setDecisionStatus('CONDITIONAL')}
                    className="text-amber-700 focus:ring-amber-600"
                  />
                  <span className="font-semibold text-amber-800">Subject to Pilot Testing</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-700 mb-1">
                Executive Rationale & Strategic Defense
              </label>
              <textarea
                rows={3}
                value={decisionRationale ?? ''}
                onChange={e => setDecisionRationale(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
              >
                Sign and Record Decision
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
