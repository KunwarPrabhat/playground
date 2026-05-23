import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PrimitiveType } from '../../../types/engineTypes';

interface Props {
  type: PrimitiveType;
  width: number;
  height: number;
}

export const PrimitiveRenderer: React.FC<Props> = ({ type, width, height }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'grid': return 'rgba(107, 112, 92, 0.4)'; // #6b705c
      case 'input_block': return 'rgba(203, 153, 126, 0.8)'; // #cb997e
      case 'deadblock': return 'rgba(40, 40, 40, 0.8)'; 
      case 'flowflow': return 'rgba(165, 165, 141, 0.8)'; // #a5a58d
      case 'if_else_block': return 'rgba(183, 183, 164, 0.8)'; // #b7b7a4
      case 'loop_block': return 'rgba(221, 190, 169, 0.8)'; // #ddbea9
      case 'game_start': return 'rgba(113, 160, 113, 0.8)'; // earthy green
      case 'game_end': return 'rgba(160, 90, 90, 0.8)'; // earthy red
      default: return 'rgba(255, 255, 255, 0.5)';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'grid': return '#6b705c';
      case 'input_block': return '#cb997e';
      case 'deadblock': return '#282828';
      case 'flowflow': return '#a5a58d';
      case 'if_else_block': return '#b7b7a4';
      case 'loop_block': return '#ddbea9';
      case 'game_start': return '#4c704c';
      case 'game_end': return '#703c3c';
      default: return '#ccc';
    }
  };

  const formatTitle = (t: string) => {
    return t.replace(/_/g, ' ').toUpperCase();
  };

  if (type === 'spawner_marker') {
    return (
      <View style={[styles.spawnerContainer, { width, height }]}>
        <View style={styles.spawnerRing} />
        <View style={styles.spawnerCrosshairH} />
        <View style={styles.spawnerCrosshairV} />
        <View style={styles.spawnerCenterDot} />
      </View>
    );
  }

  if (type === 'grid') {
    const cellSize = 32;
    const cols = Math.max(1, Math.floor(width / cellSize));
    const rows = Math.max(1, Math.floor(height / cellSize));

    return (
      <View
        style={[
          styles.container,
          {
            width,
            height,
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: 2,
            padding: 2,
            flexDirection: 'column',
          },
        ]}
      >
        {Array.from({ length: rows }).map((_, r) => (
          <View key={r} style={{ flexDirection: 'row', flex: 1 }}>
            {Array.from({ length: cols }).map((_, c) => (
              <View
                key={c}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  margin: 1,
                  borderRadius: 2,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
      ]}
    >
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
        {formatTitle(type)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  spawnerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  spawnerRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#f28482',
    borderStyle: 'dashed',
    position: 'absolute',
  },
  spawnerCrosshairH: {
    width: 36,
    height: 1.5,
    backgroundColor: '#fff',
    position: 'absolute',
    opacity: 0.8,
  },
  spawnerCrosshairV: {
    width: 1.5,
    height: 36,
    backgroundColor: '#fff',
    position: 'absolute',
    opacity: 0.8,
  },
  spawnerCenterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f28482',
    position: 'absolute',
  },
  gridInnerLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  gridInnerLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 4,
  },
});
