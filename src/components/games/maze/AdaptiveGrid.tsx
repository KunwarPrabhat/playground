import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { MazeDimensions, CellInstance } from '../../../types/mazeTypes';

interface Props {
  dims: MazeDimensions;
  grid: Record<string, CellInstance>;
  onCellPress: (r: number, c: number) => void;
  playerPos?: { r: number; c: number };
}

export const AdaptiveGrid: React.FC<Props> = ({ dims, grid, onCellPress, playerPos }) => {
  const { width, height } = useWindowDimensions();
  const horizontalPadding = 48 + (dims.cols * 2) + 4;
  const cellWidthByWidth = Math.floor((width - horizontalPadding) / dims.cols);
  const cellWidthByHeight = Math.floor((height - 200) / dims.rows);
  const cellWidth = Math.min(cellWidthByWidth, cellWidthByHeight);

  const getBg = (cell?: CellInstance, isPlayer?: boolean) => {
    if (isPlayer) return '#f43f5e'; // Vibrant pink
    if (!cell) return '#efe5c9';
    if (cell.isVisited) return '#3a5a40';
    if (cell.type === 'start') return '#ffc251ff';
    if (cell.type === 'goal') return '#12db98ff';
    if (cell.type === 'math') return '#657885ff';
    return '#efe5c9';
  };

  const getBorderColor = (cell?: CellInstance) => {
    if (!cell) return '#a68a64';
    if (cell.type === 'start') return '#ffc251ff';
    if (cell.type === 'goal') return '#12db98ff';
    if (cell.type === 'math') return '#657885ff';
    return '#a68a64';
  };

  const getLabel = (cell?: CellInstance) => {
    if (!cell) return '';
    if (cell.type === 'start') return 'S';
    if (cell.type === 'goal') return 'G';
    return cell.value || '';
  };

  return (
    <View style={styles.grid}>
      {Array.from({ length: dims.rows }).map((_, r) => (
        <View key={r} style={styles.row}>
          {Array.from({ length: dims.cols }).map((__, c) => {
            const key = `${r},${c}`;
            const cell = grid[key];
            const isPlayer = playerPos?.r === r && playerPos?.c === c;
            return (
              <TouchableOpacity
                key={c}
                activeOpacity={0.8}
                style={[
                  styles.cell,
                  {
                    width: cellWidth,
                    height: cellWidth,
                    backgroundColor: getBg(cell, isPlayer),
                    borderColor: getBorderColor(cell)
                  },
                  cell?.isVisited && styles.visitedBorder,
                ]}
                onPress={() => onCellPress(r, c)}
              >
                <Text style={[styles.text, cell?.type === 'math' && styles.mathText, isPlayer && styles.playerText]}>
                  {getLabel(cell)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    backgroundColor: '#b6ad90',
    padding: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#a68a64',
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    margin: 1,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a68a64',
    justifyContent: 'center',
    alignItems: 'center',
  },
  visitedBorder: {
    borderColor: '#1E293B',
  },
  text: {
    color: '#1E293B',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  mathText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  playerText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
