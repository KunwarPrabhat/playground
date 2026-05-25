import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useBlueprint, LogicNode } from '../../context/BlueprintContext';
import { useEngine } from '../../context/EngineContext';
import { Feather } from '@expo/vector-icons';

interface Props {
  node: LogicNode;
}

export const LogicNodeUI: React.FC<Props> = ({ node }) => {
  const { updateLogicNode, updateLogicNodeTarget, selectedNodeId, setSelectedNodeId } = useBlueprint();
  const { elements } = useEngine();
  const [showPicker, setShowPicker] = useState(false);

  const isSelected = selectedNodeId === node.id;

  const translateX = useSharedValue(node.x);
  const translateY = useSharedValue(node.y);

  React.useEffect(() => {
    translateX.value = node.x;
    translateY.value = node.y;
  }, [node, translateX, translateY]);

  const commitChanges = (x: number, y: number) => {
    updateLogicNode(node.id, { x, y });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = Math.round((node.x + e.translationX) / 20) * 20;
      translateY.value = Math.round((node.y + e.translationY) / 20) * 20;
    })
    .onEnd(() => {
      const sx = translateX.value;
      const sy = translateY.value;
      translateX.value = withSpring(sx, { damping: 15, stiffness: 120 });
      translateY.value = withSpring(sy, { damping: 15, stiffness: 120 });
      runOnJS(commitChanges)(sx, sy);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const handleSelectTarget = (targetId: string) => {
    updateLogicNodeTarget(node.id, targetId);
    setShowPicker(false);
  };

  const formatTitle = (t: string) => t.replace(/_/g, ' ').toUpperCase();

  const getColors = () => {
    switch (node.type) {
      case 'input_block': return { bg: 'rgba(203, 153, 126, 0.8)', border: '#cb997e' };
      case 'flowflow': return { bg: 'rgba(165, 165, 141, 0.8)', border: '#a5a58d' };
      case 'if_else_block': return { bg: 'rgba(183, 183, 164, 0.8)', border: '#b7b7a4' };
      case 'loop_block': return { bg: 'rgba(221, 190, 169, 0.8)', border: '#ddbea9' };
      default: return { bg: 'rgba(255, 255, 255, 0.5)', border: '#ccc' };
    }
  };

  const colors = getColors();

  return (
    <Animated.View style={[styles.container, animatedStyle, { zIndex: isSelected ? 100 : 1 }]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <TouchableWithoutFeedback onPress={() => setSelectedNodeId(node.id)}>
            <View style={[styles.block, { backgroundColor: colors.bg, borderColor: isSelected ? '#fff' : colors.border }]}>

              {/* Input Pin */}
              <View style={[styles.pin, styles.pinLeft]} />
              {/* Output Pin */}
              <View style={[styles.pin, styles.pinRight]} />

              <Text style={styles.title}>{formatTitle(node.type)}</Text>

              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Target Scene Element:</Text>
                <TouchableOpacity
                  style={styles.targetBtn}
                  onPress={() => {
                    setSelectedNodeId(node.id);
                    setShowPicker(!showPicker);
                  }}
                >
                  <Text style={styles.targetBtnText} numberOfLines={1}>
                    {node.targetSceneId ? (elements.find(e => e.id === node.targetSceneId)?.name || 'Missing Element') : 'Select Target'}
                  </Text>
                  <Feather name="chevron-down" size={12} color="#fff" />
                </TouchableOpacity>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </GestureDetector>

      {/* Target Picker Popover */}
      {isSelected && showPicker && (
        <View style={styles.pickerOverlay}>
          <Text style={styles.pickerTitle}>Scene Elements</Text>
          <ScrollView style={styles.pickerList} nestedScrollEnabled>
            {elements.map((el) => (
              <TouchableOpacity key={el.id} style={styles.pickerOption} onPress={() => handleSelectTarget(el.id)}>
                <Text style={styles.pickerOptionName}>{el.name}</Text>
                <Text style={styles.pickerOptionId}>{el.id}</Text>
              </TouchableOpacity>
            ))}
            {elements.length === 0 && (
              <Text style={styles.pickerOptionName}>No elements in scene</Text>
            )}
          </ScrollView>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 160,
    height: 100,
  },
  block: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-between',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  pin: {
    position: 'absolute',
    top: '50%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
    marginTop: -6,
  },
  pinLeft: {
    left: -6,
  },
  pinRight: {
    right: -6,
  },
  targetSection: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 6,
    borderRadius: 4,
  },
  targetLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    marginBottom: 4,
  },
  targetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 4,
    borderRadius: 4,
  },
  targetBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 4,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 105,
    left: 0,
    right: 0,
    backgroundColor: '#282828',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#444',
    zIndex: 200,
  },
  pickerTitle: {
    color: '#aaa',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 4,
  },
  pickerList: {
    maxHeight: 120,
  },
  pickerOption: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerOptionName: {
    color: '#fff',
    fontSize: 10,
  },
  pickerOptionId: {
    color: '#666',
    fontSize: 8,
  },
});
