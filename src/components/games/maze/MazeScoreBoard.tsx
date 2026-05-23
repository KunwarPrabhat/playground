import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface MazeScoreBoardProps {
  score: number;
  targetGoal: number;
}

export const MazeScoreBoard: React.FC<MazeScoreBoardProps> = ({ score, targetGoal }) => {
  return (
    <View style={styles.scoreSection}>
      <View style={styles.scoreBox}>
        <Text style={styles.scoreLabel}>Score</Text>
        <Text style={styles.scoreVal}>{score}</Text>
      </View>
      <View style={[styles.scoreBox, { backgroundColor: '#12db98' }]}>
        <Text style={styles.scoreLabel}>Goal</Text>
        <Text style={styles.scoreVal}>{targetGoal}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  scoreBox: {
    backgroundColor: '#657885ff',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 100,
    elevation: 2,
  },
  scoreLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    opacity: 0.8,
  },
  scoreVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
