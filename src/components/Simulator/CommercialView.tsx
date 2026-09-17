import React from 'react';
import { EvaluationResult, Scenario } from '../../types/simulator';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { ShoppingBag, TrendingUp, Package, Calendar } from 'lucide-react';

interface CommercialViewProps {
  evaluation: EvaluationResult;
  scenario: Scenario;
  horizon: 3 | 6 | 12;
}

export const CommercialView: React.FC<CommercialViewProps> = ({
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

  const chartData = displayMonths.map(m => ({
    name: `M${m.month}`,
    date: m.monthName.split(' ')[0],
    Total: m.volumeTotal,
    DTC: m.volumeByChannel['DTC Online'] || 0,
    Retail: m.volumeByChannel['Retail/Grocery'] || 0
  }));

  const totalDTC = displayMonths.reduce((acc, m) => acc + (m.volumeByChannel['DTC Online'] || 0), 0);
  const totalRetail = displayMonths.reduce((acc, m) => acc + (m.volumeByChannel['Retail/Grocery'] || 0), 0);
  const dtcShare = currentCheckpoint.volumeTotal > 0 ? (totalDTC / currentCheckpoint.volumeTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-medium uppercase tracking-wider mb-1">
            <Package className="w-3.5 h-3.5 text-emerald-700" />
            <span>Total Volume ({horizon}m)</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {currentCheckpoint.volumeTotal.toLocaleString('en-US')}
          </div>
          <p className="text-3xs text-slate-500 mt-0.5">Cumulative sold cans</p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-medium uppercase tracking-wider mb-1">
            <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
            <span>DTC Online Volume</span>
          </div>
          <div className="text-xl font-bold text-blue-700">
            {totalDTC.toLocaleString('en-US')}
          </div>
          <p className="text-3xs text-slate-500 mt-0.5">{dtcShare.toFixed(1)}% of total channel mix</p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-medium uppercase tracking-wider mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
            <span>Retail / Grocery Volume</span>
          </div>
          <div className="text-xl font-bold text-purple-700">
            {totalRetail.toLocaleString('en-US')}
          </div>
          <p className="text-3xs text-slate-500 mt-0.5">{(100 - dtcShare).toFixed(1)}% of total channel mix</p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-2xs font-medium uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>Monthly Run-rate</span>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {Math.round(currentCheckpoint.volumeTotal / horizon).toLocaleString('en-US')}
          </div>
          <p className="text-3xs text-slate-500 mt-0.5">Cans per month</p>
        </div>
      </div>

      {/* Main Chart: Monthly Volume by Channel */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Monthly Sales Trajectory by Channel
            </h3>
            <p className="text-2xs text-slate-500">
              Conditional volume trajectory (cans) factoring ramp-up curves and summer beverage seasonality.
            </p>
          </div>
          <span className="text-2xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
            Horizon: {horizon} months
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                formatter={(value: any) => [`${Number(value).toLocaleString('en-US')} cans`, '']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Bar dataKey="DTC" name="DTC Online" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Retail" name="Retail / Grocery" fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-900">
            Monthly Volume Breakdown (Cans)
          </h4>
          <span className="text-3xs text-slate-500 font-mono">12 calendar periods</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200 text-2xs uppercase">
              <tr>
                <th className="py-2 px-3 font-semibold">Period</th>
                <th className="py-2 px-3 font-semibold">Date</th>
                <th className="py-2 px-3 font-semibold text-right">DTC Online</th>
                <th className="py-2 px-3 font-semibold text-right">Retail/Grocery</th>
                <th className="py-2 px-3 font-semibold text-right font-bold text-slate-800">Monthly Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayMonths.map(m => (
                <tr key={m.month} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-3 font-medium text-slate-900">Month {m.month}</td>
                  <td className="py-2 px-3 text-slate-500">{m.calendarDate}</td>
                  <td className="py-2 px-3 text-right font-mono text-blue-700">
                    {(m.volumeByChannel['DTC Online'] || 0).toLocaleString('en-US')}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-purple-700">
                    {(m.volumeByChannel['Retail/Grocery'] || 0).toLocaleString('en-US')}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {m.volumeTotal.toLocaleString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
