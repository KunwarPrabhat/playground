import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Defs, Pattern, Circle, Line, Rect, Path, G } from 'react-native-svg';
import { useBlueprint } from '../../context/BlueprintContext';
import { LogicNodeUI } from './LogicNodeUI';
import { useAnimatedProps } from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const BlueprintWorkspace: React.FC = () => {
  const { nodes, wires, draftWire, selectedNodeId, setSelectedNodeId, panX, panY, scale } = useBlueprint();

  const isPinching = useSharedValue(false);
  const blockPanNextFrame = useSharedValue(false);
  const pinchStartScale = useSharedValue(1);
  const pinchStartPanX = useSharedValue(0);
  const pinchStartPanY = useSharedValue(0);
  const pinchStartFocalX = useSharedValue(0);
  const pinchStartFocalY = useSharedValue(0);

  const canvasPanGesture = Gesture.Pan()
    .onChange((e) => {
      if (isPinching.value) return;
      if (e.numberOfPointers !== 1) return;
      if (blockPanNextFrame.value) {
        blockPanNextFrame.value = false;
        return;
      }
      panX.value += e.changeX;
      panY.value += e.changeY;
    });

  const canvasPinchGesture = Gesture.Pinch()
    .onStart((e) => {
      isPinching.value = true;
      pinchStartScale.value = scale.value;
      pinchStartPanX.value = panX.value;
      pinchStartPanY.value = panY.value;
      pinchStartFocalX.value = e.focalX;
      pinchStartFocalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const newScale = Math.max(0.5, Math.min(3, pinchStartScale.value * e.scale));
      scale.value = newScale;
      const k = newScale / pinchStartScale.value;
      panX.value = e.focalX - SCREEN_W / 2 - (pinchStartFocalX.value - SCREEN_W / 2 - pinchStartPanX.value) * k;
      panY.value = e.focalY - SCREEN_H / 2 - (pinchStartFocalY.value - SCREEN_H / 2 - pinchStartPanY.value) * k;
    })
    .onEnd(() => {
      isPinching.value = false;
      blockPanNextFrame.value = true;
    });

  const combinedGesture = Gesture.Simultaneous(canvasPanGesture, canvasPinchGesture);

  const canvasAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: panX.value },
      { translateY: panY.value },
      { scale: scale.value },
    ],
  }));



  const gridAnimatedStyle = useAnimatedStyle(() => {
    const size = 40 * scale.value;
    const tx = (panX.value % size);
    const ty = (panY.value % size);
    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: scale.value },
      ],
    };
  });

  const handleCanvasTap = () => {
    if (selectedNodeId) {
      setSelectedNodeId(null);
    }
  };

  const renderWirePath = (startX: number, startY: number, endX: number, endY: number, key: string) => {
    // Dynamic offset for smooth S-curves
    const distanceX = Math.abs(endX - startX);
    const offset = Math.max(80, distanceX * 0.4); 

    const pathData = `M ${startX} ${startY} C ${startX + offset} ${startY}, ${endX - offset} ${endY}, ${endX} ${endY}`;

    return (
      <Path
        key={key}
        d={pathData}
        stroke="#cb997e"
        strokeWidth={4} // Slightly thicker
        fill="none"
      />
    );
  };

  return (
    <View style={styles.viewport}>
      <View style={styles.gridContainer} pointerEvents="none">
        <Animated.View style={[styles.gridLayer, gridAnimatedStyle]}>
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern
                id="bpGrid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
                x={-(SCREEN_W * 1.5)}
                y={-(SCREEN_H * 1.5)}
              >
                <Circle cx="0" cy="0" r="1.5" fill="rgba(100, 150, 200, 0.4)" />
                <Line x1="0" y1="0" x2="40" y2="0" stroke="rgba(100, 150, 200, 0.05)" strokeWidth="1" />
                <Line x1="0" y1="0" x2="0" y2="40" stroke="rgba(100, 150, 200, 0.05)" strokeWidth="1" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#bpGrid)" />
          </Svg>
        </Animated.View>
      </View>

      <GestureDetector gesture={combinedGesture}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.canvasLayer, canvasAnimatedStyle]}>
            <TouchableWithoutFeedback onPress={handleCanvasTap}>
              <View style={StyleSheet.absoluteFillObject} />
            </TouchableWithoutFeedback>

            <View style={styles.touchArea} pointerEvents="box-none">
              {nodes.map((node) => (
                <LogicNodeUI key={node.id} node={node} />
              ))}
            </View>
          </Animated.View>
        </View>
      </GestureDetector>

      {/* Screen-sized SVG container wrapped in canvasAnimatedStyle to keep performance high and prevent 250MB bitmap crashes */}
      <Animated.View style={[StyleSheet.absoluteFillObject, canvasAnimatedStyle]} pointerEvents="none">
        <Svg width="100%" height="100%">
          {wires.map(wire => {
            const fromNode = nodes.find(n => n.id === wire.fromNodeId);
            const toNode = nodes.find(n => n.id === wire.toNodeId);
            if (!fromNode || !toNode) return null;

            // Offset by SCREEN_W * 2 / SCREEN_H * 2 to translate canvas-space coordinates to viewport-relative screen-space coordinates
            const sx = fromNode.x - SCREEN_W * 2 + 180; 
            const sy = fromNode.y - SCREEN_H * 2 + 55;  
            const ex = toNode.x - SCREEN_W * 2;         
            const ey = toNode.y - SCREEN_H * 2 + 55;    

            if (isNaN(sx) || isNaN(sy) || isNaN(ex) || isNaN(ey)) return null;

            return renderWirePath(sx, sy, ex, ey, wire.id);
          })}
          {draftWire && !isNaN(draftWire.startX) && !isNaN(draftWire.endX) && 
            renderWirePath(
              draftWire.startX - SCREEN_W * 2, 
              draftWire.startY - SCREEN_H * 2, 
              draftWire.endX - SCREEN_W * 2, 
              draftWire.endY - SCREEN_H * 2, 
              'draft'
            )}
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#12141a', // slightly bluish dark for blueprint
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  gridLayer: {
    position: 'absolute',
    width: SCREEN_W * 2,
    height: SCREEN_H * 2,
    top: -SCREEN_H / 2,
    left: -SCREEN_W / 2,
  },
  canvasLayer: {
    width: SCREEN_W * 5,
    height: SCREEN_H * 5,
    position: 'absolute',
    top: -SCREEN_H * 2,
    left: -SCREEN_W * 2,
  },
  touchArea: {
    ...StyleSheet.absoluteFillObject,
  },
});
