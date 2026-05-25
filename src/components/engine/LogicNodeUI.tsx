import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useBlueprint, LogicNode } from '../../context/BlueprintContext';
import { useEngine } from '../../context/EngineContext';
import { Feather } from '@expo/vector-icons';
import { TextInput } from 'react-native';

interface Props {
  node: LogicNode;
}

export const LogicNodeUI: React.FC<Props> = ({ node }) => {
  const { nodes, addWire, updateLogicNode, updateLogicNodeTarget, selectedNodeId, setSelectedNodeId, scale, setDraftWire, deleteLogicNode, activeDragId, activeDragDeltaX, activeDragDeltaY } = useBlueprint();
  const { elements, globalVariables } = useEngine();
  const [showPicker, setShowPicker] = useState<string | false>(false);

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

  const nodePanGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(setSelectedNodeId)(node.id);
      // Track the start of the drag
      activeDragId.value = node.id;
      activeDragDeltaX.value = 0;
      activeDragDeltaY.value = 0;
    })
    .onChange((e) => {
      translateX.value += e.changeX / scale.value;
      translateY.value += e.changeY / scale.value;
      
      // Calculate and broadcast the real-time difference from the saved state
      activeDragDeltaX.value = translateX.value - node.x;
      activeDragDeltaY.value = translateY.value - node.y;
    })
    .onEnd(() => {
      // Clear the drag state
      activeDragId.value = null;
      activeDragDeltaX.value = 0;
      activeDragDeltaY.value = 0;
      runOnJS(updateLogicNode)(node.id, { x: translateX.value, y: translateY.value });
    }
  );

  const handleConnectWire = (dX: number, dY: number) => {
    console.log("[LogicNodeUI] handleConnectWire target drop coordinates in canvas-space:", dX, dY);
    for (const targetNode of nodes) {
      if (targetNode.id === node.id) continue;

      const pinX = targetNode.x;
      const pinY = targetNode.y + (targetNode.height ? targetNode.height / 2 : 55);
      const dist = Math.hypot(pinX - dX, pinY - dY);

      console.log(`[LogicNodeUI] Checking target node: ${targetNode.id} at pinX:${pinX}, pinY:${pinY}. Distance is ${dist}`);

      if (dist < 120) { // Even larger snapping tolerance for easy finger gestures!
        console.log(`[LogicNodeUI] Snapped successfully to node ${targetNode.id}! Creating wire.`);
        addWire({
          id: Math.random().toString(36).substring(7),
          fromNodeId: node.id,
          toNodeId: targetNode.id
        });
        break;
      }
    }
  };

  const nodeCenterY = node.height ? node.height / 2 : 55;

  const wirePanGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(setDraftWire)({
        startX: node.x + 180,
        startY: node.y + nodeCenterY,
        endX: node.x + 180,
        endY: node.y + nodeCenterY
      });
    })
    .onUpdate((e) => {
      runOnJS(setDraftWire)({
        startX: node.x + 180,
        startY: node.y + nodeCenterY,
        endX: node.x + 180 + e.translationX / scale.value,
        endY: node.y + nodeCenterY + e.translationY / scale.value
      });
    })
    .onEnd((e) => {
      const dropX = node.x + 180 + e.translationX / scale.value;
      const dropY = node.y + 55 + e.translationY / scale.value;

      runOnJS(setDraftWire)(null);
      runOnJS(handleConnectWire)(dropX, dropY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const updateNodeProp = (key: string, value: any) => {
    updateLogicNode(node.id, { props: { ...node.props, [key]: value } });
  };

  const handleSelectPicker = (val: string) => {
    if (showPicker === 'targetSceneId') {
      updateLogicNodeTarget(node.id, val);
    } else if (showPicker) {
      updateNodeProp(showPicker, val);
    }
    setShowPicker(false);
  };

  const formatTitle = (t: string) => t.replace(/_/g, ' ').toUpperCase();

  const handleLayout = (e: any) => {
    const { height } = e.nativeEvent.layout;
    if (!node.height || Math.abs(node.height - height) > 1) {
      updateLogicNode(node.id, { height });
    }
  };

  const getColors = () => {
    switch (node.type) {
      case 'on_interact': return { bg: 'rgba(203, 153, 126, 0.8)', border: '#cb997e' };
      case 'modify_variable': return { bg: 'rgba(165, 165, 141, 0.8)', border: '#a5a58d' };
      case 'compare_state': return { bg: 'rgba(183, 183, 164, 0.8)', border: '#b7b7a4' };
      case 'set_canvas_text': return { bg: 'rgba(221, 190, 169, 0.8)', border: '#ddbea9' };
      case 'random_int': return { bg: 'rgba(100, 150, 200, 0.8)', border: '#6496c8' };
      default: return { bg: 'rgba(255, 255, 255, 0.5)', border: '#ccc' };
    }
  };

  const colors = getColors();

  return (
    <Animated.View onLayout={handleLayout} style={[styles.container, animatedStyle, { zIndex: isSelected ? 100 : 1 }]}>
      <GestureDetector gesture={nodePanGesture}>
        <View style={[styles.block, { backgroundColor: colors.bg, borderColor: isSelected ? '#fff' : colors.border }]}>
          {/* Pins on the middle borders */}
          <View style={[styles.pin, styles.pinLeft]} />
          <GestureDetector gesture={wirePanGesture}>
            <View style={[styles.pin, styles.pinRight]} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} />
          </GestureDetector>

          {/* Premium Glowing Absolute-Positioned Delete Button on Top Right Intersection */}
          <TouchableOpacity
            onPress={() => deleteLogicNode(node.id)}
            style={styles.deleteNodeBtn}
            activeOpacity={0.7}
          >
            <Feather name="x" size={10} color="#ff4d4d" />
          </TouchableOpacity>

          <View style={{ flex: 1 }} pointerEvents="box-none">
            <View style={{ marginBottom: 6, paddingRight: 12 }}>
              <Text style={styles.title} numberOfLines={1}>{formatTitle(node.type)}</Text>
            </View>

            {(node.type === 'on_interact' || node.type === 'set_canvas_text') && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Target Canvas ID:</Text>
                <TouchableOpacity style={styles.targetBtn} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'targetSceneId' ? false : 'targetSceneId'); }}>
                  <Text style={styles.targetBtnText} numberOfLines={1}>{node.targetSceneId ? (elements.find(e => e.id === node.targetSceneId)?.name || node.targetSceneId) : 'Select Element'}</Text>
                  <Feather name="chevron-down" size={12} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {node.type === 'modify_variable' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Target Variable:</Text>
                <TouchableOpacity style={styles.targetBtn} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'targetVar' ? false : 'targetVar'); }}>
                  <Text style={styles.targetBtnText} numberOfLines={1}>{node.props?.targetVar ? (globalVariables.find(v => v.id === node.props?.targetVar)?.name || 'Missing') : 'Select Variable'}</Text>
                  <Feather name="chevron-down" size={12} color="#fff" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                  <TouchableOpacity style={styles.opBtn} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'op' ? false : 'op'); }}>
                    <Text style={styles.targetBtnText}>{node.props?.op || '='}</Text>
                  </TouchableOpacity>
                  <TextInput style={styles.valInput} value={node.props?.val?.toString() || ''} onChangeText={(t) => updateNodeProp('val', t)} placeholder="Value" placeholderTextColor="rgba(255,255,255,0.4)" />
                </View>
              </View>
            )}

            {node.type === 'compare_state' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Compare:</Text>
                <TouchableOpacity style={styles.targetBtn} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'varA' ? false : 'varA'); }}>
                  <Text style={styles.targetBtnText} numberOfLines={1}>{node.props?.varA ? (globalVariables.find(v => v.id === node.props?.varA)?.name || 'Missing') : 'Variable A'}</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                  <TouchableOpacity style={styles.opBtn} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'cond' ? false : 'cond'); }}>
                    <Text style={styles.targetBtnText}>{node.props?.cond || '=='}</Text>
                  </TouchableOpacity>
                  <TextInput style={styles.valInput} value={node.props?.varB?.toString() || ''} onChangeText={(t) => updateNodeProp('varB', t)} placeholder="Var B or Val" placeholderTextColor="rgba(255,255,255,0.4)" />
                </View>
              </View>
            )}

            {node.type === 'random_int' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Range:</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TextInput style={styles.valInput} value={node.props?.min?.toString() || ''} onChangeText={(t) => updateNodeProp('min', t)} placeholder="Min" placeholderTextColor="rgba(255,255,255,0.4)" />
                  <TextInput style={styles.valInput} value={node.props?.max?.toString() || ''} onChangeText={(t) => updateNodeProp('max', t)} placeholder="Max" placeholderTextColor="rgba(255,255,255,0.4)" />
                </View>
              </View>
            )}
          </View>
        </View>
      </GestureDetector>

      {/* Dynamic Picker Popover */}
      {isSelected && showPicker && (
        <View style={styles.pickerOverlay}>
          <Text style={styles.pickerTitle}>Select Option</Text>
          <ScrollView style={styles.pickerList} nestedScrollEnabled>

            {showPicker === 'targetSceneId' && elements.map((el) => (
              <TouchableOpacity key={el.id} style={styles.pickerOption} onPress={() => handleSelectPicker(el.id)}>
                <Text style={styles.pickerOptionName}>{el.name}</Text>
                <Text style={styles.pickerOptionId}>{el.type}</Text>
              </TouchableOpacity>
            ))}

            {(showPicker === 'targetVar' || showPicker === 'varA') && globalVariables.map((v) => (
              <TouchableOpacity key={v.id} style={styles.pickerOption} onPress={() => handleSelectPicker(v.id)}>
                <Text style={styles.pickerOptionName}>{v.name}</Text>
                <Text style={styles.pickerOptionId}>Val: {v.value}</Text>
              </TouchableOpacity>
            ))}

            {showPicker === 'op' && ['+', '-', '=', '*'].map((op) => (
              <TouchableOpacity key={op} style={styles.pickerOption} onPress={() => handleSelectPicker(op)}>
                <Text style={styles.pickerOptionName}>{op}</Text>
              </TouchableOpacity>
            ))}

            {showPicker === 'cond' && ['==', '!=', '>', '<', '>=', '<='].map((cond) => (
              <TouchableOpacity key={cond} style={styles.pickerOption} onPress={() => handleSelectPicker(cond)}>
                <Text style={styles.pickerOptionName}>{cond}</Text>
              </TouchableOpacity>
            ))}

            {/* Empty states */}
            {showPicker === 'targetSceneId' && elements.length === 0 && (
              <Text style={styles.pickerOptionName}>No elements in scene</Text>
            )}
            {(showPicker === 'targetVar' || showPicker === 'varA') && globalVariables.length === 0 && (
              <Text style={styles.pickerOptionName}>No variables defined</Text>
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
    width: 180,
    minHeight: 110,
  },
  block: {
    width: '100%',
    height: '100%',
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
  opBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 4,
    borderRadius: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    color: '#fff',
    fontSize: 10,
    padding: 0,
    paddingHorizontal: 4,
    borderRadius: 4,
    height: 22,
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
  deleteNodeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2a0a0a',
    borderWidth: 2,
    borderColor: '#ff4d4d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 20,
  },
});
