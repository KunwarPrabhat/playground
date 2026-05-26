import React from 'react';
import { View, Text, StyleSheet, TextInput, Keyboard } from 'react-native';
import { PrimitiveType } from '../../../types/engineTypes';

interface Props {
  type: PrimitiveType;
  width: number;
  height: number;
  instanceState?: Record<string, any>;
  updateElement?: (updates: any) => void;
  mode?: 'edit' | 'play';
  isSelected?: boolean;
}

export const PrimitiveRenderer: React.FC<Props> = ({ type, width, height, instanceState, updateElement, mode, isSelected }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'grid': return 'rgba(107, 112, 92, 0.4)';
      case 'tile':
        if (instanceState?.infected === 1) return '#e65a5a';
        if (instanceState?.infected === 2) return '#48bea0';
        return 'rgba(255, 255, 255, 0.2)';
      default: return 'rgba(255, 255, 255, 0.5)';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'grid': return '#6b705c';
      case 'tile':
        if (instanceState?.infected === 1) return '#ff7b7b';
        if (instanceState?.infected === 2) return '#5cf2cc';
        return '#ccc';
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

  if (type === 'tile') {
    const owner = instanceState?.owner || 0;
    const mass = instanceState?.mass || 0;
    const color = owner === 1 ? '#ff4d4d' : owner === -1 ? '#48bea0' : 'rgba(255, 255, 255, 0.1)';
    const borderColor = owner === 1 ? '#ff7b7b' : owner === -1 ? '#5cf2cc' : 'rgba(255,255,255,0.3)';

    return (
      <View style={[styles.container, { width, height, backgroundColor: 'rgba(0,0,0,0.5)', borderColor, borderWidth: owner !== 0 ? 2 : 1 }]}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 4, padding: 8 }}>
          {Array.from({ length: Math.min(mass, 4) }).map((_, i) => (
            <View key={i} style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: color, shadowColor: color, shadowOpacity: 1, shadowRadius: 8, elevation: 5 }} />
          ))}
        </View>
      </View>
    );
  }

  if (type === 'grid') {
    const mRows = instanceState?.matrix?.length || Math.max(1, Math.floor(height / 32));
    const mCols = instanceState?.matrix?.[0]?.length || Math.max(1, Math.floor(width / 32));
    return (
      <View style={[styles.container, { width, height, backgroundColor: '#0B0E14', borderColor: '#00f0ff', borderWidth: 2, padding: 2, flexDirection: 'column', shadowColor: '#00f0ff', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 }]}>
        {Array.from({ length: mRows }).map((_, r) => (
          <View key={r} style={{ flexDirection: 'row', flex: 1 }}>
            {Array.from({ length: mCols }).map((_, c) => {
              const val = instanceState?.matrix?.[r]?.[c] || 0;
              const cellColor = val === 1 ? '#00f0ff' : val === -1 ? '#ff0055' : 'transparent';
              return (
                <View key={c} style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)', backgroundColor: cellColor, margin: 1, borderRadius: 2 }} />
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  if (type === 'text_element') {
    return (
      <View style={[styles.container, { width, height, backgroundColor: 'transparent', borderWidth: mode === 'edit' ? 1 : 0, borderColor: 'rgba(255,255,255,0.2)', padding: 10 }]}>
         <View pointerEvents={isSelected ? "auto" : "none"} style={{ flex: 1 }}>
           <TextInput 
             style={{ color: '#fff', fontSize: 16, width: '100%', height: '100%', textAlign: 'center' }}
             value={instanceState?.text || ''}
             placeholder={mode === 'edit' ? "Double Tap to Type..." : ""}
             placeholderTextColor="rgba(255,255,255,0.3)"
             onChangeText={(t) => updateElement && updateElement({ instanceState: { ...instanceState, text: t } })}
             editable={isSelected && mode === 'edit'}
             onBlur={() => Keyboard.dismiss()}
             multiline
           />
         </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width, height, backgroundColor: getBackgroundColor(), borderColor: getBorderColor() }]}>
      <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>{formatTitle(type)}</Text>
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
