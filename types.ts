export interface CalibrationData {
  pixels_per_cm: number;
  message?: string;
  success?: boolean;
  debug_image?: string;
}

export interface GarmentConfig {
  [key: string]: {
    measurements: string[];
  };
}

export interface Measurement {
  name: string;
  value: number;
  unit?: string;
}

export interface ProcessResult {
  measure_image: string; // Base64
  detect_image: string; // Base64
  edge_image: string; // Base64
  detected_size: string;
  confidence: number;
  qc_status: 'PASS' | 'FAIL' | 'UNKNOWN';
  qc_failures: string[];
  data: Measurement[];
  error?: string;
  report_id?: string;
}

export interface Report {
  timestamp: string;
  garment_type: string;
  detected_size: string;
  qc_status: string;
}

export enum ViewState {
  MEASURE = 'MEASURE',
  MENU = 'MENU',
  CALIBRATE = 'CALIBRATE',
  REFERENCE = 'REFERENCE',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS',
}

export enum CameraRotation {
  DEG_0 = 0,
  DEG_90 = 90,
  DEG_180 = 180,
  DEG_270 = 270,
}