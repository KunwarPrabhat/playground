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
  const {
    nodes, wires, addWire, updateLogicNode, updateLogicNodeTarget,
    selectedNodeId, setSelectedNodeId, scale, setDraftWire, deleteLogicNode,
    activeDragId, activeDragDeltaX, activeDragDeltaY, removeIncomingWires
  } = useBlueprint();

  const { elements, globalVariables } = useEngine();
  const [showPicker, setShowPicker] = useState<string | false>(false);

  const isSelected = selectedNodeId === node.id;

  const translateX = useSharedValue(node.x);
  const translateY = useSharedValue(node.y);

  React.useEffect(() => {
    translateX.value = node.x;
    translateY.value = node.y;

    if (activeDragId.value === node.id) {
      activeDragId.value = null;
      activeDragDeltaX.value = 0;
      activeDragDeltaY.value = 0;
    }
  }, [node.x, node.y]);

  const commitChanges = (x: number, y: number) => {
    updateLogicNode(node.id, { x, y });
  };

  const detachStartX = useSharedValue(0);
  const detachStartY = useSharedValue(0);
  const detachSourceId = useSharedValue<string | null>(null);

  const handleDetachStart = () => {
    const incoming = wires.find(w => w.toNodeId === node.id);
    if (incoming) {
      const sourceNode = nodes.find(n => n.id === incoming.fromNodeId);
      if (sourceNode) {
        removeIncomingWires(node.id);
        const sx = sourceNode.x + 180;
        const sy = sourceNode.y + (sourceNode.height ? sourceNode.height / 2 : 55);
        detachStartX.value = sx;
        detachStartY.value = sy;
        detachSourceId.value = sourceNode.id;
        setDraftWire({ startX: sx, startY: sy, endX: node.x, endY: node.y + nodeCenterY });
      }
    }
  };

  const handleDetachUpdate = (tx: number, ty: number) => {
    if (detachSourceId.value) {
      setDraftWire({
        startX: detachStartX.value,
        startY: detachStartY.value,
        endX: node.x + tx,
        endY: node.y + nodeCenterY + ty
      });
    }
  };

  const handleDetachEnd = (tx: number, ty: number) => {
    if (detachSourceId.value) {
      const dropX = node.x + tx;
      const dropY = node.y + nodeCenterY + ty;
      const sourceId = detachSourceId.value;

      setDraftWire(null);
      detachSourceId.value = null;

      for (const targetNode of nodes) {
        if (targetNode.id === sourceId) continue;
        const pinX = targetNode.x;
        const pinY = targetNode.y + (targetNode.height ? targetNode.height / 2 : 55);
        if (Math.hypot(pinX - dropX, pinY - dropY) < 120) {
          addWire({
            id: Math.random().toString(36).substring(7),
            fromNodeId: sourceId,
            toNodeId: targetNode.id
          });
          break;
        }
      }
    }
  };

  const nodePanGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(setSelectedNodeId)(node.id);
      activeDragId.value = node.id;
      activeDragDeltaX.value = 0;
      activeDragDeltaY.value = 0;
    })
    .onChange((e) => {
      translateX.value += e.changeX / scale.value;
      translateY.value += e.changeY / scale.value;

      activeDragDeltaX.value = translateX.value - node.x;
      activeDragDeltaY.value = translateY.value - node.y;
    })
    .onEnd(() => {
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

      if (dist < 120) {
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
    }
    );
  const leftPinPanGesture = Gesture.Pan()
    .onStart(() => runOnJS(handleDetachStart)())
    .onUpdate((e) => runOnJS(handleDetachUpdate)(e.translationX / scale.value, e.translationY / scale.value))
    .onEnd((e) => runOnJS(handleDetachEnd)(e.translationX / scale.value, e.translationY / scale.value));

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
      case 'set_instance_var': return { bg: 'rgba(155, 100, 200, 0.8)', border: '#9b64c8' };
      case 'spawn_grid': return { bg: 'rgba(233, 196, 106, 0.8)', border: '#e9c46a' };
      case 'get_in_radius': return { bg: 'rgba(230, 90, 90, 0.8)', border: '#e65a5a' };
      case 'get_orthogonal': return { bg: 'rgba(230, 150, 90, 0.8)', border: '#e6965a' };
      case 'box_cast': return { bg: 'rgba(230, 120, 90, 0.8)', border: '#e6785a' };
      case 'for_each_loop': return { bg: 'rgba(72, 190, 160, 0.8)', border: '#48bea0' };
      case 'if_else_block': return { bg: 'rgba(160, 100, 220, 0.8)', border: '#a064dc' };
      case 'count_elements': return { bg: 'rgba(120, 180, 230, 0.8)', border: '#78b4e6' };
      case 'on_execution_complete': return { bg: 'rgba(80, 200, 120, 0.8)', border: '#50c878' };
      case 'init_matrix':
      case 'set_matrix_cell':
      case 'get_matrix_cell': return { bg: 'rgba(212, 163, 115, 0.8)', border: '#d4a373' };
      default: return { bg: 'rgba(255, 255, 255, 0.5)', border: '#ccc' };
    }
  };

  const colors = getColors();

  return (
    <Animated.View onLayout={handleLayout} style={[styles.container, animatedStyle, { zIndex: isSelected ? 100 : 1 }]}>
      <GestureDetector gesture={nodePanGesture}>

        <View style={[styles.block, { backgroundColor: colors.bg, borderColor: isSelected ? '#fff' : colors.border }]}>
          <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', pointerEvents: 'none' }]}>
            <View style={[styles.pin, { left: -6 }]} />
          </View>
          <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center' }]} pointerEvents="box-none">
            <GestureDetector gesture={leftPinPanGesture}>
              <View style={[styles.pin, { left: -6 }]} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} />
            </GestureDetector>
          </View>

          <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center' }]} pointerEvents="box-none">
            <GestureDetector gesture={wirePanGesture}>
              <View style={[styles.pin, { right: -6 }]} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} />
            </GestureDetector>
          </View>

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
                  <TextInput style={styles.valInput} value={node.props?.val?.toString() || ''} onChangeText={(t) => updateNodeProp('val', t)} placeholder="Val (or $key)" placeholderTextColor="rgba(255,255,255,0.4)" />
                </View>
              </View>
            )}

            {node.type === 'set_instance_var' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Target: Active Element</Text>
                <TextInput style={[styles.valInput, { marginBottom: 4 }]} value={node.props?.key || ''} onChangeText={(t) => updateNodeProp('key', t)} placeholder="State Key (e.g. health)" placeholderTextColor="rgba(255,255,255,0.4)" />
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity style={styles.opBtn} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'op' ? false : 'op'); }}>
                    <Text style={styles.targetBtnText}>{node.props?.op || '='}</Text>
                  </TouchableOpacity>
                  <TextInput style={styles.valInput} value={node.props?.val?.toString() || ''} onChangeText={(t) => updateNodeProp('val', t)} placeholder="Val (or $key)" placeholderTextColor="rgba(255,255,255,0.4)" />
                </View>
              </View>
            )}

            {node.type === 'spawn_grid' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Template Element:</Text>
                <TouchableOpacity style={[styles.targetBtn, { marginBottom: 4 }]} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'targetSceneId' ? false : 'targetSceneId'); }}>
                  <Text style={styles.targetBtnText} numberOfLines={1}>{node.targetSceneId ? (elements.find(e => e.id === node.targetSceneId)?.name || node.targetSceneId) : 'Select Element'}</Text>
                  <Feather name="chevron-down" size={12} color="#fff" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                  <TextInput style={styles.valInput} value={node.props?.rows?.toString() || ''} onChangeText={(t) => updateNodeProp('rows', t)} placeholder="Rows" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                  <TextInput style={styles.valInput} value={node.props?.cols?.toString() || ''} onChangeText={(t) => updateNodeProp('cols', t)} placeholder="Cols" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                </View>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TextInput style={styles.valInput} value={node.props?.gapX?.toString() || ''} onChangeText={(t) => updateNodeProp('gapX', t)} placeholder="Gap X" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                  <TextInput style={styles.valInput} value={node.props?.gapY?.toString() || ''} onChangeText={(t) => updateNodeProp('gapY', t)} placeholder="Gap Y" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                </View>
              </View>
            )}

            {node.type === 'init_matrix' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Target Canvas ID:</Text>
                <TouchableOpacity style={[styles.targetBtn, {marginBottom: 4}]} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'targetSceneId' ? false : 'targetSceneId'); }}>
                  <Text style={styles.targetBtnText} numberOfLines={1}>{node.targetSceneId ? (elements.find(e => e.id === node.targetSceneId)?.name || node.targetSceneId) : 'Select Element'}</Text>
                  <Feather name="chevron-down" size={12} color="#fff" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TextInput style={styles.valInput} value={node.props?.rows?.toString() || ''} onChangeText={(t) => updateNodeProp('rows', t)} placeholder="Rows" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                  <TextInput style={styles.valInput} value={node.props?.cols?.toString() || ''} onChangeText={(t) => updateNodeProp('cols', t)} placeholder="Cols" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                </View>
              </View>
            )}

            {node.type === 'set_matrix_cell' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Target Canvas ID:</Text>
                <TouchableOpacity style={[styles.targetBtn, {marginBottom: 4}]} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'targetSceneId' ? false : 'targetSceneId'); }}>
                  <Text style={styles.targetBtnText} numberOfLines={1}>{node.targetSceneId ? (elements.find(e => e.id === node.targetSceneId)?.name || node.targetSceneId) : 'Select Element'}</Text>
                  <Feather name="chevron-down" size={12} color="#fff" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                  <TextInput style={styles.valInput} value={node.props?.row?.toString() || ''} onChangeText={(t) => updateNodeProp('row', t)} placeholder="Row" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                  <TextInput style={styles.valInput} value={node.props?.col?.toString() || ''} onChangeText={(t) => updateNodeProp('col', t)} placeholder="Col" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                </View>
                <TextInput style={styles.valInput} value={node.props?.val?.toString() || ''} onChangeText={(t) => updateNodeProp('val', t)} placeholder="Value" placeholderTextColor="rgba(255,255,255,0.4)" />
              </View>
            )}

            {node.type === 'get_matrix_cell' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Target Canvas ID:</Text>
                <TouchableOpacity style={[styles.targetBtn, {marginBottom: 4}]} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'targetSceneId' ? false : 'targetSceneId'); }}>
                  <Text style={styles.targetBtnText} numberOfLines={1}>{node.targetSceneId ? (elements.find(e => e.id === node.targetSceneId)?.name || node.targetSceneId) : 'Select Element'}</Text>
                  <Feather name="chevron-down" size={12} color="#fff" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                  <TextInput style={styles.valInput} value={node.props?.row?.toString() || ''} onChangeText={(t) => updateNodeProp('row', t)} placeholder="Row" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                  <TextInput style={styles.valInput} value={node.props?.col?.toString() || ''} onChangeText={(t) => updateNodeProp('col', t)} placeholder="Col" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                </View>
                <TextInput style={styles.valInput} value={node.props?.saveKey || ''} onChangeText={(t) => updateNodeProp('saveKey', t)} placeholder="Save Val to Key" placeholderTextColor="rgba(255,255,255,0.4)" />
              </View>
            )}

            {node.type === 'get_in_radius' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Origin: Active Element</Text>
                <TextInput style={[styles.valInput, { marginBottom: 4 }]} value={node.props?.radius?.toString() || ''} onChangeText={(t) => updateNodeProp('radius', t)} placeholder="Radius (px)" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                <TextInput style={styles.valInput} value={node.props?.saveKey || ''} onChangeText={(t) => updateNodeProp('saveKey', t)} placeholder="Save Array to Key (e.g. neighbors)" placeholderTextColor="rgba(255,255,255,0.4)" />
              </View>
            )}

            {node.type === 'get_orthogonal' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Origin: Active Element</Text>
                <TextInput style={[styles.valInput, { marginBottom: 4 }]} value={node.props?.distance?.toString() || ''} onChangeText={(t) => updateNodeProp('distance', t)} placeholder="Distance (px)" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                <TextInput style={styles.valInput} value={node.props?.saveKey || ''} onChangeText={(t) => updateNodeProp('saveKey', t)} placeholder="Save Array to Key (e.g. neighbors)" placeholderTextColor="rgba(255,255,255,0.4)" />
              </View>
            )}

            {node.type === 'box_cast' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Origin: Active Element</Text>
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                  <TextInput style={styles.valInput} value={node.props?.width?.toString() || ''} onChangeText={(t) => updateNodeProp('width', t)} placeholder="Width" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                  <TextInput style={styles.valInput} value={node.props?.height?.toString() || ''} onChangeText={(t) => updateNodeProp('height', t)} placeholder="Height" placeholderTextColor="rgba(255,255,255,0.4)" keyboardType="numeric" />
                </View>
                <TextInput style={styles.valInput} value={node.props?.saveKey || ''} onChangeText={(t) => updateNodeProp('saveKey', t)} placeholder="Save Array to Key" placeholderTextColor="rgba(255,255,255,0.4)" />
              </View>
            )}

            {node.type === 'for_each_loop' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Iterate Over Array:</Text>
                <TextInput style={styles.valInput} value={node.props?.arrayKey || ''} onChangeText={(t) => updateNodeProp('arrayKey', t)} placeholder="Array Key (e.g. nearbyTiles)" placeholderTextColor="rgba(255,255,255,0.4)" />
                <Text style={[styles.targetLabel, { marginTop: 4, color: '#48bea0' }]}>* Outputs to array items</Text>
              </View>
            )}

            {node.type === 'if_else_block' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Condition (Active Element):</Text>
                <TextInput style={[styles.valInput, { marginBottom: 4 }]} value={node.props?.key || ''} onChangeText={(t) => updateNodeProp('key', t)} placeholder="State Key (e.g. isMine)" placeholderTextColor="rgba(255,255,255,0.4)" />
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  <TouchableOpacity style={styles.opBtn} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'cond' ? false : 'cond'); }}>
                    <Text style={styles.targetBtnText}>{node.props?.cond || '=='}</Text>
                  </TouchableOpacity>
                  <TextInput style={styles.valInput} value={node.props?.val?.toString() || ''} onChangeText={(t) => updateNodeProp('val', t)} placeholder="Val (or $key)" placeholderTextColor="rgba(255,255,255,0.4)" />
                </View>
                <Text style={[styles.targetLabel, { marginTop: 4, color: '#a064dc' }]}>* Continues ONLY if True</Text>
              </View>
            )}

            {node.type === 'count_elements' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Count Elements Where:</Text>
                <TextInput style={[styles.valInput, { marginBottom: 4 }]} value={node.props?.key || ''} onChangeText={(t) => updateNodeProp('key', t)} placeholder="State Key (e.g. owner)" placeholderTextColor="rgba(255,255,255,0.4)" />
                <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
                  <TouchableOpacity style={styles.opBtn} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'cond' ? false : 'cond'); }}>
                    <Text style={styles.targetBtnText}>{node.props?.cond || '=='}</Text>
                  </TouchableOpacity>
                  <TextInput style={styles.valInput} value={node.props?.val?.toString() || ''} onChangeText={(t) => updateNodeProp('val', t)} placeholder="Val (or $key)" placeholderTextColor="rgba(255,255,255,0.4)" />
                </View>
                <TextInput style={styles.valInput} value={node.props?.saveKey || ''} onChangeText={(t) => updateNodeProp('saveKey', t)} placeholder="Save Count To Key" placeholderTextColor="rgba(255,255,255,0.4)" />
              </View>
            )}

            {node.type === 'on_execution_complete' && (
              <View style={styles.targetSection}>
                <Text style={styles.targetLabel}>Target Canvas ID:</Text>
                <TouchableOpacity style={styles.targetBtn} onPress={() => { setSelectedNodeId(node.id); setShowPicker(showPicker === 'targetSceneId' ? false : 'targetSceneId'); }}>
                  <Text style={styles.targetBtnText} numberOfLines={1}>{node.targetSceneId ? (elements.find(e => e.id === node.targetSceneId)?.name || node.targetSceneId) : 'Select Element'}</Text>
                  <Feather name="chevron-down" size={12} color="#fff" />
                </TouchableOpacity>
                <Text style={[styles.targetLabel, { marginTop: 4, color: '#50c878' }]}>* Fires when interaction queue is empty</Text>
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#333',
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
