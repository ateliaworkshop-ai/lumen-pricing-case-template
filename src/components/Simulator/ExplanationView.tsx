import React from 'react';
import { EvaluationResult, Scenario } from '../../types/simulator';
import { BookOpen, ShieldAlert } from 'lucide-react';

interface ExplanationViewProps {
  scenario: Scenario;
  evaluation: EvaluationResult;
}

export const ExplanationView: React.FC<ExplanationViewProps> = ({
  evaluation
}) => {
  return (
    <div className="space-y-6 text-xs text-slate-800">
      {/* Methodological Integrity Card */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
          <BookOpen className="w-4 h-4 text-emerald-700" />
          <h3>Methodological Traceability & Calculation Engine Contract (MD-01 to MD-09)</h3>
        </div>
        <p className="text-2xs text-slate-600 leading-relaxed">
          The simulator guarantees full end-to-end traceability across empirical market data, accounting identities, and strategic assumptions. Every metric originates from certified deterministic formulas without black-box logic.
        </p>

        {/* Provenance breakdown cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
            <span className="text-3xs font-bold uppercase tracking-wider block">1. Observed Facts (DATA)</span>
            <div className="text-lg font-bold font-mono mt-0.5">{evaluation.provenanceSummary.dataCount}</div>
            <p className="text-3xs text-blue-700/80 mt-0.5">German VAT 19%, Pfand €0.25, factory COGS</p>
          </div>

          <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900">
            <span className="text-3xs font-bold uppercase tracking-wider block">2. Accounting Rules (MODEL)</span>
            <div className="text-lg font-bold font-mono mt-0.5">{evaluation.provenanceSummary.modelCount}</div>
            <p className="text-3xs text-purple-700/80 mt-0.5">MD-05 identities, margin cascade</p>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
            <span className="text-3xs font-bold uppercase tracking-wider block">3. Strategic Inputs (ASSUMPTION)</span>
            <div className="text-lg font-bold font-mono mt-0.5">{evaluation.provenanceSummary.assumptionCount}</div>
            <p className="text-3xs text-amber-700/80 mt-0.5">Demand run-rate, channel mix, CAC</p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 text-slate-900">
            <span className="text-3xs font-bold uppercase tracking-wider block">4. External Benchmarks (EXTERNAL)</span>
            <div className="text-lg font-bold font-mono mt-0.5">{evaluation.provenanceSummary.externalCount}</div>
            <p className="text-3xs text-slate-600 mt-0.5">Competitor retail price benchmarks in Germany</p>
          </div>
        </div>
      </div>

      {/* Accounting & Financial Formulas */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs space-y-4">
        <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
          Explicit Formulas & Valuation Rules
        </h4>

        <div className="space-y-3">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1 flex items-center justify-between">
              <span>Gross Consumer Turnover & Net Taxable Base (excl. Deposit)</span>
              <span className="text-3xs font-mono bg-slate-200 px-1.5 py-0.5 rounded">MD-05</span>
            </div>
            <code className="block bg-white p-2 rounded border border-slate-200 text-slate-800 font-mono text-2xs mb-1">
              Net_Taxable_Base = (Shelf_Price_TTC − Pfand_Deposit_0.25€) / (1 + VAT_Rate_19%)
            </code>
            <p className="text-3xs text-slate-500">
              The mandatory German container deposit (€0.25) is balance sheet neutral for LUMEN (collected and remitted to DPG). German VAT of 19% applies exclusively to the beverage price.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1 flex items-center justify-between">
              <span>Net Recognized Revenue & Gross Margin per Channel</span>
              <span className="text-3xs font-mono bg-slate-200 px-1.5 py-0.5 rounded">MD-05</span>
            </div>
            <code className="block bg-white p-2 rounded border border-slate-200 text-slate-800 font-mono text-2xs mb-1">
              Net_Revenue = Net_Taxable_Base − (Retailer_Margin + Distributor_Cut + Payment_Fees)
              <br />
              Gross_Margin = Net_Revenue − (Direct_Material_COGS + 3PL_Fulfillment_Fee)
            </code>
            <p className="text-3xs text-slate-500">
              Channel deductions are calculated strictly in cascade without double counting.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-900 mb-1 flex items-center justify-between">
              <span>Net Contribution & Capital Recovery (Economic Payback)</span>
              <span className="text-3xs font-mono bg-slate-200 px-1.5 py-0.5 rounded">MD-06</span>
            </div>
            <code className="block bg-white p-2 rounded border border-slate-200 text-slate-800 font-mono text-2xs mb-1">
              Contribution = Gross_Margin − Marketing_Expenditure
              <br />
              Cumulative_Balance(M) = −Initial_Investment + ∑[Contribution(1..M)]
            </code>
            <p className="text-3xs text-slate-500">
              The payback month is defined as the first month M in which the cumulative balance turns strictly positive (zero-line crossing).
            </p>
          </div>
        </div>
      </div>

      {/* Warnings & Limits Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-semibold">
          <ShieldAlert className="w-4 h-4 text-amber-700" />
          <h4>Major Methodological Reservations</h4>
        </div>
        <ul className="list-disc pl-5 space-y-1.5 text-2xs text-amber-900/90 leading-relaxed">
          <li>
            <strong>Zero observed sales in Germany:</strong> LUMEN has never sold commercial cans in Germany. All demand trajectories are transferred assumptions based on Dutch and Scandinavian historical data.
          </li>
          <li>
            <strong>Non-causality of predictive ML POC:</strong> Ridge regression models from the forecasting POC measure historical correlations in established markets. Under no circumstances should they be treated as causal estimates of price elasticity or ad response in Germany.
          </li>
          <li>
            <strong>Rejection of pseudo-statistical intervals:</strong> The simulator rejects artificial confidence intervals (such as &quot;± WAPE&quot;). Genuine uncertainty is represented through explicit discrete scenario stress-testing (Conservative, Central, Favorable).
          </li>
        </ul>
      </div>
    </div>
  );
};
