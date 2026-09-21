import { MMSInputs, CalculationResult, BomComponent, TablePreset } from '../types';

export const TABLE_PRESETS: TablePreset[] = [
  {
    id: '2Px14',
    name: '2P x 14 (Standard Short Table)',
    rows: 2,
    columns: 14,
    description: '28 modules per table (~16.2 kWp). Ideal for undulating terrain & compact blocks.',
  },
  {
    id: '2Px28',
    name: '2P x 28 (Standard Long Table)',
    rows: 2,
    columns: 28,
    description: '56 modules per table (~32.5 kWp). Maximum steel economy with shared column posts.',
  },
  {
    id: '2Px13',
    name: '2P x 13 (26-Module Table)',
    rows: 2,
    columns: 13,
    description: '26 modules per table (~15.1 kWp). Common string configuration for 1500V systems.',
  },
  {
    id: '2Px26',
    name: '2P x 26 (52-Module Table)',
    rows: 2,
    columns: 26,
    description: '52 modules per table (~30.2 kWp). Two 26-module strings on a single structure.',
  },
  {
    id: '1Px26',
    name: '1P x 26 (Single Portrait Table)',
    rows: 1,
    columns: 26,
    description: '26 modules in 1-portrait row. Lower wind profile, reduced moment arm.',
  },
  {
    id: 'custom',
    name: 'Custom Configuration',
    rows: 2,
    columns: 14,
    description: 'User-specified rows and columns.',
  },
];

export function convertWindSpeedToMs(speed: number, unit: MMSInputs['windSpeedUnit']): number {
  switch (unit) {
    case 'km/h':
      return speed / 3.6;
    case 'mph':
      return speed * 0.44704;
    case 'm/s':
    default:
      return speed;
  }
}

export function convertWindSpeedFromMs(speedMs: number, toUnit: MMSInputs['windSpeedUnit']): number {
  switch (toUnit) {
    case 'km/h':
      return speedMs * 3.6;
    case 'mph':
      return speedMs / 0.44704;
    case 'm/s':
    default:
      return speedMs;
  }
}

export function calculateMmsTonnage(inputs: MMSInputs): CalculationResult {
  const {
    windSpeed,
    windSpeedUnit,
    tiltAngle,
    moduleWeight,
    groundClearance,
    tablePreset,
    customRows,
    customColumns,
    structureType = 'single_column',
    calibration,
    moduleWattage,
    moduleLength,
    moduleWidth,
    steelGrade,
    terrainCategory,
  } = inputs;

  // 1. Determine table matrix (rows x columns)
  let rows = 2;
  let columns = 14;

  if (tablePreset === 'custom') {
    rows = Math.max(1, Math.min(4, Math.round(customRows || 2)));
    columns = Math.max(2, Math.min(40, Math.round(customColumns || 14)));
  } else {
    const preset = TABLE_PRESETS.find((p) => p.id === tablePreset) || TABLE_PRESETS[0];
    rows = preset.rows;
    columns = preset.columns;
  }

  const totalModulesPerTable = rows * columns;
  const tableCapacityKwp = (totalModulesPerTable * moduleWattage) / 1000;
  const tablesPerMwp = 1000 / tableCapacityKwp;
  const totalModulesPerMwp = Math.round(1000000 / moduleWattage);

  // 2. Geometric calculations
  const modLenM = moduleLength / 1000; // e.g. 2.278 m
  const modWidM = moduleWidth / 1000; // e.g. 1.134 m
  const gapBetweenModules = 0.02; // 20mm gap

  // Slant length of table (along tilt)
  const tableSlantLengthM = rows * modLenM + (rows - 1) * gapBetweenModules;
  // Table width (along East-West axis)
  const tableWidthM = columns * modWidM + (columns - 1) * gapBetweenModules;

  // Tilt in radians
  const tiltRad = (tiltAngle * Math.PI) / 180;
  const sinTilt = Math.sin(tiltRad);
  const cosTilt = Math.cos(tiltRad);

  // Heights from ground
  const topEdgeHeightM = groundClearance + tableSlantLengthM * sinTilt;

  // 3. Wind speed & pressure calculations (as per IS 875 Part 3 / ASCE 7-16)
  const basicWindSpeedMs = convertWindSpeedToMs(windSpeed, windSpeedUnit);
  
  // Terrain coefficient k2
  const k2Map: Record<number, number> = { 1: 1.05, 2: 1.0, 3: 0.91 };
  const k2 = k2Map[terrainCategory] || 1.0;
  const k1 = 1.0; // risk coefficient for 50 yr life
  const k3 = 1.0; // topography factor
  const designWindSpeedMs = basicWindSpeedMs * k1 * k2 * k3;

  // Basic wind pressure qz = 0.6 * V^2 (N/m²) -> kN/m²
  const basicWindPressureKpa = (0.6 * Math.pow(designWindSpeedMs, 2)) / 1000;

  // Aerodynamic pressure coefficient Cp
  const clearanceUpliftFactor = Math.min(0.25, groundClearance * 0.12);
  const cpUplift = 0.70 + 0.022 * tiltAngle + clearanceUpliftFactor;
  const cpDownward = 0.50 + 0.024 * tiltAngle;

  // Net design wind pressures
  const gustFactor = 0.85;
  const windUpliftPressureKpa = basicWindPressureKpa * cpUplift * gustFactor;
  const designWindPressureKpa = basicWindPressureKpa * Math.max(cpUplift, cpDownward) * gustFactor;

  // Total tributary wind force on table
  const tableAreaM2 = tableSlantLengthM * tableWidthM;
  const totalWindForceKn = designWindPressureKpa * tableAreaM2;

  // Effective lever arm from ground
  const effectiveWindLeverArm = groundClearance + 0.5 * tableSlantLengthM * sinTilt;
  const overturningMomentKnm = totalWindForceKn * effectiveWindLeverArm;

  // 4. Structural Sizing & Material Grading
  const idealPitch = 3.2;
  const numberOfSpans = Math.max(1, Math.round(tableWidthM / idealPitch));
  const numberOfRafters = numberOfSpans + 1;
  const purlinSpanActual = tableWidthM / numberOfSpans;

  // Steel grade modifier
  let gradeMultiplier = 1.0;
  switch (steelGrade) {
    case 'YSt-550':
      gradeMultiplier = 0.82;
      break;
    case 'YSt-350':
      gradeMultiplier = 1.0;
      break;
    case 'YSt-250':
      gradeMultiplier = 1.25;
      break;
    case 'Aluminum-6005-T5':
      gradeMultiplier = 0.52;
      break;
  }

  // Load ratio relative to reference 39 m/s wind
  const referencePz = 0.91; // kN/m²
  const windRatio = designWindPressureKpa / referencePz;
  const moduleWeightFactor = 1 + (moduleWeight - 28) * 0.007;
  const clearanceFactor = Math.pow(Math.max(0.4, groundClearance) / 0.6, 0.45);

  // Calibration scaling if user uploaded their BOQ
  const isCalibrated = !!calibration;
  const baseWindScaling = Math.pow(windRatio, 0.55);

  // A. PURLINS
  const purlinLines = rows === 1 ? 2 : designWindSpeedMs > 48 ? 5 : 4;
  const purlinLengthPerTable = purlinLines * tableWidthM;
  let purlinUnitWeightKgM: number;
  if (isCalibrated && calibration.purlinKgPerM) {
    purlinUnitWeightKgM = calibration.purlinKgPerM * baseWindScaling * (purlinSpanActual / 3.2);
  } else {
    purlinUnitWeightKgM = Math.max(
      1.4,
      (2.3 * baseWindScaling * moduleWeightFactor * (purlinSpanActual / 3.2)) * gradeMultiplier
    );
  }
  const purlinTotalWeightKg = purlinLengthPerTable * purlinUnitWeightKgM;
  const purlinSection = purlinUnitWeightKgM < 2.2
    ? 'Hat Section 80x40x1.5'
    : purlinUnitWeightKgM < 3.0
    ? 'C-Section 90x45x1.8'
    : 'C-Section 110x50x2.2';

  // B. RAFTERS
  const rafterLengthPerUnit = tableSlantLengthM;
  const rafterTributaryWidth = tableWidthM / (numberOfRafters - 1);
  let rafterUnitWeightKgM: number;
  if (isCalibrated && calibration.rafterKgPerM) {
    rafterUnitWeightKgM = calibration.rafterKgPerM * Math.pow(windRatio, 0.58) * (rafterTributaryWidth / 3.2);
  } else {
    rafterUnitWeightKgM = Math.max(
      2.2,
      (3.6 * Math.pow(windRatio, 0.62) * (rafterTributaryWidth / 3.2)) * gradeMultiplier
    );
  }
  const rafterTotalWeightKg = numberOfRafters * rafterLengthPerUnit * rafterUnitWeightKgM;
  const rafterSection = rafterUnitWeightKgM < 3.5
    ? 'C 100x50x2.0'
    : rafterUnitWeightKgM < 5.0
    ? 'C 120x60x2.5'
    : 'Back-to-Back 2C 120x50x2.5';

  let bom: BomComponent[] = [];
  let totalTableWeightKg = 0;
  let frontPostHeightM = 0;
  let rearPostHeightM = 0;
  let columnHeightM = 0;
  let frontBraceLengthM = 0;
  let backBraceLengthM = 0;
  let postSpanM = 0;
  let numberOfColumns = 0;

  if (structureType === 'single_column') {
    // =========================================================================
    // USER'S DESIGN STANDARD: 1 COLUMN, 1 FRONT BRACING, 1 BACK BRACING
    // =========================================================================
    numberOfColumns = numberOfRafters; // Exactly 1 Column per Rafter!

    // Single Column is placed at ~42% of rafter length from bottom (optimal moment distribution)
    const colPositionAlongRafterM = 0.42 * tableSlantLengthM;
    columnHeightM = Math.max(0.6, groundClearance + colPositionAlongRafterM * sinTilt);
    const colTotalLengthM = columnHeightM + 0.35; // with base connection allowance

    // Front Bracing geometry: Connects column to lower front of rafter
    const frontBraceRafterAttachM = 0.12 * tableSlantLengthM; // attaches near front purlin
    const frontBraceColAttachHeightM = 0.40 * columnHeightM;  // attaches at lower-mid column
    const dxFront = colPositionAlongRafterM * cosTilt - frontBraceRafterAttachM * cosTilt;
    const dyFront = (columnHeightM - frontBraceColAttachHeightM) - (colPositionAlongRafterM * sinTilt - frontBraceRafterAttachM * sinTilt);
    frontBraceLengthM = Math.max(1.1, Math.sqrt(dxFront * dxFront + dyFront * dyFront) || 1.38);

    // Back Bracing geometry: Connects column to upper rear of rafter
    const backBraceRafterAttachM = 0.85 * tableSlantLengthM; // attaches near rear purlin
    const backBraceColAttachHeightM = 0.70 * columnHeightM;  // attaches at upper column
    const dxBack = backBraceRafterAttachM * cosTilt - colPositionAlongRafterM * cosTilt;
    const dyBack = (backBraceRafterAttachM * sinTilt - colPositionAlongRafterM * sinTilt) + (columnHeightM - backBraceColAttachHeightM);
    backBraceLengthM = Math.max(1.3, Math.sqrt(dxBack * dxBack + dyBack * dyBack) || 1.82);

    frontPostHeightM = groundClearance;
    rearPostHeightM = columnHeightM;
    postSpanM = colPositionAlongRafterM;

    // Sizing Single Column: Carries full tributary vertical load and primary shear/moment
    let singleColUnitWeightKgM: number;
    if (isCalibrated && calibration.columnKgPerM) {
      singleColUnitWeightKgM = calibration.columnKgPerM * Math.pow(windRatio, 0.52) * clearanceFactor;
    } else {
      singleColUnitWeightKgM = Math.max(
        3.8,
        (5.8 * Math.pow(windRatio, 0.55) * clearanceFactor) * gradeMultiplier
      );
    }
    const singleColTotalWeightKg = numberOfRafters * colTotalLengthM * singleColUnitWeightKgM;
    const singleColSection = singleColUnitWeightKgM < 5.0
      ? 'C 120x55x2.5 Heavy Post'
      : singleColUnitWeightKgM < 7.0
      ? 'C 125x65x3.0 Column Post'
      : 'C 140x70x3.2 Heavy Column Post';

    // Sizing 1 Front Bracing per rafter
    let frontBraceUnitWeightKgM: number;
    if (isCalibrated && calibration.frontBraceKgPerM) {
      frontBraceUnitWeightKgM = calibration.frontBraceKgPerM * Math.pow(windRatio, 0.45);
    } else {
      frontBraceUnitWeightKgM = Math.max(1.5, (2.1 * Math.pow(windRatio, 0.45)) * gradeMultiplier);
    }
    const frontBraceTotalWeightKg = numberOfRafters * frontBraceLengthM * frontBraceUnitWeightKgM;
    const frontBraceSection = frontBraceUnitWeightKgM < 2.0 ? 'L 40x40x3.0 Strut' : 'L 45x45x3.0 Angle Strut';

    // Sizing 1 Back Bracing per rafter
    let backBraceUnitWeightKgM: number;
    if (isCalibrated && calibration.backBraceKgPerM) {
      backBraceUnitWeightKgM = calibration.backBraceKgPerM * Math.pow(windRatio, 0.48);
    } else {
      backBraceUnitWeightKgM = Math.max(1.8, (2.4 * Math.pow(windRatio, 0.48)) * gradeMultiplier);
    }
    const backBraceTotalWeightKg = numberOfRafters * backBraceLengthM * backBraceUnitWeightKgM;
    const backBraceSection = backBraceUnitWeightKgM < 2.3 ? 'L 45x45x3.0 Angle' : 'L 50x50x3.5 Angle / Tube';

    // Hardware & Clamps
    let hardwarePerModuleKg: number;
    if (isCalibrated && calibration.hardwareKgPerModule) {
      hardwarePerModuleKg = calibration.hardwareKgPerModule;
    } else {
      hardwarePerModuleKg = 1.25 * (designWindSpeedMs > 45 ? 1.2 : 1.0);
    }
    const hardwareTotalWeightKg = totalModulesPerTable * hardwarePerModuleKg;

    totalTableWeightKg =
      purlinTotalWeightKg +
      rafterTotalWeightKg +
      singleColTotalWeightKg +
      frontBraceTotalWeightKg +
      backBraceTotalWeightKg +
      hardwareTotalWeightKg;

    bom = [
      {
        id: 'purlins',
        name: 'Purlins (Continuous Module Rails)',
        category: 'Purlin',
        section: purlinSection,
        count: purlinLines,
        lengthPerUnitM: Math.round(tableWidthM * 10) / 10,
        weightPerUnitKg: Math.round(purlinUnitWeightKgM * 100) / 100,
        totalWeightKg: Math.round(purlinTotalWeightKg),
        tonnagePerMwp: Math.round((purlinTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((purlinTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: `${purlinLines} runs continuous across ${numberOfSpans} spans (${purlinSpanActual.toFixed(2)}m pitch)`,
      },
      {
        id: 'rafters',
        name: 'Main Inclined Rafters',
        category: 'Rafter',
        section: rafterSection,
        count: numberOfRafters,
        lengthPerUnitM: Math.round(rafterLengthPerUnit * 100) / 100,
        weightPerUnitKg: Math.round(rafterUnitWeightKgM * 100) / 100,
        totalWeightKg: Math.round(rafterTotalWeightKg),
        tonnagePerMwp: Math.round((rafterTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((rafterTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: `${numberOfRafters} rafter beams spanning full table depth at ${tiltAngle}° tilt`,
      },
      {
        id: 'single-columns',
        name: 'Single Column / Main Post (1 per Rafter)',
        category: 'Column',
        section: singleColSection,
        count: numberOfRafters,
        lengthPerUnitM: Math.round(colTotalLengthM * 100) / 100,
        weightPerUnitKg: Math.round(singleColUnitWeightKgM * 100) / 100,
        totalWeightKg: Math.round(singleColTotalWeightKg),
        tonnagePerMwp: Math.round((singleColTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((singleColTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: `1 post per rafter (${numberOfRafters} total piles) - 50% foundation count savings`,
      },
      {
        id: 'front-bracing',
        name: 'Front Bracing Strut (1 per Rafter)',
        category: 'Front Bracing',
        section: frontBraceSection,
        count: numberOfRafters,
        lengthPerUnitM: Math.round(frontBraceLengthM * 100) / 100,
        weightPerUnitKg: Math.round(frontBraceUnitWeightKgM * 100) / 100,
        totalWeightKg: Math.round(frontBraceTotalWeightKg),
        tonnagePerMwp: Math.round((frontBraceTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((frontBraceTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: `Pinned diagonal knee strut stabilizing front rafter overhang against wind downforce`,
      },
      {
        id: 'back-bracing',
        name: 'Back Bracing Strut (1 per Rafter)',
        category: 'Back Bracing',
        section: backBraceSection,
        count: numberOfRafters,
        lengthPerUnitM: Math.round(backBraceLengthM * 100) / 100,
        weightPerUnitKg: Math.round(backBraceUnitWeightKgM * 100) / 100,
        totalWeightKg: Math.round(backBraceTotalWeightKg),
        tonnagePerMwp: Math.round((backBraceTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((backBraceTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: `Pinned diagonal knee strut resisting high uplift suction and rafter overturning`,
      },
      {
        id: 'hardware',
        name: 'Hardware, Clamps & Fasteners',
        category: 'Hardware',
        section: 'Alu 6005-T5 Clamps + SS304/Gr 8.8 M12 Bolts',
        count: totalModulesPerTable * 4,
        lengthPerUnitM: 0,
        weightPerUnitKg: Math.round(hardwarePerModuleKg * 100) / 100,
        totalWeightKg: Math.round(hardwareTotalWeightKg),
        tonnagePerMwp: Math.round((hardwareTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((hardwareTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: 'Mid clamps, end clamps, strut connection brackets, M10/M12 fastener sets',
      },
    ];
  } else {
    // =========================================================================
    // DUAL COLUMN (PORTAL) SYSTEM: Front Column + Rear Column + Ties
    // =========================================================================
    numberOfColumns = numberOfRafters * 2;
    const frontOverhang = 0.35;
    const rearOverhang = 0.35;
    postSpanM = Math.max(1.2, tableSlantLengthM - frontOverhang - rearOverhang);
    frontPostHeightM = Math.max(0.4, groundClearance + frontOverhang * sinTilt);
    rearPostHeightM = frontPostHeightM + postSpanM * sinTilt;
    columnHeightM = (frontPostHeightM + rearPostHeightM) / 2;

    const frontColLengthM = frontPostHeightM + 0.25;
    const frontColUnitWeightKgM = Math.max(
      2.4,
      (3.8 * Math.pow(windRatio, 0.5) * clearanceFactor) * gradeMultiplier
    );
    const frontColTotalWeightKg = numberOfRafters * frontColLengthM * frontColUnitWeightKgM;
    const frontColSection = frontColUnitWeightKgM < 3.5 ? 'C 90x45x2.0 Post' : 'C 100x50x2.5 Post';

    const rearColLengthM = rearPostHeightM + 0.25;
    const rearColUnitWeightKgM = Math.max(
      2.8,
      (frontColUnitWeightKgM * (1 + 0.08 * (rearPostHeightM - 1.0)))
    );
    const rearColTotalWeightKg = numberOfRafters * rearColLengthM * rearColUnitWeightKgM;
    const rearColSection = rearColUnitWeightKgM < 4.2 ? 'C 100x50x2.2 Post' : 'C 120x60x2.8 Post';

    const bracingSets = Math.max(1, Math.ceil(numberOfSpans / 2));
    const kneeBraceCount = numberOfRafters * 2;
    const diagBraceCount = bracingSets * 4;
    const avgBraceLengthM = Math.sqrt(Math.pow(purlinSpanActual, 2) + Math.pow(rearPostHeightM, 2));
    const braceUnitWeightKgM = Math.max(
      1.2,
      (2.1 * Math.pow(windRatio, 0.45) * clearanceFactor) * gradeMultiplier
    );
    const bracingTotalWeightKg = (diagBraceCount * (avgBraceLengthM * 0.7) + kneeBraceCount * 1.3) * braceUnitWeightKgM;
    const bracingSection = braceUnitWeightKgM < 2.0 ? 'L 40x40x3.0 Angle' : 'L 50x50x4.0 Angle';

    const hardwarePerModuleKg = 1.35 * (designWindSpeedMs > 45 ? 1.25 : 1.0);
    const hardwareTotalWeightKg = totalModulesPerTable * hardwarePerModuleKg;

    totalTableWeightKg =
      purlinTotalWeightKg +
      rafterTotalWeightKg +
      frontColTotalWeightKg +
      rearColTotalWeightKg +
      bracingTotalWeightKg +
      hardwareTotalWeightKg;

    bom = [
      {
        id: 'purlins',
        name: 'Purlins (Module Support Rails)',
        category: 'Purlin',
        section: purlinSection,
        count: purlinLines,
        lengthPerUnitM: Math.round(tableWidthM * 10) / 10,
        weightPerUnitKg: Math.round(purlinUnitWeightKgM * 100) / 100,
        totalWeightKg: Math.round(purlinTotalWeightKg),
        tonnagePerMwp: Math.round((purlinTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((purlinTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: `${purlinLines} continuous runs, span ${purlinSpanActual.toFixed(2)}m`,
      },
      {
        id: 'rafters',
        name: 'Rafters / Main Slant Beams',
        category: 'Rafter',
        section: rafterSection,
        count: numberOfRafters,
        lengthPerUnitM: Math.round(rafterLengthPerUnit * 100) / 100,
        weightPerUnitKg: Math.round(rafterUnitWeightKgM * 100) / 100,
        totalWeightKg: Math.round(rafterTotalWeightKg),
        tonnagePerMwp: Math.round((rafterTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((rafterTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: `${numberOfRafters} inclined beams, tilted at ${tiltAngle}°`,
      },
      {
        id: 'front-columns',
        name: 'Front Columns / Ground Posts',
        category: 'Column',
        section: frontColSection,
        count: numberOfRafters,
        lengthPerUnitM: Math.round(frontColLengthM * 100) / 100,
        weightPerUnitKg: Math.round(frontColUnitWeightKgM * 100) / 100,
        totalWeightKg: Math.round(frontColTotalWeightKg),
        tonnagePerMwp: Math.round((frontColTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((frontColTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: `Clearance: ${groundClearance.toFixed(2)}m`,
      },
      {
        id: 'rear-columns',
        name: 'Rear Columns / High Posts',
        category: 'Column',
        section: rearColSection,
        count: numberOfRafters,
        lengthPerUnitM: Math.round(rearColLengthM * 100) / 100,
        weightPerUnitKg: Math.round(rearColUnitWeightKgM * 100) / 100,
        totalWeightKg: Math.round(rearColTotalWeightKg),
        tonnagePerMwp: Math.round((rearColTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((rearColTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: `Taller column: ${rearPostHeightM.toFixed(2)}m`,
      },
      {
        id: 'bracing',
        name: 'Diagonal & Sway Bracing',
        category: 'Bracing',
        section: bracingSection,
        count: diagBraceCount + kneeBraceCount,
        lengthPerUnitM: Math.round(avgBraceLengthM * 100) / 100,
        weightPerUnitKg: Math.round(braceUnitWeightKgM * 100) / 100,
        totalWeightKg: Math.round(bracingTotalWeightKg),
        tonnagePerMwp: Math.round((bracingTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((bracingTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: 'Cross-bay X-bracing & column knee braces',
      },
      {
        id: 'hardware',
        name: 'Hardware, Fasteners & Clamps',
        category: 'Hardware',
        section: 'Alu 6005 Clamps + SS304/HDG Gr 8.8 Fasteners',
        count: totalModulesPerTable * 4,
        lengthPerUnitM: 0,
        weightPerUnitKg: hardwarePerModuleKg,
        totalWeightKg: Math.round(hardwareTotalWeightKg),
        tonnagePerMwp: Math.round((hardwareTotalWeightKg / 1000) * tablesPerMwp * 100) / 100,
        percentage: Math.round((hardwareTotalWeightKg / totalTableWeightKg) * 1000) / 10,
        notes: 'Mid clamps, end clamps, M10/M12 bolt assemblies',
      },
    ];
  }

  const weightPerModuleKg = totalTableWeightKg / totalModulesPerTable;
  const tonnagePerMwp = (totalTableWeightKg / 1000) / (tableCapacityKwp / 1000);

  // Foundation Reactions
  const maxColumnAxialLoadKn = (totalWindForceKn * 0.7 + (moduleWeight * totalModulesPerTable * 9.81) / 1000) / numberOfRafters;
  const maxColumnUpliftKn = (windUpliftPressureKpa * tableAreaM2 * 0.65) / numberOfRafters;

  // Engineering checks
  let windRiskLevel: CalculationResult['checks']['windRiskLevel'] = 'Low';
  if (designWindSpeedMs >= 50) {
    windRiskLevel = 'Severe (Cyclonic)';
  } else if (designWindSpeedMs >= 44) {
    windRiskLevel = 'High';
  } else if (designWindSpeedMs >= 36) {
    windRiskLevel = 'Moderate';
  }

  const clearanceRisk: CalculationResult['checks']['clearanceRisk'] =
    groundClearance > 1.2 ? 'Elevated Overturning' : 'Standard';

  const slendernessCheck: CalculationResult['checks']['slendernessCheck'] =
    columnHeightM > 2.4 || designWindSpeedMs > 47
      ? 'Requires Cross-Bracing'
      : 'Passed';

  let recommendedFooting = 'Rammed C-Channel / W-Beam Single Steel Pile (1.8m - 2.2m embedment)';
  if (designWindSpeedMs > 47 || groundClearance > 1.2) {
    recommendedFooting = 'Bored Cast-in-Situ Concrete Pile (350mm dia) or Heavy Rammed Pile with Shear Wings';
  } else if (designWindSpeedMs < 36 && groundClearance <= 0.6) {
    recommendedFooting = 'Standard Rammed C-Post / Ground Screw';
  }

  return {
    tonnagePerMwp: Math.round(tonnagePerMwp * 100) / 100,
    totalTableWeightKg: Math.round(totalTableWeightKg),
    weightPerModuleKg: Math.round(weightPerModuleKg * 100) / 100,
    totalModulesPerTable,
    tableCapacityKwp: Math.round(tableCapacityKwp * 100) / 100,
    tablesPerMwp: Math.round(tablesPerMwp * 10) / 10,
    totalModulesPerMwp,
    structureType,
    tableWidthM: Math.round(tableWidthM * 100) / 100,
    tableSlantLengthM: Math.round(tableSlantLengthM * 100) / 100,
    columnHeightM: Math.round(columnHeightM * 100) / 100,
    frontPostHeightM: Math.round(frontPostHeightM * 100) / 100,
    rearPostHeightM: Math.round(rearPostHeightM * 100) / 100,
    frontBraceLengthM: Math.round(frontBraceLengthM * 100) / 100,
    backBraceLengthM: Math.round(backBraceLengthM * 100) / 100,
    topEdgeHeightM: Math.round(topEdgeHeightM * 100) / 100,
    postSpanM: Math.round(postSpanM * 100) / 100,
    numberOfRafters,
    numberOfColumns,
    designWindSpeedMs: Math.round(designWindSpeedMs * 10) / 10,
    basicWindPressureKpa: Math.round(basicWindPressureKpa * 1000) / 1000,
    designWindPressureKpa: Math.round(designWindPressureKpa * 1000) / 1000,
    windUpliftPressureKpa: Math.round(windUpliftPressureKpa * 1000) / 1000,
    totalWindForceKn: Math.round(totalWindForceKn * 10) / 10,
    overturningMomentKnm: Math.round(overturningMomentKnm * 10) / 10,
    maxColumnAxialLoadKn: Math.round(maxColumnAxialLoadKn * 10) / 10,
    maxColumnUpliftKn: Math.round(maxColumnUpliftKn * 10) / 10,
    bom,
    checks: {
      windRiskLevel,
      clearanceRisk,
      slendernessCheck,
      recommendedFooting,
    },
  };
}
