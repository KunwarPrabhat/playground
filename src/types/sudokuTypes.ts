export type SudokuType = '4x4' | '6x6' | '9x9' | '16x16' | 'irregular' | 'shape';
export type SudokuDifficulty = 'easy' | 'medium' | 'hard';

export interface SudokuLevelConfig {
  type: SudokuType;
  difficulty: SudokuDifficulty;
}

export interface SudokuBundleData {
  id: string;
  name: string;
  levels: SudokuLevelConfig[];
  timerSeconds: number;
  difficultyLabel: SudokuDifficulty;
}

export interface SudokuCell {
  row: number;
  col: number;
  value: string;
  originalValue: string;
  isGiven: boolean;
  blockId: number;
}
