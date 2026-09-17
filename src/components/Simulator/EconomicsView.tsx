import React from 'react';
import { EvaluationResult, Scenario } from '../../types/simulator';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface EconomicsViewProps {
  evaluation: EvaluationResult;
  scenario: Scenario;
  horizon: 3 | 6 | 12;
}

export const EconomicsView: React.FC<EconomicsViewProps> = ({
  evaluation,
  scenario,
  horizon
}) => {
  const currentCheckpoint = horizon === 3
    ? evaluation.checkpoints.m3
    : horizon === 6
    ? evaluation.checkpoints.m6
    : evaluation.checkpoints.m12;

  const displayMonths = evaluation.months.slice(0, horizon);

  // Recovery chart data
  const recoveryData = evaluation.cumulativeRecoveryCurve.slice(0, horizon + 1).map((val, idx) => ({
    name: idx === 0 ? 'Pre-launch' : `M${idx}`,
    CumulativeBalance: Math.round(val),
    zero: 0
  }));

  const isProfitable = currentCheckpoint.operatingProfit >= 0;
  const isContributionPositive = currentCheckpoint.contributionAfterMarketing >= 0;

  return (
    <div className="space-y-6">
      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="block text-3xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Gross Consumer Turnover
          </span>
          <div className="text-base font-bold text-slate-900 font-mono">
            €{Math.round(currentCheckpoint.grossTurnover).toLocaleString('en-US')}
          </div>
          <p className="text-3xs text-slate-500 mt-0.5">Shelf price × total cans</p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="block text-3xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Net Recognized Revenue
          </span>
          <div className="text-base font-bold text-emerald-800 font-mono">
            €{Math.round(currentCheckpoint.netRevenue).toLocaleString('en-US')}
          </div>
          <p className="text-3xs text-slate-500 mt-0.5">After VAT, Pfand & channel cuts</p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="block text-3xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Gross Margin
          </span>
          <div className="text-base font-bold text-slate-900 font-mono">
            €{Math.round(currentCheckpoint.grossMargin).toLocaleString('en-US')}
          </div>
          <p className="text-3xs text-emerald-700 font-semibold mt-0.5">
            {(currentCheckpoint.grossMarginRate * 100).toFixed(1)}% of net rev
          </p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="block text-3xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Marketing Investment
          </span>
          <div className="text-base font-bold text-purple-700 font-mono">
            €{Math.round(currentCheckpoint.marketingSpend).toLocaleString('en-US')}
          </div>
          <p className="text-3xs text-slate-500 mt-0.5">Acquisition & Awareness</p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="block text-3xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Net Contribution
          </span>
          <div className={`text-base font-bold font-mono ${isContributionPositive ? 'text-emerald-700' : 'text-rose-600'}`}>
            €{Math.round(currentCheckpoint.contributionAfterMarketing).toLocaleString('en-US')}
          </div>
          <p className="text-3xs text-slate-500 mt-0.5">Gross margin less marketing</p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <span className="block text-3xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
            Operating Profit (EBIT)
          </span>
          <div className={`text-base font-bold font-mono ${isProfitable ? 'text-emerald-700' : 'text-rose-600'}`}>
            €{Math.round(currentCheckpoint.operatingProfit).toLocaleString('en-US')}
          </div>
          <p className="text-3xs text-slate-500 mt-0.5">After fixed costs (€{currentCheckpoint.fixedCosts.toLocaleString('en-US')})</p>
        </div>
      </div>

      {/* Economic Bridge / Waterfall Breakdown */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
        <h3 className="text-xs font-semibold text-slate-900 mb-1">
          Unit Economic Bridge & German Regulatory Deductions
        </h3>
        <p className="text-2xs text-slate-500 mb-3">
          Deterministic reconciliation from gross shelf price to net operating margin per can (MD-05 identity).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-700 font-medium">
              <span>1. Weighted Gross Consumer Price (incl. VAT)</span>
              <span className="font-bold text-slate-900 font-mono">
                €{(currentCheckpoint.grossTurnover / (currentCheckpoint.volumeTotal || 1)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-rose-700 pl-3 text-2xs">
              <span>− German VAT deduction (MwSt 19%)</span>
              <span className="font-mono">
                −€{(displayMonths.reduce((a, b) => a + b.vatPaid, 0) / (currentCheckpoint.volumeTotal || 1)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-rose-700 pl-3 text-2xs">
              <span>− Mandatory single-use container deposit (Einwegpfand)</span>
              <span className="font-mono">−€0.25</span>
            </div>
            <div className="flex justify-between items-center text-rose-700 pl-3 text-2xs">
              <span>− Retailer margin & distributor commissions</span>
              <span className="font-mono">
                −€{((displayMonths.reduce((a, b) => a + b.retailerDeductionTotal + b.distributorDeductionTotal + b.paymentFeeTotal, 0)) / (currentCheckpoint.volumeTotal || 1)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-emerald-900 font-bold border-t border-slate-200 pt-1">
              <span>2. Net Recognized LUMEN Revenue per can</span>
              <span className="font-mono">€{evaluation.weightedNetPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 pl-3 text-2xs">
              <span>− Direct raw material COGS (formula + slim can)</span>
              <span className="font-mono">
                −€{(displayMonths.reduce((a, b) => a + b.cogsTotal, 0) / (currentCheckpoint.volumeTotal || 1)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600 pl-3 text-2xs">
              <span>− Logistics & warehousing shipping fee (3PL)</span>
              <span className="font-mono">
                −€{(displayMonths.reduce((a, b) => a + b.fulfillmentTotal, 0) / (currentCheckpoint.volumeTotal || 1)).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-blue-900 font-bold border-t border-slate-200 pt-1">
              <span>3. Net Gross Margin per can</span>
              <span className="font-mono">€{evaluation.weightedMarginPerCan.toFixed(2)} / can</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
            <h4 className="font-semibold text-slate-800 text-2xs uppercase tracking-wider">
              Breakeven Analysis & Capital Recovery
            </h4>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Committed Pre-launch Investment:</span>
                <span className="font-bold text-slate-900 font-mono">
                  €{scenario.economics.prelaunchInvestment.value.toLocaleString('en-US')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Fixed Overhead ({horizon} months):</span>
                <span className="font-bold text-slate-900 font-mono">
                  €{currentCheckpoint.fixedCosts.toLocaleString('en-US')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Marketing Spend ({horizon} months):</span>
                <span className="font-bold text-purple-700 font-mono">
                  €{currentCheckpoint.marketingSpend.toLocaleString('en-US')}
                </span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between">
                <span className="font-semibold text-slate-800">Annual Breakeven Volume:</span>
                <span className="font-bold text-emerald-800 font-mono">
                  {evaluation.breakevenVolumeAnnual.toLocaleString('en-US')} cans
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-white border border-slate-200 flex items-center gap-2">
              {evaluation.paybackCrossingMonth ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-2xs text-slate-700">
                    <strong>Economic Payback Achieved at Month {evaluation.paybackCrossingMonth}</strong>: Cumulative contribution fully covers upfront capital expenditure and operating fixed overhead.
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-2xs text-slate-700">
                    <strong>Payback not achieved within {horizon}-month horizon</strong>: Cumulative balance remains negative (balance: €{Math.round(evaluation.cumulativeRecoveryCurve[horizon]).toLocaleString('en-US')}).
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cumulative Cash & Recovery Curve */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Cumulative Coverage & Payback Curve
            </h3>
            <p className="text-2xs text-slate-500">
              Evolution of cumulative net balance (Cumulative Contribution − Upfront Capex). Zero-line crossing indicates full economic payback.
            </p>
          </div>
          {evaluation.paybackCrossingMonth && (
            <span className="text-2xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              Payback: Month {evaluation.paybackCrossingMonth}
            </span>
          )}
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={recoveryData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: number) => `€${Math.round(val / 1000)}k`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                formatter={(val: any) => [`€${Number(val).toLocaleString('en-US')}`, 'Net Balance']}
              />
              <ReferenceLine y={0} stroke="#dc2626" strokeDasharray="3 3" strokeWidth={1.5} label={{ value: 'Zero Line', fill: '#dc2626', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="CumulativeBalance"
                name="Cumulative Balance (€)"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#059669' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
