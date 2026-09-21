import React, { useState } from 'react';
import { CalculationResult, MMSInputs } from '../types';
import { X, Printer, Copy, Check, Download, FileSpreadsheet } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputs: MMSInputs;
  result: CalculationResult;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, inputs, result }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = `
================================================================================
SOLAR MODULE MOUNTING STRUCTURE (MMS) - TONNAGE CALCULATION REPORT
================================================================================
Generated: ${new Date().toLocaleString()}

1. PRIMARY INPUT PARAMETERS:
--------------------------------------------------------------------------------
- Structure System:       ${(inputs.structureType || 'single_column') === 'single_column' ? '1 Column + 1 Front Brace + 1 Back Brace (Company Standard)' : '2 Column Portal Post System'}
- Calibration Standard:   ${inputs.calibration ? inputs.calibration.standardName : 'Standard Theoretical Sizing'}
- Wind Speed:            ${inputs.windSpeed} ${inputs.windSpeedUnit} (${result.designWindSpeedMs.toFixed(1)} m/s design)
- Tilt Angle:            ${inputs.tiltAngle}°
- Module Weight:         ${inputs.moduleWeight} kg
- Ground Clearance:      ${inputs.groundClearance.toFixed(2)} m
- Table Configuration:   ${inputs.tablePreset} (${result.totalModulesPerTable} modules / table)
- Module Rating:         ${inputs.moduleWattage} Wp (${inputs.moduleLength}x${inputs.moduleWidth} mm)
- Steel Grade:           ${inputs.steelGrade}
- Terrain Category:      Category ${inputs.terrainCategory}

2. KEY STRUCTURAL & ELECTRICAL RESULTS:
--------------------------------------------------------------------------------
- MMS TONNAGE:           ${result.tonnagePerMwp.toFixed(2)} MT / MWp
- Steel Wt / Module:     ${result.weightPerModuleKg.toFixed(2)} kg / module
- Table Weight:          ${result.totalTableWeightKg.toLocaleString()} kg
- Table DC Capacity:     ${result.tableCapacityKwp.toFixed(2)} kWp
- Tables per MWp:        ${result.tablesPerMwp.toFixed(1)} tables
- Total Modules / MWp:   ${result.totalModulesPerMwp.toLocaleString()} modules

3. AERODYNAMIC & WIND DESIGN LOADS (IS 875 Part 3 / ASCE 7-16):
--------------------------------------------------------------------------------
- Basic Wind Pressure:   ${result.basicWindPressureKpa.toFixed(3)} kN/m²
- Design Wind Pressure:  ${result.designWindPressureKpa.toFixed(3)} kN/m²
- Wind Suction Uplift:   ${result.windUpliftPressureKpa.toFixed(3)} kN/m²
- Total Wind Force:      ${result.totalWindForceKn.toFixed(1)} kN / table
- Overturning Moment:    ${result.overturningMomentKnm.toFixed(1)} kN·m
- Max Column Uplift:     ${result.maxColumnUpliftKn.toFixed(1)} kN / post
- Recommended Footing:   ${result.checks.recommendedFooting}

4. BILL OF MATERIALS (BOM) BREAKDOWN:
--------------------------------------------------------------------------------
${result.bom
  .map(
    (b) =>
      `- ${b.name.padEnd(30)} | ${b.section.padEnd(25)} | ${b.totalWeightKg.toString().padStart(6)} kg | ${b.tonnagePerMwp.toFixed(2).padStart(6)} MT/MWp (${b.percentage.toFixed(1)}%)`
  )
  .join('\n')}
================================================================================
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const rows = [
      ['Structural Member', 'Section', 'Quantity', 'Unit Weight (kg/m)', 'Table Weight (kg)', 'Tonnage (MT/MWp)', 'Share (%)'],
      ...result.bom.map((b) => [
        `"${b.name}"`,
        `"${b.section}"`,
        b.count,
        b.weightPerUnitKg,
        b.totalWeightKg,
        b.tonnagePerMwp,
        b.percentage,
      ]),
      ['Total Structure', inputs.steelGrade, result.totalModulesPerTable, '', result.totalTableWeightKg, result.tonnagePerMwp, '100%'],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MMS_Tonnage_${inputs.tablePreset}_${inputs.windSpeed}${inputs.windSpeedUnit}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Engineering Specification & Tonnage Report</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Solar MMS Structural Sizing • Code Reference: IS 875 (Part 3) / ASCE 7-16
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400 block">Total MMS Tonnage</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {result.tonnagePerMwp.toFixed(2)} <span className="text-xs font-normal">MT/MWp</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Steel per Module</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {result.weightPerModuleKg.toFixed(1)} <span className="text-xs font-normal">kg/mod</span>
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Table Configuration</span>
              <span className="text-base font-bold font-mono text-slate-200">{inputs.tablePreset}</span>
              <span className="text-[10px] text-slate-400 block">{result.totalModulesPerTable} mods ({result.tableCapacityKwp} kWp)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Design Wind Speed</span>
              <span className="text-base font-bold font-mono text-cyan-400">
                {result.designWindSpeedMs.toFixed(1)} m/s
              </span>
              <span className="text-[10px] text-slate-400 block">({inputs.windSpeed} {inputs.windSpeedUnit})</span>
            </div>
          </div>

          {/* Table of BOM */}
          <div>
            <h4 className="font-semibold text-slate-200 mb-2">Member Sizing & Steel Weight Summary</h4>
            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Member</th>
                    <th className="p-2.5">Profile Section</th>
                    <th className="p-2.5 text-right">Table Wt (kg)</th>
                    <th className="p-2.5 text-right font-semibold text-emerald-400">MT/MWp</th>
                    <th className="p-2.5 text-right">Share (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {result.bom.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-800/30">
                      <td className="p-2.5 font-sans font-medium text-slate-200">{b.name}</td>
                      <td className="p-2.5 text-slate-300">{b.section}</td>
                      <td className="p-2.5 text-right text-slate-300">{b.totalWeightKg.toLocaleString()}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-400">{b.tonnagePerMwp.toFixed(2)}</td>
                      <td className="p-2.5 text-right text-slate-400">{b.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Design Notes */}
          <div className="p-3.5 bg-slate-950/60 rounded-lg border border-slate-800 text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Foundation & Geotechnical Recommendation:</div>
            <p>
              {result.checks.recommendedFooting}. Column base shear: {result.totalWindForceKn.toFixed(1)} kN per table, Net overturning moment: {result.overturningMomentKnm.toFixed(1)} kN·m.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50">
          <div className="text-xs text-slate-400">
            Export format: Plain text / CSV Spreadsheet
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied to Clipboard' : 'Copy Text'}
            </button>
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Download CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
