import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '../components/atom/Chip';

interface PlaygroundTabsProps {
  activeTab: 'mazes' | 'sudokus';
  onChangeTab: (tab: 'mazes' | 'sudokus') => void;
}

export const PlaygroundTabs: React.FC<PlaygroundTabsProps> = ({ activeTab, onChangeTab }) => {
  return (
    <View style={styles.tabHeader}>
      <Chip
        label="Math Mazes"
        active={activeTab === 'mazes'}
        onPress={() => onChangeTab('mazes')}
        style={styles.tabBtn}
        textStyle={styles.tabBtnText}
      />
      <Chip
        label="Sudokus"
        active={activeTab === 'sudokus'}
        onPress={() => onChangeTab('sudokus')}
        style={styles.tabBtn}
        textStyle={styles.tabBtnText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  tabHeader: {
    flexDirection: 'row',
    backgroundColor: '#b6ad90',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    marginRight: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  tabBtnText: {
    fontSize: 13,
  },
});
