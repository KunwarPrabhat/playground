import React from 'react';
import { StyleSheet, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';

interface ChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  active,
  onPress,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.activeChip, style]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.activeChipText, textStyle]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#c2c5aa',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#a68a64',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeChip: {
    backgroundColor: '#656d4a',
    borderColor: '#656d4a',
  },
  chipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#656d4a',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
});
