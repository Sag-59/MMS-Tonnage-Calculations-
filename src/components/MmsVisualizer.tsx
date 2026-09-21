import React, { useState } from 'react';
import { CalculationResult, MMSInputs, StructureType } from '../types';
import { Layers, Wind, CheckCircle2 } from 'lucide-react';

interface MmsVisualizerProps {
  inputs: MMSInputs;
  result: CalculationResult;
  onStructureTypeChange?: (type: StructureType) => void;
}

export const MmsVisualizer: React.FC<MmsVisualizerProps> = ({
  inputs,
  result,
  onStructureTypeChange,
}) => {
  const [viewMode, setViewMode] = useState<'crossSection' | 'tablePlan'>('crossSection');
  const [windDirection, setWindDirection] = useState<'front' | 'rear'>('rear');

  const tiltRad = (inputs.tiltAngle * Math.PI) / 180;
  const isSingleCol = (inputs.structureType || 'single_column') === 'single_column';
  
  // Cross Section SVG geometry
  // Canvas width 760, height 400
  const groundY = 320;
  const scale = 50; // pixels per meter
  
  // Heights & Coordinates
  const gcPx = Math.max(25, inputs.groundClearance * scale);
  const slantTotalPx = result.tableSlantLengthM * scale;
  
  // Single Column Configuration Coordinates
  // Place single post at ~42% along the rafter chord
  const singleColX = 330;
  const singleColHeightPx = Math.max(35, result.columnHeightM * scale);
  const singleColTopY = groundY - singleColHeightPx;
  
  // Rafter origin based on single column
  const rafterBottomDistPx = 0.42 * slantTotalPx;
  const rafterStartX = singleColX - rafterBottomDistPx * Math.cos(tiltRad);
  const rafterStartY = singleColTopY + rafterBottomDistPx * Math.sin(tiltRad);
  const rafterEndX = rafterStartX + slantTotalPx * Math.cos(tiltRad);
  const rafterEndY = rafterStartY - slantTotalPx * Math.sin(tiltRad);

  // Front Bracing Attachment points:
  // On rafter: near lower purlin (~0.12 of slant)
  const frontBraceRafterX = rafterStartX + 0.12 * slantTotalPx * Math.cos(tiltRad);
  const frontBraceRafterY = rafterStartY - 0.12 * slantTotalPx * Math.sin(tiltRad);
  // On column: lower-mid post height
  const frontBraceColX = singleColX;
  const frontBraceColY = groundY - singleColHeightPx * 0.38;

  // Back Bracing Attachment points:
  // On rafter: near upper purlin (~0.85 of slant)
  const backBraceRafterX = rafterStartX + 0.85 * slantTotalPx * Math.cos(tiltRad);
  const backBraceRafterY = rafterStartY - 0.85 * slantTotalPx * Math.sin(tiltRad);
  // On column: upper post height
  const backBraceColX = singleColX;
  const backBraceColY = groundY - singleColHeightPx * 0.72;

  // Dual Column Coordinates (Alternative mode)
  const frontPostX = 220;
  const frontPostTopY = groundY - gcPx;
  const spanX = Math.max(70, result.postSpanM * Math.cos(tiltRad) * scale);
  const rearPostX = frontPostX + spanX;
  const rearPostTopY = groundY - Math.max(40, result.rearPostHeightM * scale);

  // Pile embedment below ground
  const pileDepthPx = 52;

  return (
    <div id="mms-visualizer-container" className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-base">
              Structural Schematic & Elevation
            </h3>
            <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {isSingleCol ? 'Single Column (1 Col + 2 Braces)' : 'Dual Column (2 Posts)'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSingleCol
              ? 'Company Standard: 1 Column Post, 1 Front Bracing Strut, 1 Back Bracing Strut, Rafter & Purlins'
              : '2-Column Portal Frame: Front Post, Rear Post, Rafter & Bracings'}
          </p>
        </div>

        {/* View Controls & Structural Topology Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {onStructureTypeChange && (
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => onStructureTypeChange('single_column')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  isSingleCol
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Your company standard: 1 column + 1 front brace + 1 back brace"
              >
                1-Column Standard
              </button>
              <button
                type="button"
                onClick={() => onStructureTypeChange('dual_column')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  !isSingleCol
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Traditional 2-column post system"
              >
                2-Column
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
            <button
              id="view-cross-section-btn"
              onClick={() => setViewMode('crossSection')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'crossSection'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Elevation
            </button>
            <button
              id="view-table-plan-btn"
              onClick={() => setViewMode('tablePlan')}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'tablePlan'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Matrix Plan ({result.totalModulesPerTable} Mod)
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'crossSection' ? (
        <div className="relative mt-3 flex-1 flex flex-col items-center justify-center min-h-[370px]">
          {/* Controls overlay for wind simulation */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-cyan-400" /> Aerodynamic Load:
            </span>
            <button
              type="button"
              onClick={() => setWindDirection('rear')}
              className={`px-2 py-0.5 rounded transition ${
                windDirection === 'rear' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400'
              }`}
            >
              Rear Uplift ({result.windUpliftPressureKpa.toFixed(2)} kN/m²)
            </button>
            <button
              type="button"
              onClick={() => setWindDirection('front')}
              className={`px-2 py-0.5 rounded transition ${
                windDirection === 'front' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400'
              }`}
            >
              Front Downforce ({result.designWindPressureKpa.toFixed(2)} kN/m²)
            </button>
          </div>

          <svg
            viewBox="0 0 760 390"
            className="w-full h-auto max-h-[380px] select-none"
            aria-label="MMS Structural Cross-Section Diagram"
          >
            <defs>
              <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#334155" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>

              <pattern id="soilPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <line x1="0" y1="20" x2="20" y2="0" stroke="#475569" strokeWidth="1" strokeOpacity="0.3" />
              </pattern>

              <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
              </marker>

              <marker id="arrowUplift" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
              </marker>
            </defs>

            {/* Soil / Ground Level */}
            <rect x="20" y={groundY} width="720" height="65" fill="url(#groundGrad)" rx="2" />
            <rect x="20" y={groundY} width="720" height="65" fill="url(#soilPattern)" />
            <line x1="10" y1={groundY} x2="750" y2={groundY} stroke="#94a3b8" strokeWidth="2" strokeDasharray="6 3" />
            <text x="35" y={groundY + 22} fill="#94a3b8" fontSize="11" fontWeight="500">
              Natural Ground Level (NGL)
            </text>

            {isSingleCol ? (
              /* ========================================================== */
              /* SINGLE COLUMN SYSTEM WITH 1 FRONT BRACING & 1 BACK BRACING */
              /* ========================================================== */
              <g id="single-column-assembly">
                {/* Embedded Foundation Pile below ground */}
                <rect
                  x={singleColX - 6}
                  y={groundY}
                  width="12"
                  height={pileDepthPx}
                  fill="#64748b"
                  stroke="#334155"
                  strokeWidth="1.5"
                />
                <line x1={singleColX - 12} y1={groundY + 12} x2={singleColX + 12} y2={groundY + 12} stroke="#cbd5e1" strokeWidth="2" />
                <text x={singleColX + 16} y={groundY + 36} fill="#94a3b8" fontSize="10">
                  Rammed Steel Pile (1.8m embedment)
                </text>

                {/* Single Central Post (Column) */}
                <rect
                  x={singleColX - 5}
                  y={singleColTopY}
                  width="10"
                  height={groundY - singleColTopY}
                  fill="#e2e8f0"
                  stroke="#475569"
                  strokeWidth="1.5"
                  rx="1"
                />

                {/* Column Base Plate / Ground Connection */}
                <rect x={singleColX - 10} y={groundY - 4} width="20" height="5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />

                {/* 1 FRONT BRACING: Knee strut from column to lower rafter */}
                <line
                  x1={frontBraceColX}
                  y1={frontBraceColY}
                  x2={frontBraceRafterX}
                  y2={frontBraceRafterY}
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Connection pins */}
                <circle cx={frontBraceColX} cy={frontBraceColY} r="3" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
                <circle cx={frontBraceRafterX} cy={frontBraceRafterY} r="3" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />

                {/* 1 BACK BRACING: Knee strut from column to upper rafter */}
                <line
                  x1={backBraceColX}
                  y1={backBraceColY}
                  x2={backBraceRafterX}
                  y2={backBraceRafterY}
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                {/* Connection pins */}
                <circle cx={backBraceColX} cy={backBraceColY} r="3" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />
                <circle cx={backBraceRafterX} cy={backBraceRafterY} r="3" fill="#ffffff" stroke="#d97706" strokeWidth="1.5" />

                {/* Annotations / Callouts for user clarity */}
                {/* Single Column Annotation */}
                <path
                  d={`M ${singleColX + 6} ${singleColTopY + 30} L ${singleColX + 50} ${singleColTopY + 30}`}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text x={singleColX + 55} y={singleColTopY + 34} fill="#f1f5f9" fontSize="11" fontWeight="600">
                  1 Single Column Post (H = {result.columnHeightM.toFixed(2)}m)
                </text>

                {/* Front Bracing Annotation */}
                <path
                  d={`M ${(frontBraceColX + frontBraceRafterX) / 2} ${(frontBraceColY + frontBraceRafterY) / 2} L ${(frontBraceColX + frontBraceRafterX) / 2 - 30} ${(frontBraceColY + frontBraceRafterY) / 2 + 30}`}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={(frontBraceColX + frontBraceRafterX) / 2 - 130}
                  y={(frontBraceColY + frontBraceRafterY) / 2 + 45}
                  fill="#fbbf24"
                  fontSize="11"
                  fontWeight="600"
                >
                  1 Front Bracing Strut ({result.frontBraceLengthM.toFixed(2)}m)
                </text>

                {/* Back Bracing Annotation */}
                <path
                  d={`M ${(backBraceColX + backBraceRafterX) / 2} ${(backBraceColY + backBraceRafterY) / 2} L ${(backBraceColX + backBraceRafterX) / 2 + 30} ${(backBraceColY + backBraceRafterY) / 2 + 30}`}
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={(backBraceColX + backBraceRafterX) / 2 + 35}
                  y={(backBraceColY + backBraceRafterY) / 2 + 34}
                  fill="#fbbf24"
                  fontSize="11"
                  fontWeight="600"
                >
                  1 Back Bracing Strut ({result.backBraceLengthM.toFixed(2)}m)
                </text>

                {/* Ground Clearance dimension arrow */}
                <line x1={rafterStartX - 25} y1={groundY} x2={rafterStartX - 25} y2={rafterStartY} stroke="#94a3b8" strokeWidth="1.2" />
                <line x1={rafterStartX - 32} y1={groundY} x2={rafterStartX - 18} y2={groundY} stroke="#94a3b8" strokeWidth="1.2" />
                <line x1={rafterStartX - 32} y1={rafterStartY} x2={rafterStartX - 18} y2={rafterStartY} stroke="#94a3b8" strokeWidth="1.2" />
                <text x={rafterStartX - 95} y={(groundY + rafterStartY) / 2 + 4} fill="#e2e8f0" fontSize="11" fontWeight="600">
                  GC: {inputs.groundClearance.toFixed(2)}m
                </text>
              </g>
            ) : (
              /* DUAL COLUMN ASSEMBLY (Alternative mode) */
              <g id="dual-column-assembly">
                <rect x={frontPostX - 5} y={groundY} width="10" height={pileDepthPx} fill="#64748b" stroke="#334155" strokeWidth="1.5" />
                <rect x={rearPostX - 6} y={groundY} width="12" height={pileDepthPx} fill="#64748b" stroke="#334155" strokeWidth="1.5" />
                <rect x={frontPostX - 4} y={frontPostTopY} width="8" height={groundY - frontPostTopY} fill="#cbd5e1" stroke="#475569" strokeWidth="1" rx="1" />
                <rect x={rearPostX - 5} y={rearPostTopY} width="10" height={groundY - rearPostTopY} fill="#cbd5e1" stroke="#475569" strokeWidth="1" rx="1" />
                <line x1={frontPostX} y1={frontPostTopY + (groundY - frontPostTopY) * 0.4} x2={rearPostX} y2={rearPostTopY + 10} stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="4 2" />
              </g>
            )}

            {/* Inclined Rafter & Mounted Modules */}
            <g transform={`rotate(${-inputs.tiltAngle}, ${rafterStartX}, ${rafterStartY})`}>
              {/* Rafter Beam */}
              <rect
                x={rafterStartX}
                y={rafterStartY - 8}
                width={slantTotalPx}
                height="9"
                fill="#e2e8f0"
                stroke="#64748b"
                strokeWidth="1.2"
                rx="1"
              />

              {/* 4 Purlin Continuous Rails */}
              {[0.12, 0.42, 0.58, 0.88].map((ratio, idx) => (
                <g key={idx} transform={`translate(${rafterStartX + slantTotalPx * ratio}, ${rafterStartY - 15})`}>
                  <rect x="-4" y="-3" width="8" height="7" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" rx="0.5" />
                </g>
              ))}

              {/* 2P Solar PV Modules */}
              {/* Module 1 (Lower) */}
              <g transform={`translate(${rafterStartX + 6}, ${rafterStartY - 24})`}>
                <rect
                  x="0"
                  y="0"
                  width={slantTotalPx * 0.47}
                  height="7"
                  fill="url(#panelGrad)"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  rx="1"
                />
                <line x1={slantTotalPx * 0.235} y1="0" x2={slantTotalPx * 0.235} y2="7" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
                <rect x="-2" y="-3" width="4" height="4" fill="#cbd5e1" />
                <rect x={slantTotalPx * 0.47 - 2} y="-3" width="4" height="4" fill="#cbd5e1" />
              </g>

              {/* Module 2 (Upper) */}
              <g transform={`translate(${rafterStartX + slantTotalPx * 0.51}, ${rafterStartY - 24})`}>
                <rect
                  x="0"
                  y="0"
                  width={slantTotalPx * 0.47}
                  height="7"
                  fill="url(#panelGrad)"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  rx="1"
                />
                <line x1={slantTotalPx * 0.235} y1="0" x2={slantTotalPx * 0.235} y2="7" stroke="#ffffff" strokeWidth="0.8" opacity="0.6" />
                <rect x={slantTotalPx * 0.47 - 2} y="-3" width="4" height="4" fill="#cbd5e1" />
              </g>
            </g>

            {/* Aerodynamic Wind Force Vectors */}
            {windDirection === 'front' ? (
              <g>
                {[0.2, 0.5, 0.8].map((f, i) => {
                  const arrowX = rafterStartX + slantTotalPx * f * Math.cos(tiltRad) - 25 * Math.sin(tiltRad);
                  const arrowY = rafterStartY - slantTotalPx * f * Math.sin(tiltRad) - 35 * Math.cos(tiltRad);
                  const endX = arrowX + 28 * Math.sin(tiltRad);
                  const endY = arrowY + 28 * Math.cos(tiltRad);
                  return (
                    <line
                      key={i}
                      x1={arrowX}
                      y1={arrowY}
                      x2={endX}
                      y2={endY}
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      markerEnd="url(#arrow)"
                    />
                  );
                })}
              </g>
            ) : (
              <g>
                {[0.25, 0.55, 0.82].map((f, i) => {
                  const startX = rafterStartX + slantTotalPx * f * Math.cos(tiltRad);
                  const startY = rafterStartY - slantTotalPx * f * Math.sin(tiltRad) - 10;
                  const endX = startX - 30 * Math.sin(tiltRad);
                  const endY = startY - 30 * Math.cos(tiltRad);
                  return (
                    <line
                      key={i}
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      markerEnd="url(#arrowUplift)"
                    />
                  );
                })}
              </g>
            )}

            {/* Tilt Angle Arc */}
            <g transform={`translate(${rafterStartX}, ${rafterStartY})`}>
              <line x1="0" y1="0" x2="60" y2="0" stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" />
              <path
                d={`M 45 0 A 45 45 0 0 0 ${45 * Math.cos(tiltRad)} ${-45 * Math.sin(tiltRad)}`}
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
              />
              <text x="50" y="-8" fill="#fbbf24" fontSize="12" fontWeight="700">
                {inputs.tiltAngle}°
              </text>
            </g>

            {/* Top Slant Annotation */}
            <text x="470" y="55" fill="#38bdf8" fontSize="11" fontWeight="600">
              Slant Depth: {result.tableSlantLengthM.toFixed(2)}m (2P)
            </text>
          </svg>

          {/* Bottom legend chips */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-2 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-sky-500 rounded-sm"></span> Solar Modules (2P Portrait)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-amber-500 rounded-sm"></span> Purlins (4 Continuous Rails)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-300 rounded-sm"></span> Single Column Post & Rafter
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-amber-400 rounded-sm"></span> 1 Front Brace + 1 Back Brace
            </span>
          </div>
        </div>
      ) : (
        /* Table Matrix View */
        <div className="mt-4 flex-1 flex flex-col items-center justify-center">
          <div className="w-full bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>
                Plan Matrix: <strong className="text-slate-200">{inputs.tablePreset}</strong> ({result.totalModulesPerTable} Modules = {result.tableCapacityKwp} kWp)
              </span>
              <span>
                Table Width: <strong className="text-slate-200">{result.tableWidthM.toFixed(1)}m</strong> • Rafters: <strong className="text-slate-200">{result.numberOfRafters} Sets ({result.numberOfColumns} Posts)</strong>
              </span>
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[500px] flex flex-col gap-2 p-3 bg-slate-900 rounded-lg border border-slate-800">
                {/* Row 1 */}
                <div className="flex items-center gap-1.5 justify-center">
                  {Array.from({ length: Math.min(28, result.totalModulesPerTable / (inputs.tablePreset === '1Px26' ? 1 : 2)) }).map((_, colIdx) => (
                    <div
                      key={colIdx}
                      className="w-5 sm:w-7 h-12 bg-gradient-to-b from-sky-600 to-sky-800 border border-sky-400/50 rounded-xs flex items-center justify-center text-[8px] text-sky-200 font-mono shadow-xs hover:border-amber-400 transition-colors"
                      title={`Module Row 1, Col ${colIdx + 1}`}
                    >
                      {colIdx + 1}
                    </div>
                  ))}
                </div>

                {/* Row 2 (if 2P) */}
                {inputs.tablePreset !== '1Px26' && (
                  <div className="flex items-center gap-1.5 justify-center">
                    {Array.from({ length: Math.min(28, result.totalModulesPerTable / 2) }).map((_, colIdx) => (
                      <div
                        key={colIdx}
                        className="w-5 sm:w-7 h-12 bg-gradient-to-b from-sky-700 to-sky-900 border border-sky-400/50 rounded-xs flex items-center justify-center text-[8px] text-sky-200 font-mono shadow-xs hover:border-amber-400 transition-colors"
                        title={`Module Row 2, Col ${colIdx + 1}`}
                      >
                        {colIdx + 1}
                      </div>
                    ))}
                  </div>
                )}

                {/* Longitudinal Purlin lines overlay indicator */}
                <div className="flex items-center justify-between text-[10px] text-amber-400/90 pt-1 border-t border-slate-800 px-2">
                  <span>← Front / Low Edge</span>
                  <span className="font-mono">4 Continuous Purlin Runs Across {result.numberOfRafters} Single-Column Rafters</span>
                  <span>Rear / High Edge →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Engineering Footer bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs">
        <div className="bg-slate-800/40 p-2 rounded-lg">
          <span className="text-slate-400 block text-[10px]">Overturning Moment</span>
          <span className="font-mono font-semibold text-amber-400">{result.overturningMomentKnm.toFixed(1)} kN·m</span>
        </div>
        <div className="bg-slate-800/40 p-2 rounded-lg">
          <span className="text-slate-400 block text-[10px]">Max Column Uplift</span>
          <span className="font-mono font-semibold text-rose-400">{result.maxColumnUpliftKn.toFixed(1)} kN/post</span>
        </div>
        <div className="bg-slate-800/40 p-2 rounded-lg">
          <span className="text-slate-400 block text-[10px]">Pile / Column Count</span>
          <span className="font-mono font-semibold text-emerald-400">{result.numberOfColumns} Foundation Piles</span>
        </div>
        <div className="bg-slate-800/40 p-2 rounded-lg">
          <span className="text-slate-400 block text-[10px]">Recommended Footing</span>
          <span className="font-semibold text-slate-200 truncate block text-[11px]" title={result.checks.recommendedFooting}>
            {result.checks.recommendedFooting}
          </span>
        </div>
      </div>
    </div>
  );
};

