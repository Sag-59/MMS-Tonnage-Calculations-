import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { BoqAnalysisResult, BoqParsedItem, DesignStandardCalibration, StructureType, TablePresetId } from '../types';

export interface RawParsedRow {
  description: string;
  section: string;
  quantity: number;
  lengthM: number;
  unitWeightKg: number;
  totalWeightKg: number;
  raw: Record<string, unknown>;
}

// Built-in verified sample BOQ for a 1-Column + 1 Front Bracing + 1 Back Bracing 2Px28 structure
export const SAMPLE_COMPANY_BOQ_TEXT = `Item No,Description / Member Name,Section Profile,Qty (Nos),Length (m),Unit Wt (kg/m),Total Wt (kg),Category
1,Continuous Purlin Rail,C 90x45x1.8 (YSt-350),4,32.20,2.65,341.32,Purlin
2,Main Inclined Rafter,C 120x60x2.2 (YSt-350),9,4.60,4.20,173.88,Rafter
3,Single Central Column Post,C 125x65x3.0 Heavy Post,9,1.65,6.10,90.58,Column
4,Front Knee Bracing Strut,L 45x45x3.0 Angle,9,1.40,2.10,26.46,Front Bracing
5,Back Knee Bracing Strut,L 50x50x3.0 Angle,9,1.85,2.35,39.13,Back Bracing
6,Structural Fasteners & Mid/End Clamps,Alu Clamps + Gr 8.8 M12 Bolts,224,-,0.22,49.28,Hardware
`;

export function getSampleCompanyBoqResult(): BoqAnalysisResult {
  return parseBoqText(SAMPLE_COMPANY_BOQ_TEXT, 'Sample_Company_Standard_1Col_2Px28.csv', 1024);
}

export async function parseBoqFile(file: File): Promise<BoqAnalysisResult> {
  const fileName = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcelBuffer(buffer, file.name, file.size);
  } else {
    const text = new TextDecoder('utf-8').decode(buffer);
    return parseBoqText(text, file.name, file.size);
  }
}

export function parseExcelBuffer(buffer: ArrayBuffer, fileName: string, fileSize: number): BoqAnalysisResult {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  return processRawBoqData(jsonData, fileName, fileSize);
}

export function parseBoqText(text: string, fileName: string, fileSize: number): BoqAnalysisResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  return processRawBoqData(parsed.data as Record<string, unknown>[], fileName, fileSize);
}

function processRawBoqData(rows: Record<string, unknown>[], fileName: string, fileSize: number): BoqAnalysisResult {
  const items: BoqParsedItem[] = [];
  let detectedModules = 56; // default 2Px28 (56 modules)
  let detectedPreset: TablePresetId = '2Px28';

  // Check file name or rows for table preset clues
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('2x13') || lowerName.includes('2px13') || lowerName.includes('26 mod')) {
    detectedPreset = '2Px13';
    detectedModules = 26;
  } else if (lowerName.includes('2x14') || lowerName.includes('2px14') || lowerName.includes('28 mod')) {
    detectedPreset = '2Px14';
    detectedModules = 28;
  } else if (lowerName.includes('2x26') || lowerName.includes('2px26') || lowerName.includes('52 mod')) {
    detectedPreset = '2Px26';
    detectedModules = 52;
  } else if (lowerName.includes('2x28') || lowerName.includes('2px28') || lowerName.includes('56 mod')) {
    detectedPreset = '2Px28';
    detectedModules = 56;
  }

  let totalSteelWeightKg = 0;
  let hasFoundFrontBrace = false;
  let hasFoundBackBrace = false;

  rows.forEach((row, index) => {
    // Normalise row keys to lower-case
    const normalized: Record<string, unknown> = {};
    for (const key of Object.keys(row)) {
      normalized[key.trim().toLowerCase()] = row[key];
    }

    // Identify description
    const descKey = Object.keys(normalized).find((k) =>
      k.includes('desc') || k.includes('item') || k.includes('name') || k.includes('member') || k.includes('component')
    );
    const desc = String(descKey ? normalized[descKey] : Object.values(normalized)[1] || `Item ${index + 1}`).trim();
    if (!desc || desc.toLowerCase() === 'total' || desc.toLowerCase() === 'grand total') return;

    // Identify section profile
    const sectionKey = Object.keys(normalized).find((k) =>
      k.includes('section') || k.includes('profile') || k.includes('size') || k.includes('spec')
    );
    const section = sectionKey ? String(normalized[sectionKey]).trim() : 'Cold Formed Section';

    // Identify Quantity
    const qtyKey = Object.keys(normalized).find((k) =>
      k.includes('qty') || k.includes('quantity') || k.includes('nos') || k.includes('count')
    );
    let qty = Number(qtyKey ? normalized[qtyKey] : 1);
    if (isNaN(qty) || qty <= 0) qty = 1;

    // Identify Length
    const lengthKey = Object.keys(normalized).find((k) =>
      k.includes('length') || k.includes('len') || k.includes('span')
    );
    let lengthM = Number(lengthKey ? normalized[lengthKey] : 0);
    if (isNaN(lengthM)) lengthM = 0;
    if (lengthM > 50) lengthM = lengthM / 1000; // converted mm to m

    // Identify Unit Weight
    const unitWtKey = Object.keys(normalized).find((k) =>
      k.includes('unit') || k.includes('wt/m') || k.includes('kg/m') || k.includes('weight/m')
    );
    let unitWeightKg = Number(unitWtKey ? normalized[unitWtKey] : 0);
    if (isNaN(unitWeightKg)) unitWeightKg = 0;

    // Identify Total Weight
    const totalWtKey = Object.keys(normalized).find((k) =>
      k.includes('total') && (k.includes('wt') || k.includes('weight') || k.includes('kg') || k.includes('ton'))
    );
    let totalWeight = Number(totalWtKey ? normalized[totalWtKey] : 0);
    if (isNaN(totalWeight) || totalWeight <= 0) {
      if (unitWeightKg > 0 && lengthM > 0) {
        totalWeight = qty * lengthM * unitWeightKg;
      } else if (unitWeightKg > 0) {
        totalWeight = qty * unitWeightKg;
      }
    }

    // Classify category using solar MMS keywords
    const lowerDesc = desc.toLowerCase();
    const lowerSec = section.toLowerCase();
    const combined = `${lowerDesc} ${lowerSec}`;

    let category: BoqParsedItem['detectedCategory'] = 'Other';

    if (combined.includes('purlin') || combined.includes('rail') || combined.includes('hat section')) {
      category = 'Purlin';
    } else if (combined.includes('rafter') || combined.includes('slant beam') || combined.includes('main beam')) {
      category = 'Rafter';
    } else if (
      combined.includes('front brace') ||
      combined.includes('front bracing') ||
      combined.includes('front strut') ||
      combined.includes('lower brace') ||
      combined.includes('fb') ||
      combined.includes('bottom strut')
    ) {
      category = 'Front Bracing';
      hasFoundFrontBrace = true;
    } else if (
      combined.includes('back brace') ||
      combined.includes('back bracing') ||
      combined.includes('rear brace') ||
      combined.includes('rear bracing') ||
      combined.includes('back strut') ||
      combined.includes('rear strut') ||
      combined.includes('upper brace') ||
      combined.includes('bb') ||
      combined.includes('top strut')
    ) {
      category = 'Back Bracing';
      hasFoundBackBrace = true;
    } else if (
      combined.includes('brace') ||
      combined.includes('bracing') ||
      combined.includes('strut') ||
      combined.includes('tie')
    ) {
      // If ambiguous, assign based on discovery order
      if (!hasFoundFrontBrace) {
        category = 'Front Bracing';
        hasFoundFrontBrace = true;
      } else if (!hasFoundBackBrace) {
        category = 'Back Bracing';
        hasFoundBackBrace = true;
      } else {
        category = 'Front Bracing';
      }
    } else if (
      combined.includes('column') ||
      combined.includes('post') ||
      combined.includes('pile') ||
      combined.includes('stub') ||
      combined.includes('pipe') ||
      combined.includes('leg')
    ) {
      category = 'Column';
    } else if (
      combined.includes('clamp') ||
      combined.includes('bolt') ||
      combined.includes('nut') ||
      combined.includes('washer') ||
      combined.includes('fastener') ||
      combined.includes('hardware') ||
      combined.includes('epp')
    ) {
      category = 'Hardware';
    }

    if (totalWeight > 0) {
      totalSteelWeightKg += totalWeight;
    }

    items.push({
      id: `item-${index + 1}`,
      originalDescription: desc,
      detectedCategory: category,
      section,
      quantity: qty,
      lengthM: Math.round(lengthM * 100) / 100,
      unitWeightKg: Math.round(unitWeightKg * 100) / 100,
      totalWeightKg: Math.round(totalWeight * 100) / 100,
      notes: `Matched category: ${category}`,
    });
  });

  // Calculate category totals
  const categoryTotals: Record<string, { weightKg: number; percentage: number; count: number }> = {};
  items.forEach((item) => {
    if (!categoryTotals[item.detectedCategory]) {
      categoryTotals[item.detectedCategory] = { weightKg: 0, percentage: 0, count: 0 };
    }
    categoryTotals[item.detectedCategory].weightKg += item.totalWeightKg;
    categoryTotals[item.detectedCategory].count += item.quantity;
  });

  Object.keys(categoryTotals).forEach((cat) => {
    categoryTotals[cat].percentage = totalSteelWeightKg > 0
      ? Math.round((categoryTotals[cat].weightKg / totalSteelWeightKg) * 1000) / 10
      : 0;
  });

  // Module count fallback detection from purlins or clamps
  const purlinItem = items.find((i) => i.detectedCategory === 'Purlin');
  if (purlinItem && purlinItem.lengthM > 0) {
    // 1 module width is ~1.134m. Length of purlin / 1.15 gives columns
    const estCols = Math.round(purlinItem.lengthM / 1.15);
    if (estCols >= 12 && estCols <= 15) {
      detectedModules = estCols * 2;
      detectedPreset = detectedModules === 26 ? '2Px13' : '2Px14';
    } else if (estCols >= 24 && estCols <= 30) {
      detectedModules = estCols * 2;
      detectedPreset = detectedModules === 52 ? '2Px26' : '2Px28';
    }
  }

  const moduleWattageAssumed = 580; // Wp modern bifacial standard
  const tableCapacityKwp = (detectedModules * moduleWattageAssumed) / 1000;
  const tonnagePerMwp = tableCapacityKwp > 0
    ? (totalSteelWeightKg / 1000) / (tableCapacityKwp / 1000)
    : 0;
  const weightPerModuleKg = detectedModules > 0 ? totalSteelWeightKg / detectedModules : 0;

  // Extract baseline unit weights for calibration
  const purlinItems = items.filter((i) => i.detectedCategory === 'Purlin');
  const rafterItems = items.filter((i) => i.detectedCategory === 'Rafter');
  const columnItems = items.filter((i) => i.detectedCategory === 'Column');
  const frontBraceItems = items.filter((i) => i.detectedCategory === 'Front Bracing');
  const backBraceItems = items.filter((i) => i.detectedCategory === 'Back Bracing');
  const hardwareItems = items.filter((i) => i.detectedCategory === 'Hardware');

  const avgWeightPerM = (list: BoqParsedItem[], fallback: number): number => {
    let totalLen = 0;
    let totalWt = 0;
    list.forEach((i) => {
      if (i.lengthM > 0 && i.totalWeightKg > 0) {
        totalLen += i.lengthM * i.quantity;
        totalWt += i.totalWeightKg;
      } else if (i.unitWeightKg > 0) {
        totalLen += 1;
        totalWt += i.unitWeightKg;
      }
    });
    return totalLen > 0 ? totalWt / totalLen : fallback;
  };

  const purlinKgPerM = Math.round(avgWeightPerM(purlinItems, 2.65) * 100) / 100;
  const rafterKgPerM = Math.round(avgWeightPerM(rafterItems, 4.20) * 100) / 100;
  const columnKgPerM = Math.round(avgWeightPerM(columnItems, 6.10) * 100) / 100;
  const frontBraceKgPerM = Math.round(avgWeightPerM(frontBraceItems, 2.10) * 100) / 100;
  const backBraceKgPerM = Math.round(avgWeightPerM(backBraceItems, 2.35) * 100) / 100;

  const totalHardwareKg = hardwareItems.reduce((acc, i) => acc + i.totalWeightKg, 0);
  const hardwareKgPerModule = detectedModules > 0 && totalHardwareKg > 0
    ? Math.round((totalHardwareKg / detectedModules) * 100) / 100
    : 1.15;

  const calibrationProfile: DesignStandardCalibration = {
    standardName: `Calibrated from ${fileName}`,
    sourceFileName: fileName,
    baseTableModules: detectedModules,
    baseTonnagePerMwp: Math.round(tonnagePerMwp * 100) / 100,
    purlinKgPerM,
    rafterKgPerM,
    columnKgPerM,
    frontBraceKgPerM,
    backBraceKgPerM,
    hardwareKgPerModule,
    structureType: 'single_column',
    calibratedAt: new Date().toISOString(),
  };

  return {
    fileName,
    fileSize,
    analyzedAt: new Date().toLocaleDateString(),
    structureType: 'single_column',
    detectedTablePreset: detectedPreset,
    totalModulesDetected: detectedModules,
    moduleWattageAssumed,
    tableCapacityKwp: Math.round(tableCapacityKwp * 100) / 100,
    totalSteelWeightKg: Math.round(totalSteelWeightKg * 100) / 100,
    tonnagePerMwp: Math.round(tonnagePerMwp * 100) / 100,
    weightPerModuleKg: Math.round(weightPerModuleKg * 100) / 100,
    items,
    categoryTotals,
    calibrationProfile,
  };
}
