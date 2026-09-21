export type WindSpeedUnit = 'm/s' | 'km/h' | 'mph';
export type DimensionUnit = 'm' | 'mm';

export type TablePresetId = '2Px13' | '2Px14' | '2Px26' | '2Px28' | '1Px26' | 'custom';

export type StructureType = 'single_column' | 'dual_column';

export interface TablePreset {
  id: TablePresetId;
  name: string;
  rows: number; // 1 or 2
  columns: number; // e.g. 13, 14, 26, 28
  description: string;
}

export type SteelGrade = 'YSt-550' | 'YSt-350' | 'YSt-250' | 'Aluminum-6005-T5';

export interface MMSInputs {
  // Required user inputs
  windSpeed: number; // in current windSpeedUnit
  windSpeedUnit: WindSpeedUnit;
  tiltAngle: number; // degrees (e.g. 5 to 45)
  moduleWeight: number; // kg (e.g. 20 to 38 kg)
  groundClearance: number; // in meters (e.g. 0.3 to 2.5 m)
  tablePreset: TablePresetId;
  customRows: number;
  customColumns: number;

  // Structural Topology: Default 'single_column' (1 Column, 1 Front Bracing, 1 Back Bracing)
  structureType: StructureType;

  // Optional calibration from user uploaded BOQ
  calibration?: DesignStandardCalibration | null;

  // Secondary engineering parameters (with solid engineering defaults)
  moduleWattage: number; // Wp (e.g. 580 Wp default)
  moduleLength: number; // mm (default 2278 mm)
  moduleWidth: number; // mm (default 1134 mm)
  steelGrade: SteelGrade;
  purlinSpan: number; // meters between post columns (default ~3.2m)
  terrainCategory: 1 | 2 | 3; // 1=open sea/desert, 2=open fields, 3=suburban
}

export interface BomComponent {
  id: string;
  name: string;
  category: 'Purlin' | 'Rafter' | 'Column' | 'Front Bracing' | 'Back Bracing' | 'Bracing' | 'Hardware';
  section: string;
  count: number;
  lengthPerUnitM: number;
  weightPerUnitKg: number;
  totalWeightKg: number;
  tonnagePerMwp: number;
  percentage: number;
  notes: string;
}

export interface CalculationResult {
  // Core outcome requested by user
  tonnagePerMwp: number; // Metric Tonnes / MWp
  totalTableWeightKg: number; // kg per table
  weightPerModuleKg: number; // kg steel per module
  
  // Table electrical & geometric stats
  totalModulesPerTable: number;
  tableCapacityKwp: number;
  tablesPerMwp: number;
  totalModulesPerMwp: number;
  
  // Topology
  structureType: StructureType;
  
  // Geometry
  tableWidthM: number;
  tableSlantLengthM: number;
  columnHeightM: number; // Center post height for single-column system
  frontPostHeightM: number;
  rearPostHeightM: number;
  frontBraceLengthM: number; // Length of front diagonal strut
  backBraceLengthM: number;  // Length of back diagonal strut
  topEdgeHeightM: number;
  postSpanM: number;
  numberOfRafters: number;
  numberOfColumns: number; // numberOfRafters for single-column, 2 * numberOfRafters for dual
  
  // Structural Mechanics
  designWindSpeedMs: number; // m/s
  basicWindPressureKpa: number; // kN/m² (qz = 0.6 * V^2 / 1000)
  designWindPressureKpa: number; // kN/m² with aerodynamic factor & topography
  windUpliftPressureKpa: number; // net suction kN/m²
  totalWindForceKn: number; // kN per table
  overturningMomentKnm: number; // kN·m at column bases
  maxColumnAxialLoadKn: number; // kN
  maxColumnUpliftKn: number; // kN
  
  // Detailed BOM
  bom: BomComponent[];
  
  // Structural health / engineering check flags
  checks: {
    windRiskLevel: 'Low' | 'Moderate' | 'High' | 'Severe (Cyclonic)';
    clearanceRisk: 'Standard' | 'Elevated Overturning';
    slendernessCheck: 'Passed' | 'Requires Cross-Bracing';
    recommendedFooting: string;
  };
}

export interface BoqParsedItem {
  id: string;
  originalDescription: string;
  detectedCategory: 'Purlin' | 'Rafter' | 'Column' | 'Front Bracing' | 'Back Bracing' | 'Hardware' | 'Other';
  section: string;
  quantity: number;
  lengthM: number;
  unitWeightKg: number;
  totalWeightKg: number;
  notes?: string;
}

export interface BoqAnalysisResult {
  fileName: string;
  fileSize: number;
  analyzedAt: string;
  structureType: StructureType;
  detectedTablePreset: TablePresetId;
  totalModulesDetected: number;
  moduleWattageAssumed: number;
  tableCapacityKwp: number;
  totalSteelWeightKg: number;
  tonnagePerMwp: number;
  weightPerModuleKg: number;
  items: BoqParsedItem[];
  categoryTotals: Record<string, { weightKg: number; percentage: number; count: number }>;
  calibrationProfile: DesignStandardCalibration;
}

export interface DesignStandardCalibration {
  standardName: string;
  sourceFileName?: string;
  baseTableModules: number;
  baseTonnagePerMwp: number;
  purlinKgPerM: number;
  rafterKgPerM: number;
  columnKgPerM: number;
  frontBraceKgPerM: number;
  backBraceKgPerM: number;
  hardwareKgPerModule: number;
  structureType: StructureType;
  calibratedAt: string;
}
