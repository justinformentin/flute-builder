import { pipeId, pipePresets } from '../materials/pipePresets';

export interface DesignState {
  root: number;
  octave: number;
  scaleId: string;
  a4: number;
  pipeIndex: number;
  outsideDiameterMm: number;
  wallMm: number;
  embouchureMm: number;
  lipCoveragePercent: number;
  lipPlate: boolean;
  lipPlateMm: number;
  overrideChimney: boolean;
  chimneyMm: number;
  holeDiameters: number[];
  temperatureC: number;
  adjustSpeedForTemperature: boolean;
  applyEndCorrection: boolean;
  applyEmbouchureCorrection: boolean;
  applyToneHoleCorrections: boolean;
  plugOffsetMm: number;
  plugThicknessMm: number;
  headMarginMm: number;
  roundToMm: number;
}

export const initialDesign: DesignState = {
  root: 2,
  octave: 4,
  scaleId: 'major',
  a4: 440,
  pipeIndex: 1,
  outsideDiameterMm: pipePresets[1].odMm,
  wallMm: pipePresets[1].wallMm,
  embouchureMm: 10,
  lipCoveragePercent: 0,
  lipPlate: false,
  lipPlateMm: 1.5,
  overrideChimney: false,
  chimneyMm: pipePresets[1].wallMm,
  holeDiameters: Array(11).fill(7),
  temperatureC: 20,
  adjustSpeedForTemperature: false,
  applyEndCorrection: true,
  applyEmbouchureCorrection: true,
  applyToneHoleCorrections: true,
  plugOffsetMm: pipeId(pipePresets[1]),
  plugThicknessMm: 12,
  headMarginMm: 8,
  roundToMm: 5,
};
