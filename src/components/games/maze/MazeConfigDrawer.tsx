import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { MazeDimensions, CellType } from '../../../types/mazeTypes';
import { Button } from '../../atom/Button';
import { Chip } from '../../atom/Chip';

interface Props {
  onSelectDimension: (dims: MazeDimensions) => void;
  onSelectElement: (type: CellType | 'spread', value?: string) => void;
  activeElement?: { type: CellType | 'spread'; value?: string } | null;
}

export const MazeConfigDrawer: React.FC<Props> = ({
  onSelectDimension,
  onSelectElement,
  activeElement,
}) => {
  const [activeTab, setActiveTab] = useState<'grids' | 'elements'>('grids');

  const dimensions = [
    { label: '6 x 6', dims: { rows: 6, cols: 6 } },
    { label: '9 x 9', dims: { rows: 9, cols: 9 } },
    { label: '6 x 10', dims: { rows: 10, cols: 6 } },
    { label: '9 x 10', dims: { rows: 10, cols: 9 } },
  ];

  const elements = [
    { label: 'Start Marker', type: 'start' as const },
    { label: 'Goal Marker', type: 'goal' as const },
    { label: 'Spread', type: 'spread' as const },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <Chip
          label="Grids"
          active={activeTab === 'grids'}
          onPress={() => setActiveTab('grids')}
          style={styles.tabBtn}
          textStyle={styles.tabText}
        />
        <Chip
          label="Elements"
          active={activeTab === 'elements'}
          onPress={() => setActiveTab('elements')}
          style={styles.tabBtn}
          textStyle={styles.tabText}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'grids' ? (
          dimensions.map((opt, idx) => (
            <Button
              key={idx}
              onPress={() => onSelectDimension(opt.dims)}
              title={opt.label}
              variant="secondary"
              style={styles.optBtn}
            />
          ))
        ) : (
          elements.map((el, idx) => {
            const isSelected = activeElement?.type === el.type;
            return (
              <Button
                key={idx}
                onPress={() => onSelectElement(el.type)}
                title={el.label}
                variant={isSelected ? 'primary' : 'secondary'}
                style={styles.optBtn}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#4e5d51ff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#474f44',
  },
  tabHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  tabText: {
    fontSize: 13,
  },
  scroll: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  optBtn: {
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#474f44',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
