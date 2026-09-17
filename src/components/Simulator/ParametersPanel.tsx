import React, { useState } from 'react';
import { ChevronDown, ChevronRight, HelpCircle, Layers, DollarSign, Calendar, TrendingUp, Megaphone } from 'lucide-react';
import { Scenario, ValueKind, ChannelTerms } from '../../types/simulator';

interface ParametersPanelProps {
  scenario: Scenario;
  onUpdateScenario: (updated: Scenario) => void;
  onInspectVariable?: (name: string, kind: ValueKind, source: string, value: any, unit: string) => void;
}

export const ParametersPanel: React.FC<ParametersPanelProps> = ({
  scenario,
  onUpdateScenario,
  onInspectVariable
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    strategy: true,
    commercial: true,
    pricing: true,
    economics: false,
    marketing: false
  });

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const updateScenarioField = (mutator: (draft: Scenario) => void) => {
    const updated = JSON.parse(JSON.stringify(scenario)) as Scenario;
    mutator(updated);
    updated.status = 'stale'; // immediately marks results stale
    onUpdateScenario(updated);
  };

  const renderBadge = (kind: ValueKind, source: string, label: string, val: any, unit: string) => {
    const colorMap: Record<ValueKind, string> = {
      DATA: 'bg-blue-50 text-blue-700 border-blue-200',
      ASSUMPTION: 'bg-amber-50 text-amber-700 border-amber-200',
      MODEL: 'bg-purple-50 text-purple-700 border-purple-200',
      EXTERNAL: 'bg-slate-100 text-slate-700 border-slate-200'
    };

    return (
      <button
        type="button"
        onClick={() => onInspectVariable?.(label, kind, source, val, unit)}
        className={`inline-flex items-center gap-1 text-3xs font-semibold px-1.5 py-0.5 rounded-sm border cursor-pointer transition-all hover:scale-105 ${colorMap[kind]}`}
        title={`Provenance: ${kind} — Click to inspect origin`}
      >
        <span>{kind}</span>
        <HelpCircle className="w-2.5 h-2.5 opacity-60" />
      </button>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden divide-y divide-slate-100 text-xs">
      <div className="p-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <h2 className="font-semibold text-slate-900 text-xs uppercase tracking-wider">
            Parameters & Assumptions
          </h2>
        </div>
        <span className="text-2xs text-slate-500 font-medium">Editable</span>
      </div>

      {/* 1. Strategy & Calendar */}
      <div>
        <button
          onClick={() => toggleSection('strategy')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-slate-800 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-700" />
            <span>1. Strategy & Launch Calendar</span>
          </div>
          {openSections.strategy ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {openSections.strategy && (
          <div className="p-3.5 pt-1 space-y-3 bg-white">
            <div>
              <label className="block text-2xs font-semibold text-slate-600 mb-1">
                Strategic Option Name
              </label>
              <input
                type="text"
                value={scenario.name ?? ''}
                onChange={e => updateScenarioField(d => { d.name = e.target.value; })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1">
                  Target Geography
                </label>
                <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-md font-medium text-slate-700">
                  DE (Germany)
                </div>
              </div>
              <div>
                <label className="block text-2xs font-semibold text-slate-600 mb-1">
                  Launch Date
                </label>
                <input
                  type="date"
                  value={scenario.launchDate ?? ''}
                  onChange={e => updateScenarioField(d => { d.launchDate = e.target.value; })}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-2xs font-semibold text-slate-600 mb-1">
                Description & Positioning Thesis
              </label>
              <textarea
                rows={2}
                value={scenario.description ?? ''}
                onChange={e => updateScenarioField(d => { d.description = e.target.value; })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-emerald-600 text-slate-700"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Commercial Trajectory (Mode A vs B) */}
      <div>
        <button
          onClick={() => toggleSection('commercial')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-slate-800 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Commercial Demand & Volume Mode</span>
          </div>
          {openSections.commercial ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {openSections.commercial && (
          <div className="p-3.5 pt-1 space-y-3 bg-white">
            {/* Mode Selector */}
            <div className="flex rounded-md p-0.5 bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => updateScenarioField(d => { d.mode = 'A'; })}
                className={`flex-1 py-1 px-2 rounded text-2xs font-medium transition-all ${
                  scenario.mode === 'A'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mode A: Total Demand & Assumed Ramp
              </button>
              <button
                type="button"
                onClick={() => updateScenarioField(d => { d.mode = 'B'; })}
                className={`flex-1 py-1 px-2 rounded text-2xs font-medium transition-all ${
                  scenario.mode === 'B'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mode B: Organic Baseline + Paid Funnel
              </button>
            </div>

            {scenario.mode === 'A' ? (
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-2xs font-semibold text-slate-700">
                      Monthly Mature Target Volume
                    </label>
                    {renderBadge(
                      scenario.commercialA.level.kind,
                      scenario.commercialA.level.source,
                      'Monthly Mature Target Volume',
                      scenario.commercialA.level.value,
                      'cans/month'
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      key="commercial-a-level-input"
                      type="number"
                      min={1000}
                      step={500}
                      value={scenario.commercialA?.level?.value ?? 0}
                      onChange={e => updateScenarioField(d => {
                        if (d.commercialA?.level) {
                          d.commercialA.level.value = Number(e.target.value) || 0;
                        }
                      })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-900"
                    />
                    <span className="text-2xs text-slate-500 shrink-0 font-medium">cans/month</span>
                  </div>
                </div>

                {/* Channel Mix Ratios */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-2xs font-semibold text-slate-700">
                      Channel Sales Allocation
                    </label>
                    <span className="text-3xs text-emerald-700 font-bold">
                      Sum: {Math.round((Object.values(scenario.commercialA.mix) as Array<{ value: number }>).reduce((a, b) => a + (b?.value ?? 0), 0) * 100)}%
                    </span>
                  </div>

                  <div className="space-y-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                    {(Object.entries(scenario.commercialA.mix) as Array<[string, { value: number }]>).map(([chName, chData]) => (
                      <div key={chName} className="flex items-center justify-between gap-2">
                        <span className="text-2xs text-slate-700 font-medium">{chName}</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            key={`mix-input-${chName}`}
                            type="number"
                            min={0}
                            max={100}
                            step={5}
                            value={chData?.value !== undefined ? Math.round(chData.value * 100) : 0}
                            onChange={e => {
                              const newPct = Number(e.target.value) / 100;
                              updateScenarioField(d => {
                                if (d.commercialA?.mix?.[chName]) {
                                  d.commercialA.mix[chName].value = Math.max(0, Math.min(1, newPct));
                                }
                              });
                            }}
                            className="w-14 px-1.5 py-1 border border-slate-300 rounded text-center text-xs font-semibold"
                          />
                          <span className="text-2xs text-slate-500">%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-2xs font-semibold text-slate-700 mb-1">
                    Monthly Organic Baseline (excluding paid)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      key="commercial-b-organic-input"
                      type="number"
                      min={0}
                      step={250}
                      value={scenario.commercialB?.organicBaseMonthly?.value ?? 1500}
                      onChange={e => {
                        const val = Number(e.target.value) || 0;
                        updateScenarioField(d => {
                          if (!d.commercialB) {
                            d.commercialB = {
                              organicBaseMonthly: {
                                value: val,
                                unit: 'cans/month',
                                kind: 'ASSUMPTION',
                                source: 'Estimated monthly organic baseline',
                                accepted: true
                              },
                              marketingChannels: {},
                              channelSalesAllocation: {
                                'DTC Online': 0.6,
                                'Retail/Grocery': 0.4
                              }
                            };
                          } else {
                            d.commercialB.organicBaseMonthly.value = val;
                          }
                        });
                      }}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold"
                    />
                    <span className="text-2xs text-slate-500 shrink-0">cans/month</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-50 text-blue-800 rounded text-2xs">
                  In Mode B, incremental volume is calculated directly from marketing spend divided by channel CAC with an incrementality factor.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Pricing & Channel Terms */}
      <div>
        <button
          onClick={() => toggleSection('pricing')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-slate-800 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>3. Retail Pricing & Channel Terms</span>
          </div>
          {openSections.pricing ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {openSections.pricing && (
          <div className="p-3.5 pt-1 space-y-3 bg-white">
            {(Object.entries(scenario.economics.channels) as Array<[string, ChannelTerms]>).map(([chName, terms]) => (
              <div key={chName} className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-semibold text-slate-900 text-xs">{chName}</span>
                  {renderBadge(terms.price.kind, terms.price.source, `Price ${chName}`, terms.price.value, 'EUR/can')}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-3xs font-medium text-slate-500 mb-0.5">
                      Gross Shelf Price (incl. VAT)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step={0.10}
                        min={0.5}
                        value={terms.price?.value ?? 0}
                        onChange={e => updateScenarioField(d => {
                          if (d.economics.channels[chName]?.price) {
                            d.economics.channels[chName].price.value = Number(e.target.value) || 0;
                          }
                        })}
                        className="w-full px-2 py-1 border border-slate-300 rounded font-semibold text-xs text-slate-900"
                      />
                      <span className="text-3xs text-slate-500">€</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-3xs font-medium text-slate-500 mb-0.5">
                      Unit COGS (Can + Formula)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        step={0.01}
                        min={0.1}
                        value={terms.cogs?.value ?? 0}
                        onChange={e => updateScenarioField(d => {
                          if (d.economics.channels[chName]?.cogs) {
                            d.economics.channels[chName].cogs.value = Number(e.target.value) || 0;
                          }
                        })}
                        className="w-full px-2 py-1 border border-slate-300 rounded font-semibold text-xs text-slate-900"
                      />
                      <span className="text-3xs text-slate-500">€</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1 text-3xs text-slate-600">
                  <div>
                    <span className="block text-slate-400">Retailer Margin:</span>
                    <input
                      type="number"
                      step={1}
                      value={terms.retailerCut?.value !== undefined ? Math.round(terms.retailerCut.value * 100) : 0}
                      onChange={e => updateScenarioField(d => {
                        if (d.economics.channels[chName]?.retailerCut) {
                          d.economics.channels[chName].retailerCut.value = (Number(e.target.value) || 0) / 100;
                        }
                      })}
                      className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-center text-2xs font-semibold"
                    />
                    <span className="text-center block text-slate-400">%</span>
                  </div>

                  <div>
                    <span className="block text-slate-400">Fulfillment/3PL:</span>
                    <input
                      type="number"
                      step={0.05}
                      value={terms.fulfillment?.value ?? 0}
                      onChange={e => updateScenarioField(d => {
                        if (d.economics.channels[chName]?.fulfillment) {
                          d.economics.channels[chName].fulfillment.value = Number(e.target.value) || 0;
                        }
                      })}
                      className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-center text-2xs font-semibold"
                    />
                    <span className="text-center block text-slate-400">€/can</span>
                  </div>

                  <div>
                    <span className="block text-slate-400">Payment Processing:</span>
                    <input
                      type="number"
                      step={0.1}
                      value={terms.paymentFee?.value !== undefined ? (terms.paymentFee.value * 100).toFixed(1) : '0'}
                      onChange={e => updateScenarioField(d => {
                        if (d.economics.channels[chName]?.paymentFee) {
                          d.economics.channels[chName].paymentFee.value = (Number(e.target.value) || 0) / 100;
                        }
                      })}
                      className="w-full px-1.5 py-0.5 border border-slate-300 rounded text-center text-2xs font-semibold"
                    />
                    <span className="text-center block text-slate-400">%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Tax Conventions & Fixed Costs */}
      <div>
        <button
          onClick={() => toggleSection('economics')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-slate-800 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <DollarSign className="w-3.5 h-3.5 text-amber-600" />
            <span>4. Fixed Costs & German Legal Conventions</span>
          </div>
          {openSections.economics ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {openSections.economics && (
          <div className="p-3.5 pt-1 space-y-2.5 bg-white">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-3xs font-medium text-slate-600 mb-0.5">
                  German VAT (MwSt)
                </label>
                <div className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-800 border border-slate-200">
                  19.0% (Statutory DE)
                </div>
              </div>

              <div>
                <label className="block text-3xs font-medium text-slate-600 mb-0.5">
                  DPG Deposit (Pfand)
                </label>
                <div className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-800 border border-slate-200">
                  €0.25 / can
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-3xs font-medium text-slate-600">
                  Monthly Allocated DE Fixed Overhead
                </label>
                {renderBadge(
                  scenario.economics.fixedCostsMonthly.kind,
                  scenario.economics.fixedCostsMonthly.source,
                  'Monthly Fixed Overhead',
                  scenario.economics.fixedCostsMonthly.value,
                  'EUR/month'
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step={500}
                  value={scenario.economics.fixedCostsMonthly?.value ?? 0}
                  onChange={e => updateScenarioField(d => {
                    if (d.economics.fixedCostsMonthly) {
                      d.economics.fixedCostsMonthly.value = Number(e.target.value) || 0;
                    }
                  })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-900"
                />
                <span className="text-2xs text-slate-500">€/month</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-0.5">
                <label className="text-3xs font-medium text-slate-600">
                  Upfront Pre-launch Investment
                </label>
                {renderBadge(
                  scenario.economics.prelaunchInvestment.kind,
                  scenario.economics.prelaunchInvestment.source,
                  'Pre-launch Investment',
                  scenario.economics.prelaunchInvestment.value,
                  'EUR'
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step={2000}
                  value={scenario.economics.prelaunchInvestment?.value ?? 0}
                  onChange={e => updateScenarioField(d => {
                    if (d.economics.prelaunchInvestment) {
                      d.economics.prelaunchInvestment.value = Number(e.target.value) || 0;
                    }
                  })}
                  className="w-full px-2 py-1 border border-slate-300 rounded text-xs font-semibold text-slate-900"
                />
                <span className="text-2xs text-slate-500">€</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Marketing Budgets */}
      <div>
        <button
          onClick={() => toggleSection('marketing')}
          className="w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-slate-800 hover:bg-slate-50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Megaphone className="w-3.5 h-3.5 text-purple-600" />
            <span>5. Monthly Marketing Budgets</span>
          </div>
          {openSections.marketing ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {openSections.marketing && (
          <div className="p-3.5 pt-1 space-y-2 bg-white">
            <p className="text-3xs text-slate-500 leading-tight">
              Acquisition and awareness spending by program line (Months 1 to 12).
            </p>
            <div className="space-y-2 pt-1">
              {(Object.entries(scenario.marketingBudgets) as Array<[string, number[]]>).map(([channel, budgetArr]) => {
                const totalChannelSpend = budgetArr.reduce((a, b) => a + b, 0);
                return (
                  <div key={channel} className="p-2 bg-slate-50 rounded border border-slate-200">
                    <div className="flex items-center justify-between text-2xs font-medium text-slate-800 mb-1">
                      <span>{channel}</span>
                      <span className="font-bold text-purple-700">€{totalChannelSpend.toLocaleString('en-US')}/yr</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-3xs text-slate-500">M1 (Launch Month):</span>
                      <input
                        type="number"
                        step={500}
                        value={budgetArr?.[0] ?? 0}
                        onChange={e => {
                          const val = Number(e.target.value) || 0;
                          updateScenarioField(d => {
                            if (d.marketingBudgets[channel]) {
                              d.marketingBudgets[channel][0] = val;
                            }
                          });
                        }}
                        className="w-20 px-1.5 py-0.5 border border-slate-300 rounded text-center text-xs font-semibold"
                      />
                      <span className="text-3xs text-slate-500">€</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
