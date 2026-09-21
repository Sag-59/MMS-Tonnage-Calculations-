import React from 'react';
import { CalculationResult, MMSInputs } from '../types';
import { Layers, FileText, Info } from 'lucide-react';

interface BomBreakdownProps {
  result: CalculationResult;
  inputs: MMSInputs;
}

export const BomBreakdown: React.FC<BomBreakdownProps> = ({ result, inputs }) => {
  const categoryColors: Record<string, { bg: string; text: string; bar: string }> = {
    Purlin: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
    Rafter: { bg: 'bg-sky-500/10', text: 'text-sky-400', bar: 'bg-sky-500' },
    Column: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
    Bracing: { bg: 'bg-purple-500/10', text: 'text-purple-400', bar: 'bg-purple-500' },
    Hardware: { bg: 'bg-slate-500/10', text: 'text-slate-300', bar: 'bg-slate-400' },
  };

  return (
    <div id="bom-breakdown-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-100 text-base">Bill of Materials (BOM) & Steel Weight Breakdown</h3>
        </div>
        <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono border border-slate-700">
          Steel Grade: {inputs.steelGrade}
        </span>
      </div>

      {/* Proportional distribution bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span>Component Weight Distribution</span>
          <span className="font-mono text-slate-200">100% = {result.tonnagePerMwp.toFixed(2)} MT/MWp</span>
        </div>
        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
          {result.bom.map((item) => (
            <div
              key={item.id}
              className={`${categoryColors[item.category]?.bar || 'bg-slate-500'} transition-all duration-300`}
              style={{ width: `${item.percentage}%` }}
              title={`${item.name}: ${item.percentage}% (${item.tonnagePerMwp.toFixed(2)} MT/MWp)`}
            />
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
          {result.bom.map((item) => (
            <div key={item.id} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${categoryColors[item.category]?.bar || 'bg-slate-400'}`} />
              <span className="text-slate-300">{item.name.split('(')[0].trim()}:</span>
              <span className="font-mono font-medium text-slate-100">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table of BOM items */}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium">
              <th className="py-2.5 px-3">Structural Member</th>
              <th className="py-2.5 px-3">Engineered Section</th>
              <th className="py-2.5 px-3 text-right">Table Qty</th>
              <th className="py-2.5 px-3 text-right">Unit Wt (kg/m)</th>
              <th className="py-2.5 px-3 text-right">Table Wt (kg)</th>
              <th className="py-2.5 px-3 text-right font-semibold text-emerald-400">Tonnage (MT/MWp)</th>
              <th className="py-2.5 px-3 text-right">Share (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {result.bom.map((item) => {
              const color = categoryColors[item.category] || { bg: 'bg-slate-800', text: 'text-slate-300' };
              return (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-sans">
                    <div className="font-medium text-slate-200">{item.name}</div>
                    <div className="text-[10px] text-slate-500">{item.notes}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[11px]">
                      {item.section}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{item.count}</td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {item.weightPerUnitKg > 0 ? `${item.weightPerUnitKg.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-200 font-medium">{item.totalWeightKg.toLocaleString()} kg</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    {item.tonnagePerMwp.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400 font-medium">{item.percentage.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-700 font-sans font-semibold text-slate-100 bg-slate-800/30">
              <td className="py-3 px-3">Total MMS Structure</td>
              <td className="py-3 px-3 font-mono text-[11px] text-slate-400">Yield: {inputs.steelGrade}</td>
              <td className="py-3 px-3 text-right font-mono">{result.totalModulesPerTable} mods</td>
              <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
              <td className="py-3 px-3 text-right font-mono text-amber-400">{result.totalTableWeightKg.toLocaleString()} kg</td>
              <td className="py-3 px-3 text-right font-mono text-emerald-400 text-sm">{result.tonnagePerMwp.toFixed(2)} MT/MWp</td>
              <td className="py-3 px-3 text-right font-mono text-slate-200">100.0%</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-4 p-3 bg-slate-950/70 rounded-lg border border-slate-800 flex items-start gap-2 text-xs text-slate-400">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p>
          Calculations account for wind suction/downforce via IS 875 (Part 3) / ASCE 7-16 standards with gust factor 0.85. 
          Purlin and rafter weights reflect cold-formed steel sections designed for deflection limit <span className="text-slate-200 font-mono">L/180</span>. 
          Hardware includes anodized AL6005-T5 clamps and grade 8.8 hot-dip galvanized fasteners.
        </p>
      </div>
    </div>
  );
};
