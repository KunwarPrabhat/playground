import { MazeDimensions, CellInstance } from '../../../types/mazeTypes';

// Optimized linear DFS solver
export function findRandomPath(
  rows: number,
  cols: number,
  start: { r: number; c: number },
  goal: { r: number; c: number }
): { r: number; c: number }[] | null {
  const visited = new Set<string>();
  const path: { r: number; c: number }[] = [];

  function dfs(r: number, c: number): boolean {
    const key = `${r},${c}`;
    visited.add(key);
    path.push({ r, c });

    if (r === goal.r && c === goal.c) {
      return true;
    }

    const neighbors = [
      { r: r - 1, c },
      { r: r + 1, c },
      { r: r, c: c - 1 },
      { r: r, c: c + 1 },
    ].filter(n => n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && !visited.has(`${n.r},${n.c}`));

    // Shuffle neighbors randomly to ensure different paths
    for (let i = neighbors.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
    }

    for (const next of neighbors) {
      if (dfs(next.r, next.c)) {
        return true;
      }
    }

    path.pop();
    // Do NOT remove from visited to prevent exponential dead-end re-evaluation
    return false;
  }

  if (dfs(start.r, start.c)) {
    return path;
  }
  return null;
}

// Generate smart mathematical operators
export function getRandomMathOp(currentScore: number): string {
  const ops = ['+', '-', '*'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  if (op === '*') {
    if (currentScore >= 1 && currentScore <= 15) {
      const val = Math.random() < 0.75 ? 2 : 3;
      return `*${val}`;
    } else {
      const val = [1, 2, 3, 5][Math.floor(Math.random() * 4)];
      return `+${val}`;
    }
  } else if (op === '-') {
    if (currentScore > 6) {
      const val = [1, 2, 3, 5][Math.floor(Math.random() * 4)];
      return `-${val}`;
    } else {
      const val = [1, 2, 3, 5][Math.floor(Math.random() * 4)];
      return `+${val}`;
    }
  } else {
    const val = [1, 2, 3, 5, 10][Math.floor(Math.random() * 5)];
    return `+${val}`;
  }
}
