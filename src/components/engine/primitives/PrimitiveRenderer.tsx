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
    
    // BuddyMattEnt Colors: Neon Red and Neon Green
    const atomColor = owner === 1 ? '#ff3333' : owner === -1 ? '#33ff33' : 'transparent';

    const renderAtoms = () => {
      if (mass === 1) return <View style={{width: 18, height: 18, borderRadius: 9, backgroundColor: atomColor, shadowColor: atomColor, shadowOpacity: 1, shadowRadius: 10, elevation: 5}} />;
      if (mass === 2) return (
        <View style={{flexDirection: 'row', gap: 4}}>
          <View style={{width: 14, height: 14, borderRadius: 7, backgroundColor: atomColor, shadowColor: atomColor, shadowOpacity: 1, shadowRadius: 8}} />
          <View style={{width: 14, height: 14, borderRadius: 7, backgroundColor: atomColor, shadowColor: atomColor, shadowOpacity: 1, shadowRadius: 8}} />
        </View>
      );
      if (mass === 3) return (
        <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 2, width: 34}}>
          <View style={{width: 12, height: 12, borderRadius: 6, backgroundColor: atomColor}} />
          <View style={{width: 12, height: 12, borderRadius: 6, backgroundColor: atomColor}} />
          <View style={{width: 12, height: 12, borderRadius: 6, backgroundColor: atomColor}} />
        </View>
      );
      return null;
    };

    return (
      <View style={[styles.container, { 
        width, height, 
        backgroundColor: 'rgba(20, 24, 30, 0.9)', 
        borderWidth: 1, 
        borderColor: owner === 1 ? 'rgba(255, 51, 51, 0.3)' : owner === -1 ? 'rgba(51, 255, 51, 0.3)' : 'rgba(255, 255, 255, 0.1)', 
        justifyContent: 'center', alignItems: 'center' 
      }]}>
        {renderAtoms()}
      </View>
    );
  }

  
  if (type === 'grid') {
    const mRows = instanceState?.matrix?.length || Math.max(1, Math.floor(height / 40));
    const mCols = instanceState?.matrix?.[0]?.length || Math.max(1, Math.floor(width / 40));
    return (
      <View style={[styles.container, { width, height, backgroundColor: 'rgba(30, 34, 42, 0.4)', borderColor: 'rgba(132, 165, 157, 0.5)', borderWidth: 1.5, padding: 0, flexDirection: 'column' }]}>
        {Array.from({ length: mRows }).map((_, r) => (
          <View key={r} style={{ flexDirection: 'row', flex: 1 }}>
            {Array.from({ length: mCols }).map((_, c) => {
              const val = instanceState?.matrix?.[r]?.[c] || 0;
              const cellColor = val === 1 ? '#84a59d' : val === -1 ? '#f28482' : 'transparent';
              return (
                <View key={c} style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', backgroundColor: cellColor }} />
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  if (type === 'text_element') {
    const calculatedFontSize = Math.max(12, Math.floor(height * 0.3));
    return (
      <View style={[styles.container, { width, height, backgroundColor: 'transparent', borderWidth: mode === 'edit' ? 1 : 0, borderColor: 'rgba(255,255,255,0.2)', padding: 10 }]}>
        <View pointerEvents={isSelected ? "auto" : "none"} style={{ flex: 1 }}>
          <TextInput
            style={{ color: '#fff', fontSize: calculatedFontSize, width: '100%', height: '100%', textAlign: 'center' }}
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
