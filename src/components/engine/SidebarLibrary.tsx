import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { withSpring } from 'react-native-reanimated';
import { PrimitiveType, GridSnap } from '../../types/engineTypes';
import { useEngine } from '../../context/EngineContext';
import { useBlueprint } from '../../context/BlueprintContext';
import { PrimitiveRenderer } from './primitives/PrimitiveRenderer';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

const SCENE_PRIMITIVES: PrimitiveType[] = [
  'grid',
  'spawner_marker',
  'tile',
  'text_element'
];

const BLUEPRINT_PRIMITIVES: PrimitiveType[] = [
  'input_block',
  'deadblock',
  'flowflow',
  'if_else_block',
  'loop_block',
  'game_start',
  'game_end'
];

const getIcon = (type: PrimitiveType) => {
  const size = 24;
  const color = '#ddbea9';
  switch (type) {
    case 'grid':
      return <Feather name="grid" size={size} color={color} />;
    case 'input_block':
      return <MaterialCommunityIcons name="keyboard-outline" size={size} color={color} />;
    case 'deadblock':
      return <Feather name="slash" size={size} color={color} />;
    case 'flowflow':
      return <Feather name="git-branch" size={size} color={color} />;
    case 'if_else_block':
      return <MaterialCommunityIcons name="call-split" size={size} color={color} />;
    case 'loop_block':
      return <Feather name="repeat" size={size} color={color} />;
    case 'game_start':
      return <Feather name="play-circle" size={size} color={color} />;
    case 'game_end':
      return <Feather name="stop-circle" size={size} color={color} />;
    case 'spawner_marker':
      return <MaterialCommunityIcons name="target" size={size} color="#f28482" />;
    case 'tile':
      return <Feather name="square" size={size} color={color} />;
    case 'text_element':
      return <Feather name="type" size={size} color={color} />;
    default:
      return <Feather name="help-circle" size={size} color={color} />;
  }
};

interface Props {
  mode: 'scene' | 'blueprint';
}

export const SidebarLibrary: React.FC<Props> = ({ mode }) => {
  const { addElement, elements, setElements, panX, panY, scale } = useEngine();
  const { addLogicNode, panX: bpPanX, panY: bpPanY, scale: bpScale } = useBlueprint();
  const [activeName, setActiveName] = React.useState<string | null>(null);

  const handleAdd = (type: PrimitiveType) => {
    // 40px grid aligned sizes
    const w = type === 'grid' ? 160 : (type === 'spawner_marker' ? 40 : 80);
    const h = type === 'grid' ? 160 : (type === 'spawner_marker' ? 40 : 80);
    
    // Blender style: Find active spawner_marker element on canvas
    const spawner = elements.find((el) => el.type === 'spawner_marker');
    
    // Compute current screen center in canvas-space
    let currentPanX = mode === 'scene' ? panX.value : bpPanX.value;
    let currentPanY = mode === 'scene' ? panY.value : bpPanY.value;
    let currentScale = mode === 'scene' ? scale.value : bpScale.value;

    let x = SCREEN_W * 2 + (SCREEN_W / 2 - currentPanX) / currentScale - w / 2;
    let y = SCREEN_H * 2 + (SCREEN_H / 2 - currentPanY) / currentScale - h / 2;

    if (spawner) {
      x = spawner.x + spawner.w / 2 - w / 2;
      y = spawner.y + spawner.h / 2 - h / 2;
    }

    // Magnetically snap the initial spawn location to 40px grid
    x = Math.round(x / 40) * 40;
    y = Math.round(y / 40) * 40;

    console.log("[Make2D Engine] SPAWNING ELEMENT:", type, { x, y, w, h });

    setActiveName(type.replace(/_/g, ' ').toUpperCase());
    const newId = Math.random().toString(36).substring(7);

    if (mode === 'scene') {
      addElement({ id: newId, type, x, y, w, h });
    } else {
      addLogicNode({ id: newId, type, targetSceneId: null, x, y });
    }
  };

  const handleReset = () => {
    if (mode === 'scene') {
      panX.value = 0;
      panY.value = 0;
      scale.value = 1;

      // Reset spawner marker back to center of screen if present
      setElements((prev) =>
        prev.map((el) => {
          if (el.type === 'spawner_marker') {
            const sx = Math.round((SCREEN_W * 2.5 - 20) / 40) * 40;
            const sy = Math.round((SCREEN_H * 2.5 - 20) / 40) * 40;
            return { ...el, x: sx, y: sy };
          }
          return el;
        })
      );
    } else {
      bpPanX.value = 0;
      bpPanY.value = 0;
      bpScale.value = 1;
    }
  };

  const currentPrimitives = mode === 'scene' ? SCENE_PRIMITIVES : BLUEPRINT_PRIMITIVES;

  return (
    <View style={styles.dock}>
      <View style={styles.dockHeader}>
        <Text style={styles.headerTitle}>{mode === 'scene' ? 'Canvas Library' : 'Blueprint Library'}</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <MaterialCommunityIcons name="cached" size={14} color="#ddbea9" style={{ marginRight: 4 }} />
          <Text style={styles.resetBtnText}>RESET</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.activeTagContainer}>
        <Text style={styles.activeTagText}>
          {activeName ? `[ ${activeName} ]` : '[ SELECT BLOCK ]'}
        </Text>
      </View>

      <View style={styles.iconGrid}>
        {currentPrimitives.map((prim) => (
          <TouchableOpacity
            key={prim}
            onPress={() => handleAdd(prim)}
            onPressIn={() => setActiveName(prim.replace(/_/g, ' ').toUpperCase())}
            style={styles.iconButton}
          >
            {getIcon(prim)}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dock: {
    width: '100%',
    padding: 12,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  dockHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#ddbea9',
    fontWeight: 'bold',
    fontSize: 14,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(221, 190, 169, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(221, 190, 169, 0.2)',
  },
  resetBtnText: {
    color: '#ddbea9',
    fontSize: 9,
    fontWeight: 'bold',
  },
  activeTagContainer: {
    backgroundColor: 'rgba(221, 190, 169, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(221, 190, 169, 0.2)',
    width: '100%',
    alignItems: 'center',
  },
  activeTagText: {
    color: '#ddbea9',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 270, // Fits 5 on top and 4 on bottom perfectly!
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
