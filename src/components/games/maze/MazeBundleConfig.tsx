import React from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MazeLevelData } from '../../../types/mazeTypes';
import { Button } from '../../atom/Button';
import { Chip } from '../../atom/Chip';

interface MazeBundleConfigProps {
  bundleName: string;
  onChangeBundleName: (name: string) => void;
  levels: MazeLevelData[];
  activeLevelIdx: number;
  onSelectLevelIdx: (idx: number) => void;
  onAddLevel: () => void;
  onRemoveLevel: (idx: number) => void;
  onChangeTimer: (seconds: number) => void;
}

export const MazeBundleConfig: React.FC<MazeBundleConfigProps> = ({
  bundleName,
  onChangeBundleName,
  levels,
  activeLevelIdx,
  onSelectLevelIdx,
  onAddLevel,
  onRemoveLevel,
  onChangeTimer,
}) => {
  const activeLevel = levels[activeLevelIdx];
  if (!activeLevel) return null;

  return (
    <View style={styles.bundleSection}>
      <Text style={styles.bundleLabel}>Maze Bundle Name</Text>
      <TextInput
        style={styles.bundleInput}
        value={bundleName}
        onChangeText={onChangeBundleName}
        placeholder="Name your Maze Quest"
        placeholderTextColor="#a68a64"
      />

      <View style={styles.levelTabsContainer}>
        <Text style={styles.levelSeqLabel}>Levels Sequence ({levels.length})</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.levelScroll}>
          {levels.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.levelTab, activeLevelIdx === idx && styles.activeLevelTab]}
              onPress={() => onSelectLevelIdx(idx)}
            >
              <Text style={[styles.levelTabText, activeLevelIdx === idx && styles.activeLevelTabText]}>
                Lvl {idx + 1}
              </Text>
              {levels.length > 1 && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onRemoveLevel(idx);
                  }}
                  style={styles.removeTabIcon}
                >
                  <Feather name="x" size={12} color={activeLevelIdx === idx ? '#FFFFFF' : '#656d4a'} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
          <Button
            onPress={onAddLevel}
            title="Add"
            icon="plus-circle"
            iconSize={16}
            iconColor="#656d4a"
            variant="add-level"
          />
        </ScrollView>
      </View>

      <View style={styles.timeSection}>
        <Text style={styles.timeLabel}>Lvl {activeLevelIdx + 1} Time Limit: {activeLevel.timerSeconds}s</Text>
        <View style={styles.timeRow}>
          {[30, 60, 120, 180].map((t) => (
            <Chip
              key={t}
              label={`${t}s`}
              active={activeLevel.timerSeconds === t}
              onPress={() => onChangeTimer(t)}
            />
          ))}
          <TextInput
            style={styles.timeInput}
            keyboardType="number-pad"
            value={activeLevel.timerSeconds ? activeLevel.timerSeconds.toString() : ''}
            onChangeText={(text) => {
              const s = parseInt(text) || 0;
              onChangeTimer(s);
            }}
            placeholder="Secs"
            placeholderTextColor="#a68a64"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bundleSection: {
    backgroundColor: '#b6ad90',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#a68a64',
    marginBottom: 10,
  },
  bundleLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#656d4a',
    marginBottom: 4,
  },
  bundleInput: {
    backgroundColor: '#c2c5aa',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: '#656d4a',
    fontWeight: 'bold',
  },
  levelTabsContainer: {
    marginTop: 8,
  },
  levelSeqLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#656d4a',
    marginBottom: 4,
  },
  levelScroll: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelTab: {
    backgroundColor: '#c2c5aa',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#a68a64',
  },
  activeLevelTab: {
    backgroundColor: '#656d4a',
    borderColor: '#656d4a',
  },
  levelTabText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#656d4a',
  },
  activeLevelTabText: {
    color: '#FFFFFF',
  },
  removeTabIcon: {
    marginLeft: 6,
  },
  timeSection: {
    marginTop: 8,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#656d4a',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    backgroundColor: '#c2c5aa',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 11,
    color: '#656d4a',
    fontWeight: 'bold',
    width: 50,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#a68a64',
  },
});
