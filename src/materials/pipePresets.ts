export type PipePreset = {
  id: string;
  name: string;
  odMm: number;
  wallMm: number;
};
export const pipePresets: PipePreset[] = [
  {
    id: 'sch40-050',
    name: 'PVC Schedule 40 · 1/2″',
    odMm: 21.336,
    wallMm: 2.769,
  },
  {
    id: 'sch40-075',
    name: 'PVC Schedule 40 · 3/4″',
    odMm: 26.67,
    wallMm: 2.87,
  },
  {
    id: 'sch40-100',
    name: 'PVC Schedule 40 · 1″',
    odMm: 33.401,
    wallMm: 3.378,
  },
  {
    id: 'sch40-125',
    name: 'PVC Schedule 40 · 1 1/4″',
    odMm: 42.164,
    wallMm: 3.556,
  },
  {
    id: 'sch40-150',
    name: 'PVC Schedule 40 · 1 1/2″',
    odMm: 48.26,
    wallMm: 3.683,
  },
  {
    id: 'sch40-200',
    name: 'PVC Schedule 40 · 2″',
    odMm: 60.325,
    wallMm: 3.912,
  },
];
export const pipeId = (p: Pick<PipePreset, 'odMm' | 'wallMm'>) =>
  p.odMm - 2 * p.wallMm;
