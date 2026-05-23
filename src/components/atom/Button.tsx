import React from 'react';
import { StyleSheet, Text, TouchableOpacity, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type ButtonVariant =
  | 'primary'      // #656d4a
  | 'secondary'    // #b6ad90
  | 'danger'       // #ef4444
  | 'success'      // #12db98
  | 'exit'         // Exit tab styling
  | 'deck-spread'  // #657885ff
  | 'deck-pencil'  // #656d4a (pencil style)
  | 'deck-play'    // #a4ac86
  | 'deck-publish' // #12db98 (publish style)
  | 'add-level'    // Add level style
  | 'undo';        // Undo style

interface ButtonProps {
  onPress: (e?: any) => void;
  title?: string;
  icon?: keyof typeof Feather.glyphMap;
  iconSize?: number;
  iconColor?: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  title,
  icon,
  iconSize = 15,
  iconColor = '#FFFFFF',
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
  children,
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primary;
      case 'secondary':
        return styles.secondary;
      case 'danger':
        return styles.danger;
      case 'success':
        return styles.success;
      case 'exit':
        return styles.exit;
      case 'deck-spread':
        return styles.deckSpread;
      case 'deck-pencil':
        return styles.deckPencil;
      case 'deck-play':
        return styles.deckPlay;
      case 'deck-publish':
        return styles.deckPublish;
      case 'add-level':
        return styles.addLevel;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'add-level':
        return styles.addLevelText;
      default:
        return styles.btnText;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.btn, getVariantStyle(), style, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      {icon && (
        <Feather
          name={icon}
          size={iconSize}
          color={iconColor}
          style={title ? { marginRight: 4 } : undefined}
        />
      )}
      {title && <Text style={[getTextStyle(), textStyle]}>{title}</Text>}
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  primary: {
    backgroundColor: '#656d4a',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondary: {
    backgroundColor: '#b6ad90',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  danger: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  success: {
    backgroundColor: '#12db98',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  exit: {
    backgroundColor: '#656d4a',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deckSpread: {
    backgroundColor: '#657885ff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#474f44',
  },
  deckPencil: {
    backgroundColor: '#656d4a',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  deckPlay: {
    backgroundColor: '#a4ac86',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  deckPublish: {
    backgroundColor: '#12db98',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  addLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  addLevelText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#656d4a',
    marginLeft: 3,
  },
  disabled: {
    opacity: 0.5,
  },
});
