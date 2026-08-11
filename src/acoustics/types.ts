export interface ToneHoleInput {
  cents: number;
  diameterMm: number;
}

export interface FluteInput {
  fundamentalHz: number;
  boreDiameterMm: number;
  wallThicknessMm: number;
  embouchureDiameterMm: number;
  embouchureChimneyMm: number;
  toneHoles: ToneHoleInput[];
  temperatureC: number;
  adjustSpeedForTemperature?: boolean;
  applyEndCorrection?: boolean;
  applyEmbouchureCorrection?: boolean;
  applyToneHoleCorrections?: boolean;
  plugOffsetMm?: number;
  plugThicknessMm?: number;
  headMarginMm?: number;
  constructionRoundingMm?: number;
}

export interface Notice {
  severity: 'error' | 'warning' | 'information';
  message: string;
}

export interface HoleResult extends ToneHoleInput {
  frequencyHz: number;
  fromFootMm: number;
  fromEmbouchureMm: number;
  centerSpacingMm?: number;
  edgeSpacingMm?: number;
  cutoffHz: number;
}

export interface FluteResult {
  speedOfSoundMps: number;
  soundingLengthMm: number;
  endCorrectionMm: number;
  embouchureCorrectionMm: number;
  holes: HoleResult[];
  plugOffsetMm: number;
  plugFaceMm: number;
  plugThicknessMm: number;
  headMarginMm: number;
  physicalLengthMm: number;
  suggestedBlankMm: number;
  notices: Notice[];
}
