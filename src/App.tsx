import React, { useState, useMemo } from 'react';
import {
  MMSInputs,
  TablePresetId,
  WindSpeedUnit,
  SteelGrade,
  StructureType,
  DesignStandardCalibration,
} from './types';
import {
  calculateMmsTonnage,
  TABLE_PRESETS,
  convertWindSpeedToMs,
  convertWindSpeedFromMs,
} from './utils/mmsCalculator';
import { getSampleCompanyBoqResult } from './utils/boqParser';
import { MmsVisualizer } from './components/MmsVisualizer';
import { BomBreakdown } from './components/BomBreakdown';
import { BoqUploader } from './components/BoqUploader';
import { ComparisonView } from './components/ComparisonView';
import { SensitivityCurve } from './components/SensitivityCurve';
import { ExportModal } from './components/ExportModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  Sun,
  Wind,
  Compass,
  Weight,
  ArrowUpDown,
  Grid,
  FileSpreadsheet,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  HardHat,
  ShieldAlert,
  Info,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';

const DEFAULT_INPUTS: MMSInputs = {
  windSpeed: 39,
  windSpeedUnit: 'm/s',
  tiltAngle: 15,
  moduleWeight: 29.0,
  groundClearance: 0.6,
  tablePreset: '2Px14',
  customRows: 2,
  customColumns: 14,
  structureType: 'single_column', // Company Standard: 1 column, 1 front brace, 1 back brace
  calibration: getSampleCompanyBoqResult().calibrationProfile, // Pre-calibrated with company 1-column standard
  moduleWattage: 580,
  moduleLength: 2278,
  moduleWidth: 1134,
  steelGrade: 'YSt-350',
  purlinSpan: 3.2,
  terrainCategory: 2,
};

export default function App() {
  const [inputs, setInputs] = useState<MMSInputs>(DEFAULT_INPUTS);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visualizer' | 'bom' | 'boq' | 'comparison' | 'sensitivity'>('visualizer');

  // Recalculate whenever inputs change
  const result = useMemo(() => {
    return calculateMmsTonnage(inputs);
  }, [inputs]);

  // Handler for wind speed unit conversion
  const handleUnitChange = (newUnit: WindSpeedUnit) => {
    if (newUnit === inputs.windSpeedUnit) return;
    const speedInMs = convertWindSpeedToMs(inputs.windSpeed, inputs.windSpeedUnit);
    const converted = Math.round(convertWindSpeedFromMs(speedInMs, newUnit) * 10) / 10;
    setInputs((prev) => ({
      ...prev,
      windSpeedUnit: newUnit,
      windSpeed: converted,
    }));
  };

  const handleWindPreset = (speedMs: number) => {
    const converted = Math.round(convertWindSpeedFromMs(speedMs, inputs.windSpeedUnit));
    setInputs((prev) => ({ ...prev, windSpeed: converted }));
  };

  const handleReset = () => {
    setInputs(DEFAULT_INPUTS);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/90 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
              <Sun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-slate-100 tracking-tight">
                  Solar MMS Tonnage Calculator
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  IS 875 / ASCE 7-16
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Module Mounting Structure Steel Sizing & Metric Tonnes per Megawatt (MT/MWp)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <button
              id="reset-inputs-btn"
              onClick={handleReset}
              className="p-2 sm:px-3 sm:py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition flex items-center gap-1.5"
              title="Reset to default engineering parameters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              id="export-report-btn"
              onClick={() => setIsExportOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export BOM / Specs</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Summary Banner: Primary Tonnage Result */}
        <div id="hero-tonnage-card" className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -top-10 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Primary Hero Metric */}
            <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-5 lg:pb-0 lg:pr-6">
              <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-medium mb-1">
                <HardHat className="w-4 h-4 text-amber-400" />
                <span>Structural Steel Tonnage</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black font-mono text-emerald-400 tracking-tight">
                  {result.tonnagePerMwp.toFixed(2)}
                </span>
                <span className="text-base font-semibold text-slate-200">MT / MWp</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Equivalent to <strong className="text-slate-200 font-mono">{result.weightPerModuleKg.toFixed(1)} kg</strong> steel weight per solar module ({inputs.moduleWattage} Wp).
              </p>
            </div>

            {/* Engineering Highlights */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Table Configuration</span>
                <span className="text-lg font-bold font-mono text-slate-100">{inputs.tablePreset}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {result.totalModulesPerTable} mods ({result.tableCapacityKwp} kWp)
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Table Steel Weight</span>
                <span className="text-lg font-bold font-mono text-amber-400">
                  {result.totalTableWeightKg.toLocaleString()} <span className="text-xs font-normal">kg</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {result.tablesPerMwp.toFixed(1)} tables per MWp
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Design Wind Load (qz)</span>
                <span className="text-lg font-bold font-mono text-cyan-400">
                  {result.designWindPressureKpa.toFixed(2)} <span className="text-xs font-normal">kN/m²</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  @ {result.designWindSpeedMs.toFixed(1)} m/s velocity
                </span>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Overturning Moment</span>
                <span className="text-lg font-bold font-mono text-rose-400">
                  {result.overturningMomentKnm.toFixed(1)} <span className="text-xs font-normal">kN·m</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Uplift: {result.maxColumnUpliftKn.toFixed(1)} kN/post
                </span>
              </div>
            </div>
          </div>

          {/* Structural System & Design Standard Bar */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Structural System:
              </span>
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  type="button"
                  id="system-single-col-btn"
                  onClick={() => setInputs({ ...inputs, structureType: 'single_column' })}
                  className={`px-3 py-1 rounded-md transition font-medium text-xs flex items-center gap-1.5 ${
                    (inputs.structureType || 'single_column') === 'single_column'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  1-Column Standard (1 Col + 1 FB + 1 BB)
                </button>
                <button
                  type="button"
                  id="system-dual-col-btn"
                  onClick={() => setInputs({ ...inputs, structureType: 'dual_column' })}
                  className={`px-3 py-1 rounded-md transition font-medium text-xs ${
                    inputs.structureType === 'dual_column'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2-Column (Portal)
                </button>
              </div>
            </div>

            {/* Calibration status chip */}
            <div className="flex items-center gap-2">
              {inputs.calibration ? (
                <button
                  type="button"
                  onClick={() => setActiveTab('boq')}
                  className="group px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] flex items-center gap-1.5 transition"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Calibrated: {inputs.calibration.sourceFileName || '1-Col BOQ Standard'}</span>
                  <span className="text-emerald-400/80 group-hover:text-emerald-200 underline ml-0.5">Edit</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('boq')}
                  className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-3 h-3 text-amber-400" />
                  <span>Upload Previous BOQ</span>
                </button>
              )}
            </div>
          </div>

          {/* Risk status banner */}
          {result.checks.windRiskLevel !== 'Low' && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Wind Velocity Advisory:</strong> High wind zone ({result.designWindSpeedMs.toFixed(0)} m/s). Recommended: {result.checks.recommendedFooting}.
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px]">
                Top Edge Height: {result.topEdgeHeightM.toFixed(2)} m
              </span>
            </div>
          )}
        </div>

        {/* 2-Column Grid: Left is Inputs Panel (5 Core Inputs + Modifiers), Right is Dynamic View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: The 5 Requested Inputs */}
          <div className="lg:col-span-5 space-y-5">
            <div id="inputs-control-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <h2 className="font-semibold text-slate-100 text-base">MMS Design Inputs</h2>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">5 Core Parameters</span>
              </div>

              {/* INPUT 1: WIND SPEED */}
              <div id="input-wind-speed" className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-cyan-400" />
                    1. Wind Speed
                  </label>
                  {/* Unit Selector */}
                  <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono">
                    {(['m/s', 'km/h', 'mph'] as WindSpeedUnit[]).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => handleUnitChange(unit)}
                        className={`px-2 py-0.5 rounded transition ${
                          inputs.windSpeedUnit === unit
                            ? 'bg-cyan-600 text-white font-medium'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={inputs.windSpeedUnit === 'km/h' ? 100 : inputs.windSpeedUnit === 'mph' ? 65 : 28}
                    max={inputs.windSpeedUnit === 'km/h' ? 220 : inputs.windSpeedUnit === 'mph' ? 135 : 60}
                    step={1}
                    value={inputs.windSpeed}
                    onChange={(e) => setInputs({ ...inputs, windSpeed: parseFloat(e.target.value) || 0 })}
                    className="flex-1 accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="w-24 relative">
                    <input
                      type="number"
                      value={inputs.windSpeed}
                      onChange={(e) => setInputs({ ...inputs, windSpeed: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-right font-mono font-bold text-sm text-cyan-400 focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-500 pointer-events-none">
                      {inputs.windSpeedUnit}
                    </span>
                  </div>
                </div>

                {/* Quick Wind Zone Presets */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500">Zone Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleWindPreset(33)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    Zone I (33 m/s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWindPreset(39)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    Zone II (39 m/s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWindPreset(47)}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    Zone IV (47 m/s)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWindPreset(55)}
                    className="text-[10px] px-2 py-0.5 rounded bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 font-mono"
                  >
                    Cyclone (55 m/s)
                  </button>
                </div>
              </div>

              {/* INPUT 2: TILT ANGLE */}
              <div id="input-tilt-angle" className="space-y-2.5 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-400" />
                    2. Tilt Angle
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">{inputs.tiltAngle}°</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="45"
                    step="1"
                    value={inputs.tiltAngle}
                    onChange={(e) => setInputs({ ...inputs, tiltAngle: parseInt(e.target.value) || 5 })}
                    className="flex-1 accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="w-20">
                    <input
                      type="number"
                      min="5"
                      max="45"
                      value={inputs.tiltAngle}
                      onChange={(e) => setInputs({ ...inputs, tiltAngle: parseInt(e.target.value) || 5 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-right font-mono font-bold text-sm text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>5° (Low Wind Drag)</span>
                  <span>15°–25° (Standard Latitude)</span>
                  <span>45° (High Solar Yield)</span>
                </div>
              </div>

              {/* INPUT 3: MODULE WEIGHT */}
              <div id="input-module-weight" className="space-y-2.5 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Weight className="w-4 h-4 text-emerald-400" />
                    3. Module Weight
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400">{inputs.moduleWeight.toFixed(1)} kg</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="20"
                    max="38"
                    step="0.5"
                    value={inputs.moduleWeight}
                    onChange={(e) => setInputs({ ...inputs, moduleWeight: parseFloat(e.target.value) || 20 })}
                    className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="w-24 relative">
                    <input
                      type="number"
                      step="0.5"
                      value={inputs.moduleWeight}
                      onChange={(e) => setInputs({ ...inputs, moduleWeight: parseFloat(e.target.value) || 20 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-right font-mono font-bold text-sm text-emerald-400 focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-500 pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>~24kg (Monofacial 450W)</span>
                  <span>~29kg (Bifacial Glass-Glass 580W+)</span>
                  <span>~35kg (High Power 700W)</span>
                </div>
              </div>

              {/* INPUT 4: GROUND CLEARANCE */}
              <div id="input-ground-clearance" className="space-y-2.5 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <ArrowUpDown className="w-4 h-4 text-purple-400" />
                    4. Ground Clearance (Lowest Edge)
                  </label>
                  <span className="text-xs font-mono font-bold text-purple-400">{inputs.groundClearance.toFixed(2)} m</span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.3"
                    max="2.2"
                    step="0.05"
                    value={inputs.groundClearance}
                    onChange={(e) => setInputs({ ...inputs, groundClearance: parseFloat(e.target.value) || 0.3 })}
                    className="flex-1 accent-purple-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <div className="w-24 relative">
                    <input
                      type="number"
                      step="0.05"
                      value={inputs.groundClearance}
                      onChange={(e) => setInputs({ ...inputs, groundClearance: parseFloat(e.target.value) || 0.3 })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-right font-mono font-bold text-sm text-purple-400 focus:outline-none focus:border-purple-500"
                    />
                    <span className="absolute left-2 top-2 text-[10px] text-slate-500 pointer-events-none">
                      m
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>0.5m (Standard)</span>
                  <span>0.8m (Vegetation / Snow)</span>
                  <span>1.5m+ (High Clearance / AgroPV)</span>
                </div>
              </div>

              {/* INPUT 5: TABLE SIZE OR ORIENTATION */}
              <div id="input-table-size" className="space-y-3 pt-2 border-t border-slate-800/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-amber-400" />
                    5. Table Size & Orientation
                  </label>
                  <span className="text-xs font-mono font-medium text-slate-400">
                    {result.totalModulesPerTable} Modules / Table
                  </span>
                </div>

                {/* Preset Chips (2Px13, 2Px14, 2Px26, 2Px28) */}
                <div className="grid grid-cols-2 gap-2">
                  {(['2Px13', '2Px14', '2Px26', '2Px28'] as TablePresetId[]).map((presetId) => {
                    const preset = TABLE_PRESETS.find((p) => p.id === presetId)!;
                    const isSelected = inputs.tablePreset === presetId;
                    return (
                      <button
                        key={presetId}
                        onClick={() => setInputs({ ...inputs, tablePreset: presetId })}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-white shadow-xs'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-amber-400">{presetId}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {preset.rows * preset.columns} mods
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                          {preset.name.split('(')[1]?.replace(')', '') || 'Standard'}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Additional 1P or Custom option */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setInputs({ ...inputs, tablePreset: '1Px26' })}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono border transition ${
                      inputs.tablePreset === '1Px26'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1P x 26 (Single Portrait)
                  </button>
                  <button
                    onClick={() => setInputs({ ...inputs, tablePreset: 'custom' })}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono border transition ${
                      inputs.tablePreset === 'custom'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Custom Matrix
                  </button>
                </div>

                {/* Custom inputs if selected */}
                {inputs.tablePreset === 'custom' && (
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Portrait Rows</label>
                      <input
                        type="number"
                        min="1"
                        max="4"
                        value={inputs.customRows}
                        onChange={(e) => setInputs({ ...inputs, customRows: parseInt(e.target.value) || 1 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Columns</label>
                      <input
                        type="number"
                        min="4"
                        max="40"
                        value={inputs.customColumns}
                        onChange={(e) => setInputs({ ...inputs, customColumns: parseInt(e.target.value) || 10 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-sm font-mono text-slate-200"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* ADVANCED ENGINEERING MODIFIERS TOGGLE */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full py-2 px-3 rounded-lg bg-slate-950/60 hover:bg-slate-950 text-slate-300 hover:text-slate-100 flex items-center justify-between text-xs transition border border-slate-800/60"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Advanced Engineering Modifiers (Wattage, Steel Grade)
                  </span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3.5 text-xs">
                    {/* Module Wattage */}
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Module Peak Power (Wp)</span>
                        <span className="font-mono text-amber-400">{inputs.moduleWattage} Wp</span>
                      </div>
                      <input
                        type="range"
                        min="400"
                        max="720"
                        step="10"
                        value={inputs.moduleWattage}
                        onChange={(e) => setInputs({ ...inputs, moduleWattage: parseInt(e.target.value) || 580 })}
                        className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500">
                        Affects total tables & modules needed to achieve 1 MWp
                      </span>
                    </div>

                    {/* Steel Grade Selection */}
                    <div>
                      <label className="text-slate-300 block mb-1">Steel Grade & Yield Strength</label>
                      <select
                        value={inputs.steelGrade}
                        onChange={(e) => setInputs({ ...inputs, steelGrade: e.target.value as SteelGrade })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="YSt-550">YSt-550 High-Tensile PosMAC / Galvalume (550 MPa) — Lightest</option>
                        <option value="YSt-350">YSt-350 Standard Structural Galvanized (350 MPa)</option>
                        <option value="YSt-250">YSt-250 Mild Steel (250 MPa) — Heavier Section</option>
                        <option value="Aluminum-6005-T5">AL 6005-T5 Structural Aluminum</option>
                      </select>
                    </div>

                    {/* Terrain Category */}
                    <div>
                      <label className="text-slate-300 block mb-1">Terrain Category (IS 875 / ASCE 7)</label>
                      <select
                        value={inputs.terrainCategory}
                        onChange={(e) => setInputs({ ...inputs, terrainCategory: parseInt(e.target.value) as 1 | 2 | 3 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 font-mono text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="1">Category 1: Open terrain, coastal or flat desert (k2 = 1.05)</option>
                        <option value="2">Category 2: Open country with scattered shrubs/trees (k2 = 1.00)</option>
                        <option value="3">Category 3: Obstacles, wooded or industrial park (k2 = 0.91)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Views (Visualizer, BOM, Comparison, Sensitivity) */}
          <div className="lg:col-span-7 space-y-5">
            {/* View Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
              <button
                id="tab-visualizer-btn"
                onClick={() => setActiveTab('visualizer')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'visualizer'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Structural Schematic (2D/3D)
              </button>
              <button
                id="tab-bom-btn"
                onClick={() => setActiveTab('bom')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'bom'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <HardHat className="w-3.5 h-3.5" />
                Member BOM & Sizing
              </button>
              <button
                id="tab-boq-btn"
                onClick={() => setActiveTab('boq')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'boq'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                BOQ Upload & Calibration
                {inputs.calibration && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse ml-0.5" />
                )}
              </button>
              <button
                id="tab-comparison-btn"
                onClick={() => setActiveTab('comparison')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'comparison'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                Table Size Comparison (2P)
              </button>
              <button
                id="tab-sensitivity-btn"
                onClick={() => setActiveTab('sensitivity')}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  activeTab === 'sensitivity'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                Sensitivity Curves
              </button>
            </div>

            {/* Active Tab View */}
            {activeTab === 'visualizer' && (
              <MmsVisualizer
                inputs={inputs}
                result={result}
                onStructureTypeChange={(type) => setInputs((prev) => ({ ...prev, structureType: type }))}
              />
            )}

            {activeTab === 'bom' && (
              <BomBreakdown inputs={inputs} result={result} />
            )}

            {activeTab === 'boq' && (
              <BoqUploader
                activeCalibration={inputs.calibration}
                onApplyCalibration={(cal) => {
                  setInputs((prev) => ({
                    ...prev,
                    calibration: cal,
                    structureType: 'single_column',
                  }));
                }}
                onClearCalibration={() => {
                  setInputs((prev) => ({
                    ...prev,
                    calibration: undefined,
                  }));
                }}
                currentStructureType={inputs.structureType || 'single_column'}
                onSelectStructureType={(type) => {
                  setInputs((prev) => ({ ...prev, structureType: type }));
                }}
              />
            )}

            {activeTab === 'comparison' && (
              <ComparisonView
                currentInputs={inputs}
                onSelectPreset={(presetId) => setInputs({ ...inputs, tablePreset: presetId })}
              />
            )}

            {activeTab === 'sensitivity' && (
              <SensitivityCurve inputs={inputs} />
            )}

            {/* Quick Engineering Key Metrics Card below tab */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Table Slant Length</span>
                <span className="font-mono text-slate-200 font-semibold">{result.tableSlantLengthM.toFixed(2)} m</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Table Width (E-W)</span>
                <span className="font-mono text-slate-200 font-semibold">{result.tableWidthM.toFixed(1)} m</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Rafter / Post Pairs</span>
                <span className="font-mono text-slate-200 font-semibold">{result.numberOfRafters} Sets</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Modules / MWp</span>
                <span className="font-mono text-slate-200 font-semibold">{result.totalModulesPerMwp.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Engineering Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Solar PV Module Mounting Structure (MMS) Engineering Engine • Structural steel density: 7,850 kg/m³
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>IS 875 (Part 3) / ASCE 7-16 Compliant</span>
            <span>•</span>
            <span>2P & 1P Configurations</span>
          </div>
        </div>
      </footer>

      {/* Export / Report Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        inputs={inputs}
        result={result}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />
    </div>
  );
}
