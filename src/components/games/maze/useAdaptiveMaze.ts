import React, { useState, useEffect, useRef } from 'react';
import { Animated, Alert } from 'react-native';
import { MazeDimensions, CellType, CellInstance, MazeLevelData, MazeBundleData } from '../../../types/mazeTypes';
import { useGame } from '../../../context/GameContext';
import { findRandomPath, getRandomMathOp } from './mazeHelpers';

export function useAdaptiveMaze(onBack?: () => void) {
  const { publishMaze, setTabBarVisible } = useGame();

  const [bundleName, setBundleName] = useState('My Maze Challenge');
  const [levels, setLevels] = useState<MazeLevelData[]>([]);
  const [activeLevelIdx, setActiveLevelIdx] = useState(0);

  const [brush, setBrush] = useState<{ type: CellType; value?: string } | null>(null);

  const [isPlayMode, setIsPlayMode] = useState(false);
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  const [score, setScore] = useState(1);
  const [targetGoal, setTargetGoal] = useState(15);
  const [history, setHistory] = useState<{ playerPos: { r: number; c: number }; score: number; grid: Record<string, CellInstance> }[]>([]);

  const [overlay, setOverlay] = useState<{ visible: boolean; type: 'goal' | 'math' | null; coord: { r: number; c: number } | null }>({ visible: false, type: null, coord: null });
  const [drawerVisible, setDrawerVisible] = useState(true);
  const [statusModal, setStatusModal] = useState<{ visible: boolean; success: boolean; msg: string } | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const [headerVisible, setHeaderVisible] = useState(true);
  const lastOffsetY = useRef(0);
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: headerVisible ? 0 : -100,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [headerVisible]);

  useEffect(() => {
    if (isPlayMode) {
      setTabBarVisible(false);
    } else {
      setTabBarVisible(true);
      setHeaderVisible(true);
    }
  }, [isPlayMode, setTabBarVisible]);

  const createEmptyGrid = (rows: number, cols: number): Record<string, CellInstance> => {
    const grid: Record<string, CellInstance> = {};
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        grid[`${r},${c}`] = { r, c, type: 'empty' };
      }
    }
    return grid;
  };

  useEffect(() => {
    const initialLevel: MazeLevelData = {
      dims: { rows: 6, cols: 6 },
      grid: createEmptyGrid(6, 6),
      startVal: 0,
      targetGoalScore: 15,
      timerSeconds: 60,
    };
    setLevels([initialLevel]);
    setActiveLevelIdx(0);
  }, []);

  const activeLevel = levels[activeLevelIdx];

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const { layoutMeasurement, contentSize, contentOffset } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;

    if (isCloseToBottom) {
      setHeaderVisible(false);
      if (!isPlayMode) setTabBarVisible(false);
    } else if (currentOffset <= 20) {
      setHeaderVisible(true);
      if (!isPlayMode) setTabBarVisible(true);
    } else if (currentOffset - lastOffsetY.current > 5) {
      setHeaderVisible(false);
      if (!isPlayMode) setTabBarVisible(false);
    } else if (lastOffsetY.current - currentOffset > 5) {
      setHeaderVisible(true);
      if (!isPlayMode) setTabBarVisible(true);
    }

    lastOffsetY.current = currentOffset;
  };

  const handleSelectDimension = (d: MazeDimensions) => {
    setLevels((prev) => {
      const next = [...prev];
      next[activeLevelIdx] = {
        ...next[activeLevelIdx],
        dims: d,
        grid: createEmptyGrid(d.rows, d.cols),
        startVal: 0,
        targetGoalScore: 15,
      };
      return next;
    });
  };

  const handleAddLevel = () => {
    const newLevel: MazeLevelData = {
      dims: { rows: 6, cols: 6 },
      grid: createEmptyGrid(6, 6),
      startVal: 0,
      targetGoalScore: 15,
      timerSeconds: 60,
    };
    setLevels((prev) => [...prev, newLevel]);
    setActiveLevelIdx(levels.length);
  };

  const handleRemoveLevel = (idx: number) => {
    if (levels.length <= 1) return;
    setLevels((prev) => prev.filter((_, i) => i !== idx));
    setActiveLevelIdx((prev) => {
      if (idx === prev) {
        return Math.max(0, prev - 1);
      }
      return prev > idx ? prev - 1 : prev;
    });
  };

  const handleSpread = () => {
    if (!activeLevel) return;
    const { dims, grid, targetGoalScore, startVal } = activeLevel;

    const startCell = Object.values(grid).find((c) => c.type === 'start');
    const goalCell = Object.values(grid).find((c) => c.type === 'goal');

    if (!startCell || !goalCell) {
      Alert.alert(
        'Missing Points',
        'Please select and place both a Start (S) and a Goal (G) point in the grid before spreading numbers.'
      );
      return;
    }

    const paths: { r: number; c: number }[][] = [];
    for (let i = 0; i < 5; i++) {
      const p = findRandomPath(dims.rows, dims.cols, startCell, goalCell);
      if (p) paths.push(p);
    }

    if (paths.length === 0) return;

    const nextGrid: Record<string, CellInstance> = {};
    for (let r = 0; r < dims.rows; r++) {
      for (let c = 0; c < dims.cols; c++) {
        nextGrid[`${r},${c}`] = { r, c, type: 'empty' };
      }
    }

    nextGrid[`${startCell.r},${startCell.c}`] = { r: startCell.r, c: startCell.c, type: 'start' };
    nextGrid[`${goalCell.r},${goalCell.c}`] = { r: goalCell.r, c: goalCell.c, type: 'goal', value: `G:${targetGoalScore}` };

    const makeFixOp = (diff: number) => {
      if (diff === 0) return '*1';
      if (diff > 0) return `+${diff}`;
      return `-${-diff}`;
    };

    const nodeScores = new Map<string, number>();

    paths.forEach((path) => {
      if (path.length <= 2) return;

      const firstIntermediate = `${path[1].r},${path[1].c}`;
      if (nodeScores.has(firstIntermediate)) {
        return;
      }

      let scoreEntering = startVal;

      for (let i = 1; i < path.length - 1; i++) {
        const curr = path[i];
        const next = path[i + 1];
        const key = `${curr.r},${curr.c}`;
        const nextKey = `${next.r},${next.c}`;

        const isNextGoal = i + 1 === path.length - 1;
        const isNextMerge = nodeScores.has(nextKey);

        if (isNextGoal || isNextMerge) {
          const requiredTarget = isNextGoal ? targetGoalScore : nodeScores.get(nextKey)!;
          const diff = requiredTarget - scoreEntering;
          const op = makeFixOp(diff);

          nextGrid[key] = { r: curr.r, c: curr.c, type: 'math', value: op };
          nodeScores.set(key, scoreEntering);
          break;
        } else {
          if (Math.random() < 0.5) {
            const op = getRandomMathOp(scoreEntering);
            const opChar = op.charAt(0);
            const val = parseFloat(op.substring(1)) || 0;

            let scoreLeaving = scoreEntering;
            if (opChar === '+') scoreLeaving += val;
            if (opChar === '-') scoreLeaving -= val;
            if (opChar === '*') scoreLeaving *= val;

            nextGrid[key] = { r: curr.r, c: curr.c, type: 'math', value: op };
            nodeScores.set(key, scoreEntering);
            scoreEntering = scoreLeaving;
          } else {
            nextGrid[key] = { r: curr.r, c: curr.c, type: 'empty' };
            nodeScores.set(key, scoreEntering);
          }
        }
      }
    });

    for (let r = 0; r < dims.rows; r++) {
      for (let c = 0; c < dims.cols; c++) {
        const key = `${r},${c}`;
        if (!nodeScores.has(key) && nextGrid[key].type === 'empty') {
          if (Math.random() < 0.15) {
            const distractorOp = getRandomMathOp(Math.floor(Math.random() * 20) + 1);
            nextGrid[key] = { r, c, type: 'math', value: distractorOp };
          }
        }
      }
    }

    setLevels((prev) => {
      const next = [...prev];
      next[activeLevelIdx] = {
        ...next[activeLevelIdx],
        grid: nextGrid,
      };
      return next;
    });
  };

  const handleCellPress = (r: number, c: number) => {
    if (isPlayMode || !brush || !activeLevel) return;
    const key = `${r},${c}`;
    if (brush.type === 'goal') {
      setOverlay({ visible: true, type: 'goal', coord: { r, c } });
    } else if (brush.type === 'math') {
      setOverlay({ visible: true, type: 'math', coord: { r, c } });
    } else if (brush.type === 'start') {
      setLevels((prev) => {
        const next = [...prev];
        const nextGrid = { ...next[activeLevelIdx].grid };
        Object.keys(nextGrid).forEach((k) => {
          if (nextGrid[k].type === 'start') {
            nextGrid[k] = { ...nextGrid[k], type: 'empty' };
          }
        });
        nextGrid[key] = { r, c, type: 'start' };
        next[activeLevelIdx] = { ...next[activeLevelIdx], grid: nextGrid };
        return next;
      });
    } else {
      setLevels((prev) => {
        const next = [...prev];
        const nextGrid: Record<string, CellInstance> = {
          ...next[activeLevelIdx].grid,
          [key]: { r, c, type: brush.type },
        };
        next[activeLevelIdx] = { ...next[activeLevelIdx], grid: nextGrid };
        return next;
      });
    }
  };

  const handleSaveOverlay = (val: string) => {
    if (!overlay.coord || !activeLevel) return;
    const { r, c } = overlay.coord;
    const key = `${r},${c}`;
    if (overlay.type === 'goal') {
      const parsed = parseInt(val) || 15;
      setLevels((prev) => {
        const next = [...prev];
        const nextGrid = { ...next[activeLevelIdx].grid };
        Object.keys(nextGrid).forEach((k) => {
          if (nextGrid[k].type === 'goal') {
            nextGrid[k] = { ...nextGrid[k], type: 'empty', value: undefined };
          }
        });
        nextGrid[key] = { r, c, type: 'goal', value: `G:${parsed}` };
        next[activeLevelIdx] = {
          ...next[activeLevelIdx],
          grid: nextGrid,
          targetGoalScore: parsed,
        };
        return next;
      });
    } else {
      setLevels((prev) => {
        const next = [...prev];
        const nextGrid: Record<string, CellInstance> = {
          ...next[activeLevelIdx].grid,
          [key]: { r, c, type: 'math', value: val },
        };
        next[activeLevelIdx] = { ...next[activeLevelIdx], grid: nextGrid };
        return next;
      });
    }
    setOverlay({ visible: false, type: null, coord: null });
  };

  const handleSelectElement = (type: CellType | 'spread') => {
    if (type === 'spread') {
      handleSpread();
    } else {
      setBrush({ type: type as CellType });
    }
  };

  const handleBuild = () => {
    if (!activeLevel) return;
    let start: { r: number; c: number } | null = null;
    Object.values(activeLevel.grid).forEach((cell) => {
      if (cell.type === 'start') start = { r: cell.r, c: cell.c };
    });
    if (!start) return;

    setPlayerPos(start);
    setScore(activeLevel.startVal);
    setTargetGoal(activeLevel.targetGoalScore);
    setHistory([]);
    setIsPlayMode(true);
    setDrawerVisible(false);
  };

  const handleMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (!activeLevel) return;
    let dr = 0,
      dc = 0;
    if (dir === 'up') dr = -1;
    if (dir === 'down') dr = 1;
    if (dir === 'left') dc = -1;
    if (dir === 'right') dc = 1;

    const nr = playerPos.r + dr;
    const nc = playerPos.c + dc;
    if (nr < 0 || nr >= activeLevel.dims.rows || nc < 0 || nc >= activeLevel.dims.cols) return;

    const nextKey = `${nr},${nc}`;
    const targetCell = activeLevel.grid[nextKey];
    if (!targetCell || targetCell.isVisited) return;

    setHistory((prev) => [...prev, { playerPos, score, grid: JSON.parse(JSON.stringify(activeLevel.grid)) }]);

    setLevels((prev) => {
      const next = [...prev];
      const nextGrid = { ...next[activeLevelIdx].grid };
      const prevKey = `${playerPos.r},${playerPos.c}`;
      nextGrid[prevKey] = { ...nextGrid[prevKey], isVisited: true };
      next[activeLevelIdx] = { ...next[activeLevelIdx], grid: nextGrid };
      return next;
    });

    let nextScore = score;
    if (targetCell.type === 'math' && targetCell.value) {
      const op = targetCell.value.charAt(0);
      const val = parseFloat(targetCell.value.substring(1)) || 0;
      if (op === '+') nextScore += val;
      if (op === '-') nextScore -= val;
      if (op === '*') nextScore *= val;
    }

    setScore(nextScore);
    setPlayerPos({ r: nr, c: nc });

    if (targetCell.type === 'goal') {
      if (nextScore === targetGoal) {
        setStatusModal({ visible: true, success: true, msg: 'Goal reached with exact math total!' });
      } else {
        setStatusModal({ visible: true, success: false, msg: `Hit portal with ${nextScore} (Target: ${targetGoal})` });
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || !activeLevel) return;
    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setPlayerPos(previousState.playerPos);
    setScore(previousState.score);
    setLevels((prev) => {
      const next = [...prev];
      next[activeLevelIdx] = { ...next[activeLevelIdx], grid: previousState.grid };
      return next;
    });
  };

  const handleReset = () => {
    setIsPlayMode(false);
    setDrawerVisible(true);
    setLevels((prev) => {
      const next = [...prev];
      const clean: Record<string, CellInstance> = {};
      Object.keys(next[activeLevelIdx].grid).forEach((k) => {
        clean[k] = { ...next[activeLevelIdx].grid[k], isVisited: false };
      });
      next[activeLevelIdx] = { ...next[activeLevelIdx], grid: clean };
      return next;
    });
  };

  const handlePublish = () => {
    if (!bundleName.trim() || levels.length === 0) return;
    const bundle: MazeBundleData = {
      id: Math.random().toString(),
      name: bundleName,
      levels,
    };
    publishMaze(bundle);
    setPublishSuccess(true);
  };

  return {
    bundleName,
    setBundleName,
    levels,
    setLevels,
    activeLevelIdx,
    setActiveLevelIdx,
    brush,
    setBrush,
    isPlayMode,
    playerPos,
    score,
    targetGoal,
    history,
    overlay,
    setOverlay,
    drawerVisible,
    setDrawerVisible,
    statusModal,
    setStatusModal,
    publishSuccess,
    setPublishSuccess,
    headerAnim,
    activeLevel,
    handleScroll,
    handleSelectDimension,
    handleAddLevel,
    handleRemoveLevel,
    handleSpread,
    handleCellPress,
    handleSaveOverlay,
    handleSelectElement,
    handleBuild,
    handleMove,
    handleUndo,
    handleReset,
    handlePublish,
  };
}
