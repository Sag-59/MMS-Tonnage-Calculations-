import React, { useState } from 'react';
import { MMSInputs } from '../types';
import { calculateMmsTonnage, convertWindSpeedToMs, convertWindSpeedFromMs } from '../utils/mmsCalculator';
import { Activity, Wind, Compass, ArrowUpDown } from 'lucide-react';

interface SensitivityCurveProps {
  inputs: MMSInputs;
}

export const SensitivityCurve: React.FC<SensitivityCurveProps> = ({ inputs }) => {
  const [param, setParam] = useState<'wind' | 'tilt' | 'clearance'>('wind');

  // Compute sensitivity points
  let points: { label: string; xVal: number; tonnage: number; isCurrent: boolean }[] = [];

  if (param === 'wind') {
    // Range 30 to 55 m/s in steps of 3 m/s
    const currentMs = convertWindSpeedToMs(inputs.windSpeed, inputs.windSpeedUnit);
    const msSteps = [30, 33, 36, 39, 42, 45, 47, 50, 53, 55];

    points = msSteps.map((speedMs) => {
      const displaySpeed = Math.round(convertWindSpeedFromMs(speedMs, inputs.windSpeedUnit));
      const testInputs: MMSInputs = {
        ...inputs,
        windSpeed: speedMs,
        windSpeedUnit: 'm/s',
      };
      const res = calculateMmsTonnage(testInputs);
      const isCurrent = Math.abs(currentMs - speedMs) < 1.6;
      return {
        label: `${displaySpeed} ${inputs.windSpeedUnit}`,
        xVal: displaySpeed,
        tonnage: res.tonnagePerMwp,
        isCurrent,
      };
    });
  } else if (param === 'tilt') {
    // Range 5 to 35 deg in steps of 5
    const tiltSteps = [5, 10, 15, 20, 25, 30, 35];
    points = tiltSteps.map((tilt) => {
      const testInputs: MMSInputs = {
        ...inputs,
        tiltAngle: tilt,
      };
      const res = calculateMmsTonnage(testInputs);
      const isCurrent = Math.abs(inputs.tiltAngle - tilt) <= 2.5;
      return {
        label: `${tilt}°`,
        xVal: tilt,
        tonnage: res.tonnagePerMwp,
        isCurrent,
      };
    });
  } else {
    // Ground clearance 0.4m to 1.8m in steps of 0.2m
    const gcSteps = [0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8];
    points = gcSteps.map((gc) => {
      const testInputs: MMSInputs = {
        ...inputs,
        groundClearance: gc,
      };
      const res = calculateMmsTonnage(testInputs);
      const isCurrent = Math.abs(inputs.groundClearance - gc) <= 0.1;
      return {
        label: `${gc.toFixed(1)}m`,
        xVal: gc,
        tonnage: res.tonnagePerMwp,
        isCurrent,
      };
    });
  }

  const tonnages = points.map((p) => p.tonnage);
  const minTonnage = Math.min(...tonnages);
  const maxTonnage = Math.max(...tonnages);
  const range = maxTonnage - minTonnage || 1;

  return (
    <div id="sensitivity-analysis-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-slate-100 text-base">Structural Sensitivity Analysis</h3>
        </div>

        {/* Parameter Selector */}
        <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setParam('wind')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              param === 'wind' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Wind className="w-3.5 h-3.5" /> Wind Speed
          </button>
          <button
            onClick={() => setParam('tilt')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              param === 'tilt' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> Tilt Angle
          </button>
          <button
            onClick={() => setParam('clearance')}
            className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
              param === 'clearance' ? 'bg-cyan-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" /> Ground Clearance
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>
            Effect of varying <strong className="text-slate-200 uppercase">{param}</strong> on MMS Tonnage (MT / MWp)
          </span>
          <span className="font-mono text-emerald-400">
            Min: {minTonnage.toFixed(1)} MT • Max: {maxTonnage.toFixed(1)} MT
          </span>
        </div>

        {/* Responsive CSS Bar Chart */}
        <div className="h-44 flex items-end gap-2 pt-6 pb-2 px-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
          {points.map((pt, idx) => {
            // calculate height percentage (minimum 15% so bar is visible)
            const heightPct = Math.max(18, ((pt.tonnage - minTonnage * 0.7) / (maxTonnage - minTonnage * 0.7)) * 100);

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-slate-100 text-[11px] font-mono px-2 py-0.5 rounded shadow-md border border-slate-700 pointer-events-none transition-opacity whitespace-nowrap z-10">
                  {pt.label}: {pt.tonnage.toFixed(2)} MT/MWp
                </div>

                {/* Tonnage value above bar */}
                <span className={`text-[10px] font-mono mb-1 ${pt.isCurrent ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                  {pt.tonnage.toFixed(1)}
                </span>

                {/* The vertical bar */}
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    pt.isCurrent
                      ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-sm shadow-amber-500/30 ring-1 ring-amber-400'
                      : 'bg-gradient-to-t from-cyan-900 to-cyan-600 hover:from-cyan-800 hover:to-cyan-500'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />

                {/* X Axis Label */}
                <span className={`text-[10px] mt-1.5 truncate max-w-full font-mono ${pt.isCurrent ? 'text-amber-300 font-semibold' : 'text-slate-400'}`}>
                  {pt.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-amber-400 rounded-xs"></span> Active Design Point
          </span>
          <span>Higher values require heavier column thickness & additional bracing</span>
        </div>
      </div>
    </div>
  );
};
