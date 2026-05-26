import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, LayoutRectangle, TextInput } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useEngine } from '../../context/EngineContext';
import { ElementNode } from '../../types/engineTypes';
import { Feather } from '@expo/vector-icons';

interface Props {
  isVisible: boolean;
}

const DraggableRow = ({ 
  item, 
  depth, 
  isSelected, 
  elements, 
  updateElement, 
  setSelectedId, 
  onDrop, 
  onLayoutItem 
}: any) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const zIndex = useSharedValue(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);

  const pan = Gesture.Pan()
    .onStart(() => {
      zIndex.value = 100;
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      translateX.value = 0;
      translateY.value = 0;
      zIndex.value = 0;
      runOnJS(onDrop)(item.id, e.translationY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value }
    ],
    zIndex: zIndex.value,
  }));

  const isLogic = ['input_block', 'flowflow', 'if_else_block', 'loop_block'].includes(item.type);

  return (
    <Animated.View 
      style={animatedStyle} 
      onLayout={(e) => onLayoutItem(item.id, e.nativeEvent.layout)}
    >
      <GestureDetector gesture={pan}>
        <View style={[styles.itemContainer, { paddingLeft: depth * 20 }]}>
          <TouchableOpacity
            style={[styles.row, isSelected && styles.rowSelected]}
            onPress={() => setSelectedId(item.id)}
            onLongPress={() => setIsEditing(true)}
          >
            {depth > 0 && <View style={styles.treeLine} />}
            {depth > 0 && <Feather name="corner-down-right" size={14} color="#84a59d" style={{ marginRight: 6 }} />}
            {isEditing ? (
              <TextInput
                style={[styles.name, styles.nameInput, isSelected && styles.textSelected]}
                value={editName}
                onChangeText={setEditName}
                autoFocus
                onBlur={() => {
                  updateElement(item.id, { name: editName });
                  setIsEditing(false);
                }}
                onSubmitEditing={() => {
                  updateElement(item.id, { name: editName });
                  setIsEditing(false);
                }}
              />
            ) : (
              <Text style={[styles.name, isSelected && styles.textSelected]} numberOfLines={1}>
                {item.name}
              </Text>
            )}
          </TouchableOpacity>
          
          {isSelected && isLogic && (
            <View style={[styles.targetPicker, { marginLeft: depth > 0 ? 18 : 0 }]}>
               <Text style={styles.targetLabel}>Target Connection:</Text>
               <ScrollView style={styles.targetList} nestedScrollEnabled>
                 {elements.filter((e: ElementNode) => e.id !== item.id).map((t: ElementNode) => (
                   <TouchableOpacity 
                      key={t.id} 
                      onPress={() => updateElement(item.id, { targetId: t.id })} 
                      style={[styles.targetOption, item.targetId === t.id && styles.targetOptionSelected]}
                   >
                     <Text style={[styles.targetOptionText, item.targetId === t.id && { color: '#1d201e', fontWeight: 'bold' }]} numberOfLines={1}>
                        {t.name}
                     </Text>
                   </TouchableOpacity>
                 ))}
                 {elements.length <= 1 && (
                   <Text style={styles.targetOptionText}>No other components</Text>
                 )}
               </ScrollView>
            </View>
          )}
        </View>
      </GestureDetector>
    </Animated.View>
  );
};

export const HierarchyPanel: React.FC<Props> = ({ isVisible }) => {
  const { elements, selectedId, setSelectedId, updateElement } = useEngine();
  const rowLayouts = useRef<Record<string, LayoutRectangle>>({});
  const scrollY = useRef(0);

  if (!isVisible) return null;

  const isDescendant = (parentId: string, childId: string) => {
    let curr = childId;
    while (curr) {
      if (curr === parentId) return true;
      const el = elements.find(e => e.id === curr);
      if (!el || !el.parentId) break;
      curr = el.parentId;
    }
    return false;
  };

  const handleDrop = (draggedId: string, translationY: number) => {
    const draggedLayout = rowLayouts.current[draggedId];
    if (!draggedLayout) return;

    // Use exact scrollview-space coordinates based on translation
    const dropY = draggedLayout.y + (draggedLayout.height / 2) + translationY;
    
    let targetId: string | null = null;
    for (const [id, layout] of Object.entries(rowLayouts.current)) {
      if (id === draggedId) continue;
      // check if drop is within the row's vertical bounds
      if (dropY >= layout.y && dropY <= layout.y + layout.height) {
        targetId = id;
        break;
      }
    }

    if (targetId) {
      if (!isDescendant(draggedId, targetId)) {
        updateElement(draggedId, { parentId: targetId });
      }
    } else {
      updateElement(draggedId, { parentId: null });
    }
  };

  const getFlattenedTree = () => {
    const result: { item: ElementNode; depth: number }[] = [];
    const map = new Map<string | null, ElementNode[]>();
    
    elements.forEach(el => {
      const pid = el.parentId || null;
      if (!map.has(pid)) map.set(pid, []);
      map.get(pid)!.push(el);
    });

    const traverse = (parentId: string | null, depth: number) => {
      const children = map.get(parentId) || [];
      children.forEach(child => {
        result.push({ item: child, depth });
        traverse(child.id, depth + 1);
      });
    };

    traverse(null, 0);
    return result;
  };

  const tree = getFlattenedTree();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hierarchy</Text>
      <ScrollView 
        contentContainerStyle={styles.list}
        onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        {tree.map(({ item, depth }) => (
          <DraggableRow
            key={item.id}
            item={item}
            depth={depth}
            isSelected={item.id === selectedId}
            elements={elements}
            updateElement={updateElement}
            setSelectedId={setSelectedId}
            onDrop={handleDrop}
            onLayoutItem={(id: string, layout: LayoutRectangle) => {
              rowLayouts.current[id] = layout;
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 180,
    backgroundColor: '#1d201e',
    zIndex: 50,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    color: '#ddbea9',
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  list: {
    padding: 8,
  },
  itemContainer: {
    marginBottom: 4,
  },
  row: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSelected: {
    backgroundColor: 'rgba(221, 190, 169, 0.2)',
  },
  treeLine: {
    position: 'absolute',
    left: -10,
    top: -10,
    bottom: 20,
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  name: {
    color: '#fff',
    fontSize: 12,
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 4,
    minWidth: 80,
    marginVertical: -2,
  },
  textSelected: {
    color: '#ddbea9',
    fontWeight: 'bold',
  },
  targetPicker: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  targetLabel: {
    color: '#84a59d',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  targetList: {
    maxHeight: 120,
  },
  targetOption: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  targetOptionSelected: {
    backgroundColor: '#ddbea9',
  },
  targetOptionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
});
