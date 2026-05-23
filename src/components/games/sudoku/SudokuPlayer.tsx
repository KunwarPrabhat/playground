import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { SudokuBundleData, SudokuCell } from '../../../types/sudokuTypes';
import { generateSudoku } from '../../../utils/sudokuGenerator';
import { Button } from '../../atom/Button';

interface Props {
  bundle: SudokuBundleData;
  onClose: () => void;
}

const TriangleShape = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3L2 20h20L12 3z" fill="#656d4a" stroke="#a4ac86" strokeWidth={1.5} />
    <Path d="M12 8L6 17h12L12 8z" fill="#a4ac86" />
  </Svg>
);

const SquareShape = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x={4} y={4} width={16} height={16} rx={4} fill="#a68a64" stroke="#efe5c9" strokeWidth={1.5} />
    <Rect x={8} y={8} width={8} height={8} rx={2} fill="#efe5c9" />
  </Svg>
);

const CircleShape = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2a10 10 0 100 20 10 10 0 000-20z" fill="#a4ac86" stroke="#656d4a" strokeWidth={1.5} />
    <Path d="M12 6a6 6 0 100 12 6 6 0 000-12z" fill="#656d4a" />
  </Svg>
);

const StarShape = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#efe5c9" stroke="#a68a64" strokeWidth={1.5} />
  </Svg>
);

const renderShape = (val: string, boxSize: number) => {
  const shapeSize = Math.floor(boxSize * 0.55);
  if (val === '▲') return <TriangleShape size={shapeSize} />;
  if (val === '■') return <SquareShape size={shapeSize} />;
  if (val === '●') return <CircleShape size={shapeSize} />;
  if (val === '★') return <StarShape size={shapeSize} />;
  return <Text style={{ fontSize: boxSize * 0.4, fontWeight: 'bold', color: '#1d201e' }}>{val}</Text>;
};

export const SudokuPlayer: React.FC<Props> = ({ bundle, onClose }) => {
  const [levelIdx, setLevelIdx] = useState(0);
  const currentLevel = bundle.levels[levelIdx];
  const [cells, setCells] = useState<SudokuCell[]>([]);
  const [selectedCellIdx, setSelectedCellIdx] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState(bundle.timerSeconds);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [levelTimes, setLevelTimes] = useState<number[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { width, height } = useWindowDimensions();

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const initLevel = () => {
    if (!currentLevel) return;
    const generated = generateSudoku(currentLevel.type, currentLevel.difficulty);
    setCells(generated);
    setSelectedCellIdx(null);
    setTimeLeft(bundle.timerSeconds);
    setIsGameOver(false);
    setIsWin(false);
    if (levelIdx === 0) {
      setLevelTimes([]);
    }
  };

  useEffect(() => {
    initLevel();
  }, [levelIdx]);

  useEffect(() => {
    if (isGameOver || isWin) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsGameOver(true);

          const totalLevels = bundle.levels.length;
          const levelsCleared = levelIdx;
          const timeBreakdown = levelTimes.map((t, idx) => `L${idx + 1}: ${t}s`).join(', ') || 'None';

          setStatusMsg(`TIME OUT!\n\nTotal Levels = ${totalLevels}\nLevels Cleared = ${levelsCleared}\nTime Taken per Level = ${timeBreakdown}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [levelIdx, isGameOver, isWin, levelTimes]);

  const getSize = () => {
    if (currentLevel.type === '4x4' || currentLevel.type === 'shape') return 4;
    if (currentLevel.type === '6x6') return 6;
    if (currentLevel.type === '16x16') return 16;
    return 9;
  };

  const size = getSize();
  const cellWidthByWidth = Math.floor((width - 48) / size);
  const cellWidthByHeight = Math.floor((height - 380) / size);
  const cellWidth = Math.min(cellWidthByWidth, cellWidthByHeight);

  const handleCellPress = (idx: number) => {
    if (cells[idx].isGiven) return;
    setSelectedCellIdx(idx);
  };

  const handleInput = (val: string) => {
    if (selectedCellIdx === null) return;
    setCells((prev) => {
      const next = [...prev];
      next[selectedCellIdx] = { ...next[selectedCellIdx], value: val };
      checkSolution(next);
      return next;
    });
  };

  const checkSolution = (currentCells: SudokuCell[]) => {
    const isFull = currentCells.every((cell) => cell.value !== '');
    if (!isFull) return;

    const isCorrect = currentCells.every((cell) => cell.value === cell.originalValue);
    if (isCorrect) {
      if (timerRef.current) clearInterval(timerRef.current);
      const timeTaken = bundle.timerSeconds - timeLeft;
      setLevelTimes((prev) => [...prev, timeTaken]);

      if (levelIdx < bundle.levels.length - 1) {
        setIsWin(true);
        setStatusMsg(`Level ${levelIdx + 1} Cleared! Ready for Next?`);
      } else {
        setIsWin(true);
        setStatusMsg('All levels solved! You are a Sudoku Master!');
      }
    }
  };

  const handleNext = () => {
    setIsWin(false);
    if (levelIdx < bundle.levels.length - 1) {
      setLevelIdx((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handleRetry = () => {
    initLevel();
  };

  const getSymbols = () => {
    if (currentLevel.type === 'shape') {
      return ['▲', '■', '●', '★'];
    }
    const syms: string[] = [];
    for (let i = 1; i <= size; i++) {
      if (size === 16) syms.push(i.toString(16).toUpperCase());
      else syms.push(i.toString());
    }
    return syms;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          onPress={onClose}
          icon="arrow-left"
          iconSize={22}
          iconColor="#656d4a"
          variant="secondary"
          style={styles.backBtn}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{bundle.name}</Text>
          <Text style={styles.headerSub}>
            Level {levelIdx + 1} of {bundle.levels.length} ({currentLevel.type.toUpperCase()})
          </Text>
        </View>
        <View style={styles.timerWrapper}>
          <Feather name="clock" size={14} color="#656d4a" style={{ marginRight: 4 }} />
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <View style={styles.gridWrapper}>
        <View style={[styles.grid, { width: cellWidth * size }]}>
          {Array.from({ length: size }).map((_, r) => (
            <View key={r} style={styles.row}>
              {Array.from({ length: size }).map((__, c) => {
                const idx = r * size + c;
                const cell = cells[idx];
                if (!cell) return null;
                const isSelected = selectedCellIdx === idx;
                
                let borderRight = 1;
                let borderBottom = 1;
                
                if (currentLevel.type === '4x4' || currentLevel.type === 'shape') {
                  if (c === 1) borderRight = 3;
                  if (r === 1) borderBottom = 3;
                } else if (currentLevel.type === '6x6') {
                  if ((c + 1) % 3 === 0 && c < size - 1) borderRight = 3;
                  if ((r + 1) % 2 === 0 && r < size - 1) borderBottom = 3;
                } else if (currentLevel.type === '16x16') {
                  if ((c + 1) % 4 === 0 && c < size - 1) borderRight = 3;
                  if ((r + 1) % 4 === 0 && r < size - 1) borderBottom = 3;
                } else if (currentLevel.type === 'irregular') {
                  const rightCell = cells[idx + 1];
                  const bottomCell = cells[idx + size];
                  if (rightCell && rightCell.blockId !== cell.blockId && c < size - 1) borderRight = 3;
                  if (bottomCell && bottomCell.blockId !== cell.blockId && r < size - 1) borderBottom = 3;
                } else {
                  if ((c + 1) % 3 === 0 && c < size - 1) borderRight = 3;
                  if ((r + 1) % 3 === 0 && r < size - 1) borderBottom = 3;
                }

                const colors = [
                  '#e07a5f',
                  '#b5c99a',
                  '#3d5a80',
                  '#98c1d9',
                  '#e0b1cb',
                  '#f3c68f',
                  '#81b29a',
                  '#f2cc8f',
                  '#adc178',
                  '#ffadad',
                  '#ffd6a5',
                  '#fdffb6',
                  '#caffbf',
                  '#9bf6ff',
                  '#a0c4ff',
                  '#bdb2ff'
                ];
                
                let cellBg = colors[cell.blockId % colors.length];
                let cellTextColor = cell.isGiven ? '#000000' : '#FFFFFF';

                if (isSelected) {
                  cellBg = '#a4ac86';
                  cellTextColor = '#FFFFFF';
                }

                return (
                  <Button
                    key={c}
                    onPress={() => handleCellPress(idx)}
                    variant="secondary"
                    style={[
                      styles.cell,
                      {
                        width: cellWidth,
                        height: cellWidth,
                        borderRightWidth: borderRight,
                        borderBottomWidth: borderBottom,
                        backgroundColor: cellBg
                      }
                    ]}
                  >
                    {currentLevel.type === 'shape' ? (
                      renderShape(cell.value, cellWidth)
                    ) : (
                      <Text
                        style={[
                          styles.cellText,
                          {
                            fontSize: size === 16 ? 10 : 15,
                            color: cellTextColor,
                            fontWeight: 'bold'
                          }
                        ]}
                      >
                        {cell.value}
                      </Text>
                    )}
                  </Button>
                );
              })}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.keypadWrapper}>
        <View style={styles.keypad}>
          {getSymbols().map((sym) => (
            <Button
              key={sym}
              onPress={() => handleInput(sym)}
              variant="secondary"
              style={styles.key}
            >
              {currentLevel.type === 'shape' ? (
                renderShape(sym, 44)
              ) : (
                <Text style={styles.keyText}>{sym}</Text>
              )}
            </Button>
          ))}
          <Button
            onPress={() => handleInput('')}
            title="CLR"
            variant="secondary"
            style={[styles.key, { backgroundColor: '#a68a64' }]}
            textStyle={{ color: '#FFFFFF' }}
          />
        </View>
      </View>

      <Modal visible={isWin} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalMsg}>{statusMsg}</Text>
            <Button
              onPress={handleNext}
              title={levelIdx < bundle.levels.length - 1 ? 'Next Level' : 'Finish'}
              variant="success"
              style={styles.modalBtn}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={isGameOver} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: '#a68a64' }]}>
            <View style={[styles.successIcon, { backgroundColor: '#efe5c9' }]}>
              <Feather name="alert-triangle" size={24} color="#a68a64" />
            </View>
            <Text style={styles.modalTitle}>Failed!</Text>
            <Text style={styles.modalMsg}>{statusMsg}</Text>
            <Button
              onPress={statusMsg.includes('TIME OUT') ? onClose : handleRetry}
              title={statusMsg.includes('TIME OUT') ? 'Back to Playground' : 'Retry'}
              variant="secondary"
              style={[styles.modalBtn, { backgroundColor: '#efe5c9' }]}
              textStyle={{ color: '#a68a64' }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#c2c5aa', paddingTop: 50, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, justifyContent: 'space-between' },
  backBtn: { marginRight: 12, backgroundColor: 'transparent', paddingVertical: 0, paddingHorizontal: 0 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#656d4a' },
  headerSub: { fontSize: 11, color: '#656d4a', opacity: 0.8 },
  timerWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#b6ad90', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
  timerText: { fontSize: 12, fontWeight: 'bold', color: '#656d4a' },
  gridWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { borderWidth: 3, borderColor: '#656d4a', backgroundColor: '#656d4a' },
  row: { flexDirection: 'row' },
  cell: {
    borderRadius: 0,
    borderWidth: 0.5,
    borderColor: '#656d4a',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  cellText: { textAlign: 'center' },
  keypadWrapper: { paddingBottom: 110, alignItems: 'center' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: '100%' },
  key: {
    backgroundColor: '#b6ad90',
    width: 44,
    height: 44,
    borderRadius: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#a68a64',
    elevation: 2
  },
  keyText: { fontSize: 13, fontWeight: 'bold', color: '#656d4a' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#656d4a', padding: 24, borderRadius: 24, width: '80%', alignItems: 'center', borderWidth: 1.5, borderColor: '#a4ac86' },
  successIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#a4ac86', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  modalMsg: { fontSize: 13, color: '#c2c5aa', textAlign: 'center', marginBottom: 20 },
  modalBtn: { width: '100%' }
});
