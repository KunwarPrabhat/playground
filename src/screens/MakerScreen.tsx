import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SudokuCreator } from '../components/games/sudoku/SudokuCreator';
import { AdaptiveMazeBuilder } from '../components/games/maze/AdaptiveMazeBuilder';
import Svg, { Path, Rect } from 'react-native-svg';

export const MakerScreen = () => {
  const [selectedCreator, setSelectedCreator] = useState<'maze' | 'sudoku' | null>(null);

  if (selectedCreator === 'maze') {
    return <AdaptiveMazeBuilder onBack={() => setSelectedCreator(null)} />;
  }

  if (selectedCreator === 'sudoku') {
    return <SudokuCreator onBack={() => setSelectedCreator(null)} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Select Game Creator</Text>
      
      <TouchableOpacity style={styles.card} onPress={() => setSelectedCreator('maze')}>
        <View style={styles.iconWrapper}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
            <Path d="M3 3h18v18H3z" />
            <Path d="M9 3v12M15 9v12M3 9h12M9 15h12" />
          </Svg>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Create Maze</Text>
          <Text style={styles.cardSub}>Design custom math mazes with dynamic grids & interactive path steps.</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => setSelectedCreator('sudoku')}>
        <View style={styles.iconWrapperSudoku}>
          <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
            <Rect x={3} y={3} width={18} height={18} rx={2} />
            <Path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
          </Svg>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Create Sudoku</Text>
          <Text style={styles.cardSub}>Assemble modular sudoku puzzles with variable difficulty seeds.</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c2c5aa',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1d201e',
    marginBottom: 28,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#a68a64',
    borderRadius: 40,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#a68a64',
    elevation: 4,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ffc251',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconWrapperSudoku: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#657885',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#373d2bff',
    marginBottom: 6,
  },
  cardSub: {
    fontSize: 12,
    color: '#414833',
    lineHeight: 16,
  },
  backBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#2d312e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 20,
  },
  backText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d201e',
    marginTop: 10,
  },
  subText: {
    fontSize: 14,
    color: '#474f44',
    marginTop: 6,
  },
});
