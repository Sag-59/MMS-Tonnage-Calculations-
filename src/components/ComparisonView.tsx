import React from 'react';
import { MMSInputs, TablePresetId } from '../types';
import { calculateMmsTonnage, TABLE_PRESETS } from '../utils/mmsCalculator';
import { BarChart3, CheckCircle2, TrendingDown, ArrowRight } from 'lucide-react';

interface ComparisonViewProps {
  currentInputs: MMSInputs;
  onSelectPreset: (presetId: TablePresetId) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ currentInputs, onSelectPreset }) => {
  const comparisonPresets: TablePresetId[] = ['2Px13', '2Px14', '2Px26', '2Px28'];

  const results = comparisonPresets.map((presetId) => {
    const preset = TABLE_PRESETS.find((p) => p.id === presetId)!;
    const testInputs: MMSInputs = {
      ...currentInputs,
      tablePreset: presetId,
    };
    const calc = calculateMmsTonnage(testInputs);
    return {
      presetId,
      name: preset.name,
      rows: preset.rows,
      cols: preset.columns,
      calc,
      isSelected: currentInputs.tablePreset === presetId,
    };
  });

  // Find lowest tonnage to show savings
  const minTonnage = Math.min(...results.map((r) => r.calc.tonnagePerMwp));

  return (
    <div id="table-comparison-container" className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-slate-100 text-base">Table Configuration Matrix Comparison</h3>
        </div>
        <p className="text-xs text-slate-400">
          Evaluated at <span className="text-amber-400 font-mono">{currentInputs.windSpeed} {currentInputs.windSpeedUnit}</span> wind • <span className="text-amber-400 font-mono">{currentInputs.tiltAngle}°</span> tilt • <span className="text-amber-400 font-mono">{currentInputs.groundClearance}m</span> GC
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        {results.map((item) => {
          const deltaFromMin = item.calc.tonnagePerMwp - minTonnage;
          const isOptimal = deltaFromMin === 0;

          return (
            <div
              key={item.presetId}
              className={`rounded-xl p-4 transition-all border flex flex-col justify-between ${
                item.isSelected
                  ? 'bg-slate-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-slate-200">
                    {item.presetId}
                  </span>
                  {item.isSelected && (
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Selected
                    </span>
                  )}
                  {!item.isSelected && isOptimal && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40 font-medium flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Lowest Steel
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 mb-3">
                  {item.calc.totalModulesPerTable} Modules ({item.rows}P x {item.cols}) • {item.calc.tableCapacityKwp} kWp
                </div>

                {/* Primary Metric */}
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800/80 mb-3">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">MMS Steel Tonnage</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-bold font-mono text-emerald-400">
                      {item.calc.tonnagePerMwp.toFixed(2)}
                    </span>
                    <span className="text-xs font-medium text-slate-300">MT / MWp</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    {item.calc.weightPerModuleKg.toFixed(1)} kg steel/module
                  </div>
                </div>

                {/* Quick specs */}
                <div className="space-y-1 text-[11px] text-slate-300 font-mono mb-4 border-t border-slate-800/60 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Table Width:</span>
                    <span>{item.calc.tableWidthM.toFixed(1)} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Rafter Sets:</span>
                    <span>{item.calc.numberOfRafters} pairs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Tables / MWp:</span>
                    <span>{item.calc.tablesPerMwp.toFixed(1)} tables</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Table Weight:</span>
                    <span>{item.calc.totalTableWeightKg.toLocaleString()} kg</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectPreset(item.presetId)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  item.isSelected
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {item.isSelected ? 'Currently Active' : 'Switch to this Table'}
                {!item.isSelected && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
        <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-200">Engineering Insight:</strong> Longer tables like <span className="text-amber-400 font-mono">2Px26</span> and <span className="text-amber-400 font-mono">2Px28</span> share internal post foundations and reduce end-overhang steel ratio, typically saving <span className="text-emerald-400 font-mono">1.2 – 2.4 MT/MWp</span> (~5% to 8% total steel tonnage) compared to shorter tables like 2Px13/2Px14 on flat terrain.
        </p>
      </div>
    </div>
  );
};
