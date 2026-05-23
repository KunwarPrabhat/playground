import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { PrimitiveType, GridSnap } from '../../types/engineTypes';
import { useEngine } from '../../context/EngineContext';
import { PrimitiveRenderer } from './primitives/PrimitiveRenderer';

const PRIMITIVES: PrimitiveType[] = [
  'grid',
  'input_block',
  'deadblock',
  'flowflow',
  'if_else_block',
  'loop_block',
  'game_start',
  'game_end',
];

export const SidebarLibrary: React.FC = () => {
  const { addElement, snapSize, setSnapSize } = useEngine();

  const handleAdd = (type: PrimitiveType) => {
    addElement({
      id: Math.random().toString(36).substring(7),
      type,
      x: 100,
      y: 100,
      w: 64,
      h: 64,
    });
  };

  const snaps: GridSnap[] = ['off', 8, 16, 32];

  return (
    <View style={styles.sidebar}>
      <Text style={styles.header}>Library</Text>
      
      <View style={styles.snapConfig}>
        <Text style={styles.snapLabel}>Snap:</Text>
        <View style={styles.snapRow}>
          {snaps.map((s) => (
            <TouchableOpacity
              key={s.toString()}
              style={[styles.snapBtn, snapSize === s && styles.snapBtnActive]}
              onPress={() => setSnapSize(s)}
            >
              <Text style={[styles.snapBtnText, snapSize === s && styles.snapBtnTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {PRIMITIVES.map((prim) => (
          <TouchableOpacity key={prim} onPress={() => handleAdd(prim)} style={styles.itemWrapper}>
            <View pointerEvents="none">
              <PrimitiveRenderer type={prim} width={80} height={40} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    width: 120,
    backgroundColor: 'rgba(30, 30, 30, 0.65)',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  header: {
    color: '#ddbea9',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 16,
  },
  snapConfig: {
    width: '100%',
    paddingHorizontal: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  snapLabel: {
    color: '#fff',
    fontSize: 10,
    marginBottom: 4,
  },
  snapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  snapBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  snapBtnActive: {
    backgroundColor: '#cb997e',
  },
  snapBtnText: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
  },
  snapBtnTextActive: {
    color: '#fff',
  },
  scroll: {
    paddingBottom: 40,
    alignItems: 'center',
    gap: 12,
  },
  itemWrapper: {
    marginBottom: 12,
  }
});
