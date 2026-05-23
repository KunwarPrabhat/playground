import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  onMove: (dir: 'up' | 'down' | 'left' | 'right') => void;
  onUndo?: () => void;
}

const IconUndo = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 7v6h6" />
    <Path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
  </Svg>
);

const IconUp = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M18 15l-6-6-6 6" />
  </Svg>
);

const IconDown = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

const IconLeft = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 18l-6-6 6-6" />
  </Svg>
);

const IconRight = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18l6-6-6-6" />
  </Svg>
);

export const MazeJoystick: React.FC<Props> = ({ onMove, onUndo }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.key} onPress={() => onMove('up')}>
        <IconUp />
      </TouchableOpacity>
      <View style={styles.midRow}>
        <TouchableOpacity style={styles.key} onPress={() => onMove('left')}>
          <IconLeft />
        </TouchableOpacity>
        <View style={styles.space}>
          {onUndo && (
            <TouchableOpacity style={styles.undoBtn} onPress={onUndo}>
              <IconUndo />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.key} onPress={() => onMove('right')}>
          <IconRight />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.key} onPress={() => onMove('down')}>
        <IconDown />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  midRow: {
    flexDirection: 'row',
    width: 140,
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  key: {
    width: 48,
    height: 48,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#334155',
    elevation: 3,
  },
  space: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
});
