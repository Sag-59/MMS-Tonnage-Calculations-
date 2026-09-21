import React, { useState, useRef } from 'react';
import {
  BoqAnalysisResult,
  DesignStandardCalibration,
  StructureType,
} from '../types';
import {
  parseBoqFile,
  getSampleCompanyBoqResult,
} from '../utils/boqParser';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface BoqUploaderProps {
  activeCalibration?: DesignStandardCalibration | null;
  onApplyCalibration: (calibration: DesignStandardCalibration) => void;
  onClearCalibration: () => void;
  currentStructureType: StructureType;
  onSelectStructureType: (type: StructureType) => void;
}

export const BoqUploader: React.FC<BoqUploaderProps> = ({
  activeCalibration,
  onApplyCalibration,
  onClearCalibration,
  currentStructureType,
  onSelectStructureType,
}) => {
  const [analysisResult, setAnalysisResult] = useState<BoqAnalysisResult | null>(
    activeCalibration
      ? getSampleCompanyBoqResult()
      : null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const result = await parseBoqFile(file);
      setAnalysisResult(result);
      // Auto-apply calibration when user uploads their BOQ
      onApplyCalibration(result.calibrationProfile);
      onSelectStructureType('single_column');
    } catch (err: unknown) {
      console.error('BOQ parse error:', err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to parse BOQ file. Please upload an Excel (.xlsx/.xls) or CSV file with columns for description, section profile, quantity, and weight.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const loadDemoCompanyBoq = () => {
    setErrorMsg(null);
    const demoResult = getSampleCompanyBoqResult();
    setAnalysisResult(demoResult);
    onApplyCalibration(demoResult.calibrationProfile);
    onSelectStructureType('single_column');
  };

  const downloadSampleCsv = () => {
    const csvContent = `Item No,Description / Member Name,Section Profile,Qty (Nos),Length (m),Unit Wt (kg/m),Total Wt (kg),Category
1,Continuous Purlin Rail,C 90x45x1.8 (YSt-350),4,32.20,2.65,341.32,Purlin
2,Main Inclined Rafter,C 120x60x2.2 (YSt-350),9,4.60,4.20,173.88,Rafter
3,Single Central Column Post,C 125x65x3.0 Heavy Post,9,1.65,6.10,90.58,Column
4,Front Knee Bracing Strut,L 45x45x3.0 Angle,9,1.40,2.10,26.46,Front Bracing
5,Back Knee Bracing Strut,L 50x50x3.0 Angle,9,1.85,2.35,39.13,Back Bracing
6,Structural Fasteners & Mid/End Clamps,Alu Clamps + Gr 8.8 M12 Bolts,224,-,0.22,49.28,Hardware
`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Company_Standard_1Col_Sample_BOQ.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="boq-uploader-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-white flex flex-col shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-slate-100 text-base">
              BOQ Analysis & Structural Calibration
            </h3>
            {activeCalibration && (
              <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Active Standard Calibrated
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload your previous project BOQ (Excel / CSV) to calibrate section sizes & unit weights for your company's 1-column standard
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            Download CSV Template
          </button>
          <button
            type="button"
            onClick={loadDemoCompanyBoq}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Load Sample 1-Col BOQ
          </button>
        </div>
      </div>

      {/* Structural Standard Configuration Banner */}
      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                Structural Topology:
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                1 Column + 1 Front Bracing + 1 Back Bracing + Rafters & Purlins
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Reflects your design standard — uses a single central pile/column post with dual knee struts, eliminating redundant dual-column portal posts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onSelectStructureType('single_column')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentStructureType === 'single_column'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            1-Column (Your Standard)
          </button>
          <button
            type="button"
            onClick={() => onSelectStructureType('dual_column')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              currentStructureType === 'dual_column'
                ? 'bg-amber-500 text-slate-950 shadow-xs font-bold'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            2-Column (Portal)
          </button>
        </div>
      </div>

      {/* Drag & Drop File Upload Area */}
      <div
        id="boq-dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
          isDragging
            ? 'border-amber-400 bg-amber-500/10'
            : 'border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-950'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-amber-400">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <span className="text-sm font-semibold text-slate-200 block">
            Click to upload or drag & drop your calculation BOQ
          </span>
          <span className="text-xs text-slate-400 block mt-0.5">
            Supported formats: Excel (.xlsx, .xls) or CSV (.csv)
          </span>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-amber-400 mt-2 font-mono">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full" />
            Analyzing BOQ rows & categorizing structural profiles...
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{errorMsg}</p>
        </div>
      )}

      {/* BOQ Analysis & Calibration Display */}
      {analysisResult && (
        <div className="space-y-4 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block">Analyzed BOQ Document:</span>
              <div className="flex items-center gap-2 mt-0.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold text-slate-100 text-sm">{analysisResult.fileName}</span>
                <span className="text-[11px] font-mono text-slate-500">
                  ({analysisResult.items.length} line items parsed)
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">BOQ Baseline Tonnage</span>
                <span className="text-xl font-bold font-mono text-emerald-400">
                  {analysisResult.tonnagePerMwp.toFixed(2)}{' '}
                  <span className="text-xs font-normal text-slate-200">MT/MWp</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase">Table Capacity</span>
                <span className="text-sm font-bold font-mono text-amber-400">
                  {analysisResult.totalModulesDetected} Mods ({analysisResult.tableCapacityKwp} kWp)
                </span>
              </div>
            </div>
          </div>

          {/* Calibrated Unit Weights Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                Calibrated Member Unit Weights (from your BOQ):
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Auto-applied to 1-Column Calculator
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Purlin Rails</span>
                <span className="text-base font-bold font-mono text-amber-400">
                  {analysisResult.calibrationProfile.purlinKgPerM.toFixed(2)}{' '}
                  <span className="text-[10px] text-slate-400">kg/m</span>
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Continuous 4-run</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Inclined Rafter</span>
                <span className="text-base font-bold font-mono text-sky-400">
                  {analysisResult.calibrationProfile.rafterKgPerM.toFixed(2)}{' '}
                  <span className="text-[10px] text-slate-400">kg/m</span>
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Slant main beam</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">1 Column Post</span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {analysisResult.calibrationProfile.columnKgPerM.toFixed(2)}{' '}
                  <span className="text-[10px] text-slate-400">kg/m</span>
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Heavy single pile</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">1 Front Bracing</span>
                <span className="text-base font-bold font-mono text-amber-300">
                  {analysisResult.calibrationProfile.frontBraceKgPerM.toFixed(2)}{' '}
                  <span className="text-[10px] text-slate-400">kg/m</span>
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Lower knee strut</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">1 Back Bracing</span>
                <span className="text-base font-bold font-mono text-amber-300">
                  {analysisResult.calibrationProfile.backBraceKgPerM.toFixed(2)}{' '}
                  <span className="text-[10px] text-slate-400">kg/m</span>
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Upper knee strut</span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Clamps & Bolts</span>
                <span className="text-base font-bold font-mono text-purple-400">
                  {analysisResult.calibrationProfile.hardwareKgPerModule.toFixed(2)}{' '}
                  <span className="text-[10px] text-slate-400">kg/mod</span>
                </span>
                <span className="text-[9px] text-slate-500 block mt-0.5">Fasteners & mid/end</span>
              </div>
            </div>
          </div>

          {/* Parsed BOQ Items Table */}
          <div className="mt-3">
            <span className="text-xs font-semibold text-slate-200 block mb-2">
              Parsed BOQ Members & Profile Mapping:
            </span>
            <div className="overflow-x-auto max-h-56 overflow-y-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead className="sticky top-0 bg-slate-950 border-b border-slate-800 text-slate-400 font-medium">
                  <tr>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3">Section Profile</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Length (m)</th>
                    <th className="py-2 px-3 text-right">Unit Wt (kg/m)</th>
                    <th className="py-2 px-3 text-right">Total Wt (kg)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {analysisResult.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="py-1.5 px-3 font-sans font-medium text-slate-200">
                        {item.originalDescription}
                      </td>
                      <td className="py-1.5 px-3 text-slate-300">{item.section}</td>
                      <td className="py-1.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-sans ${
                            item.detectedCategory === 'Purlin'
                              ? 'bg-amber-500/20 text-amber-300'
                              : item.detectedCategory === 'Rafter'
                              ? 'bg-sky-500/20 text-sky-300'
                              : item.detectedCategory === 'Column'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : item.detectedCategory === 'Front Bracing' || item.detectedCategory === 'Back Bracing'
                              ? 'bg-yellow-500/20 text-yellow-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {item.detectedCategory}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right text-slate-400">{item.quantity}</td>
                      <td className="py-1.5 px-3 text-right text-slate-400">
                        {item.lengthM > 0 ? item.lengthM.toFixed(2) : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-right text-slate-300">
                        {item.unitWeightKg > 0 ? item.unitWeightKg.toFixed(2) : '—'}
                      </td>
                      <td className="py-1.5 px-3 text-right text-amber-400 font-semibold">
                        {item.totalWeightKg.toLocaleString()} kg
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Your input parameters (Wind speed, Tilt, GC, Table size) are dynamically simulated using these calibrated member profiles.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClearCalibration}
                className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Calibration
              </button>
              <button
                type="button"
                onClick={() => onApplyCalibration(analysisResult.calibrationProfile)}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active & Calibrated
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
