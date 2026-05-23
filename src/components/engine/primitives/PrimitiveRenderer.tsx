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
