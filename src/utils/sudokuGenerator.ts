import { SudokuCell, SudokuType, SudokuDifficulty } from '../types/sudokuTypes';

const SHAPE_MAP = ['▲', '■', '●', '★', '◆', '▼'];

const IRREGULAR_MAP = [
  [0, 0, 0, 0, 1, 1, 1, 1, 1],
  [0, 0, 0, 2, 2, 2, 2, 1, 1],
  [0, 0, 2, 2, 2, 2, 2, 1, 1],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [3, 3, 3, 4, 4, 4, 5, 5, 5],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
  [6, 6, 6, 7, 7, 7, 8, 8, 8],
  [6, 6, 6, 7, 7, 7, 8, 8, 8]
];

export const generateSudoku = (type: SudokuType, difficulty: SudokuDifficulty): SudokuCell[] => {
  let size = 9;
  if (type === '4x4' || type === 'shape') size = 4;
  else if (type === '6x6') size = 6;
  else if (type === '16x16') size = 16;

  let board: string[][] = Array.from({ length: size }, () => Array(size).fill(''));
  
  const getBlockId = (r: number, c: number): number => {
    if (type === '4x4' || type === 'shape') {
      return Math.floor(r / 2) * 2 + Math.floor(c / 2);
    }
    if (type === '6x6') {
      return Math.floor(r / 2) * 3 + Math.floor(c / 3);
    }
    if (type === '16x16') {
      return Math.floor(r / 4) * 4 + Math.floor(c / 4);
    }
    if (type === 'irregular') {
      const rowMap = IRREGULAR_MAP[r] || [];
      return rowMap[c] || 0;
    }
    return Math.floor(r / 3) * 3 + Math.floor(c / 3);
  };

  const isValid = (r: number, c: number, val: string): boolean => {
    for (let i = 0; i < size; i++) {
      if (board[r][i] === val) return false;
      if (board[i][c] === val) return false;
    }
    const currentBlock = getBlockId(r, c);
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        if (getBlockId(row, col) === currentBlock && board[row][col] === val) {
          return false;
        }
      }
    }
    return true;
  };

  let steps = 0;
  const fillValues = (): boolean => {
    steps++;
    if (steps > 1500) return false;

    const symbols = Array.from({ length: size }, (_, i) => {
      if (size === 16) return (i + 1).toString(16).toUpperCase();
      return (i + 1).toString();
    });

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c] === '') {
          const shuffled = [...symbols].sort(() => Math.random() - 0.5);
          for (const val of shuffled) {
            if (isValid(r, c, val)) {
              board[r][c] = val;
              if (fillValues()) return true;
              board[r][c] = '';
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  let success = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    board = Array.from({ length: size }, () => Array(size).fill(''));
    steps = 0;
    if (fillValues()) {
      success = true;
      break;
    }
  }

  if (!success) {
    board = Array.from({ length: size }, () => Array(size).fill(''));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = ((r * 3 + Math.floor(r / 3) + c) % size) + 1;
        if (size === 16) board[r][c] = val.toString(16).toUpperCase();
        else board[r][c] = val.toString();
      }
    }
  }

  const originalBoard = board.map(row => [...row]);
  
  let attempts = 0;
  if (difficulty === 'easy') attempts = Math.floor(size * size * 0.3);
  else if (difficulty === 'medium') attempts = Math.floor(size * size * 0.5);
  else attempts = Math.floor(size * size * 0.7);

  while (attempts > 0) {
    const r = Math.floor(Math.random() * size);
    const c = Math.floor(Math.random() * size);
    if (board[r][c] !== '') {
      board[r][c] = '';
      attempts--;
    }
  }

  const cells: SudokuCell[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let finalVal = board[r][c];
      let finalOrig = originalBoard[r][c];
      if (type === 'shape') {
        const numVal = parseInt(finalVal) || 0;
        const numOrig = parseInt(finalOrig) || 0;
        finalVal = numVal > 0 ? SHAPE_MAP[numVal - 1] : '';
        finalOrig = SHAPE_MAP[numOrig - 1];
      }
      cells.push({
        row: r,
        col: c,
        value: finalVal,
        originalValue: finalOrig,
        isGiven: board[r][c] !== '',
        blockId: getBlockId(r, c)
      });
    }
  }

  return cells;
};
