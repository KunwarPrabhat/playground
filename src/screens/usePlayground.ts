import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useGame } from '../context/GameContext';
import { MazeBundleData, CellInstance } from '../types/mazeTypes';
import { SudokuBundleData } from '../types/sudokuTypes';

export function usePlayground() {
  const { publishedMazes, publishedSudokus, setTabBarVisible, deleteMaze, deleteSudoku } = useGame();

  const [activePlayTab, setActivePlayTab] = useState<'mazes' | 'sudokus'>('mazes');
  const [selectedMazeBundle, setSelectedMazeBundle] = useState<MazeBundleData | null>(null);
  const [selectedSudoku, setSelectedSudoku] = useState<SudokuBundleData | null>(null);

  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [grid, setGrid] = useState<Record<string, CellInstance>>({});
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  const [score, setScore] = useState(1);
  const [timeLeft, setTimeLeft] = useState(60);
  const [statusModal, setStatusModal] = useState<{ visible: boolean; success: boolean; msg: string } | null>(null);
  const [history, setHistory] = useState<{ playerPos: { r: number; c: number }; score: number; grid: Record<string, CellInstance> }[]>([]);
  const [levelTimes, setLevelTimes] = useState<number[]>([]);

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
    if (selectedMazeBundle) {
      setTabBarVisible(false);
    } else {
      setTabBarVisible(true);
      setHeaderVisible(true);
    }
  }, [selectedMazeBundle, setTabBarVisible]);

  // Load level configuration
  useEffect(() => {
    if (!selectedMazeBundle) return;
    const currentLevel = selectedMazeBundle.levels[currentLevelIdx];
    if (!currentLevel) return;

    setGrid(JSON.parse(JSON.stringify(currentLevel.grid)));
    setScore(currentLevel.startVal);
    setTimeLeft(currentLevel.timerSeconds || 60);
    setHistory([]);
    if (currentLevelIdx === 0) {
      setLevelTimes([]);
    }

    let start = { r: 0, c: 0 };
    Object.values(currentLevel.grid).forEach((cell) => {
      if (cell.type === 'start') start = { r: cell.r, c: cell.c };
    });
    setPlayerPos(start);
  }, [selectedMazeBundle, currentLevelIdx]);

  // Live Timer Countdown Effect
  useEffect(() => {
    if (!selectedMazeBundle || statusModal?.visible) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);

          const totalLevels = selectedMazeBundle.levels.length;
          const levelsCleared = currentLevelIdx;
          const timeBreakdown = levelTimes.map((t, idx) => `L${idx + 1}: ${t}s`).join(', ') || 'None';

          setStatusModal({
            visible: true,
            success: false,
            msg: `TIME OUT!\n\nTotal Levels = ${totalLevels}\nLevels Cleared = ${levelsCleared}\nTime Taken per Level = ${timeBreakdown}`,
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedMazeBundle, currentLevelIdx, statusModal?.visible, levelTimes]);

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const { layoutMeasurement, contentSize, contentOffset } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;

    if (isCloseToBottom) {
      setHeaderVisible(false);
      if (!selectedMazeBundle) setTabBarVisible(false);
    } else if (currentOffset <= 20) {
      setHeaderVisible(true);
      if (!selectedMazeBundle) setTabBarVisible(true);
    } else if (currentOffset - lastOffsetY.current > 5) {
      setHeaderVisible(false);
      if (!selectedMazeBundle) setTabBarVisible(false);
    } else if (lastOffsetY.current - currentOffset > 5) {
      setHeaderVisible(true);
      if (!selectedMazeBundle) setTabBarVisible(true);
    }

    lastOffsetY.current = currentOffset;
  };

  const handleMove = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedMazeBundle) return;
    const currentLevel = selectedMazeBundle.levels[currentLevelIdx];
    if (!currentLevel) return;

    let dr = 0, dc = 0;
    if (dir === 'up') dr = -1;
    if (dir === 'down') dr = 1;
    if (dir === 'left') dc = -1;
    if (dir === 'right') dc = 1;

    const nr = playerPos.r + dr;
    const nc = playerPos.c + dc;
    if (nr < 0 || nr >= currentLevel.dims.rows || nc < 0 || nc >= currentLevel.dims.cols) return;

    const nextKey = `${nr},${nc}`;
    const targetCell = grid[nextKey];
    if (!targetCell || targetCell.isVisited) return;

    setHistory((prev) => [...prev, { playerPos, score, grid: JSON.parse(JSON.stringify(grid)) }]);

    setGrid((prev) => {
      const prevKey = `${playerPos.r},${playerPos.c}`;
      return { ...prev, [prevKey]: { ...prev[prevKey], isVisited: true } };
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
      if (nextScore === currentLevel.targetGoalScore) {
        const timeTaken = (currentLevel.timerSeconds || 60) - timeLeft;
        setLevelTimes((prev) => [...prev, timeTaken]);

        if (currentLevelIdx < selectedMazeBundle.levels.length - 1) {
          setStatusModal({
            visible: true,
            success: true,
            msg: `Level ${currentLevelIdx + 1} Complete! Get ready for Level ${currentLevelIdx + 2}!`,
          });
        } else {
          setStatusModal({
            visible: true,
            success: true,
            msg: 'Outstanding! You completed the entire Maze Bundle!',
          });
        }
      } else {
        setStatusModal({
          visible: true,
          success: false,
          msg: `Hit portal with ${nextScore} (Target score: ${currentLevel.targetGoalScore})`,
        });
      }
    }
  };

  const handleModalAction = () => {
    if (!selectedMazeBundle) return;
    const currentLevel = selectedMazeBundle.levels[currentLevelIdx];

    if (statusModal?.success) {
      if (currentLevelIdx < selectedMazeBundle.levels.length - 1) {
        setCurrentLevelIdx((prev) => prev + 1);
        setStatusModal(null);
      } else {
        setStatusModal(null);
        setSelectedMazeBundle(null);
        setCurrentLevelIdx(0);
      }
    } else {
      // If it is a time out, go back to playground
      if (statusModal?.msg.includes('TIME OUT')) {
        setStatusModal(null);
        setSelectedMazeBundle(null);
        setCurrentLevelIdx(0);
      } else {
        // Retry current level (normal level error failures)
        setGrid(JSON.parse(JSON.stringify(currentLevel.grid)));
        setScore(currentLevel.startVal);
        setTimeLeft(currentLevel.timerSeconds || 60);
        let start = { r: 0, c: 0 };
        Object.values(currentLevel.grid).forEach((cell) => {
          if (cell.type === 'start') start = { r: cell.r, c: cell.c };
        });
        setPlayerPos(start);
        setStatusModal(null);
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setPlayerPos(previousState.playerPos);
    setScore(previousState.score);
    setGrid(previousState.grid);
  };

  return {
    publishedMazes,
    publishedSudokus,
    deleteMaze,
    deleteSudoku,
    activePlayTab,
    setActivePlayTab,
    selectedMazeBundle,
    setSelectedMazeBundle,
    selectedSudoku,
    setSelectedSudoku,
    currentLevelIdx,
    setCurrentLevelIdx,
    grid,
    playerPos,
    score,
    timeLeft,
    statusModal,
    setStatusModal,
    history,
    headerAnim,
    handleScroll,
    handleMove,
    handleModalAction,
    handleUndo,
  };
}
