export interface MazeDimensions {
  rows: number;
  cols: number;
}

export type CellType = 'empty' | 'start' | 'goal' | 'math';

export interface CellInstance {
  r: number;
  c: number;
  type: CellType;
  value?: string;
  isVisited?: boolean;
}

export interface MazeLevelData {
  dims: MazeDimensions;
  grid: Record<string, CellInstance>;
  startVal: number;
  targetGoalScore: number;
  timerSeconds: number;
}

export interface MazeBundleData {
  id: string;
  name: string;
  levels: MazeLevelData[];
}

