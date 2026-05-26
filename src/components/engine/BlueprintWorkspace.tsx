import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Defs, Pattern, Circle, Line, Rect, Path } from 'react-native-svg';
import { useBlueprint } from '../../context/BlueprintContext';
import { LogicNodeUI } from './LogicNodeUI';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const WireConnection = ({ fromId, toId, baseSx, baseSy, baseEx, baseEy, panX, panY, scale, activeDragId, activeDragDeltaX, activeDragDeltaY }: any) => {
  const animatedProps = useAnimatedProps(() => {
    const currentSx = baseSx + (activeDragId.value === fromId ? activeDragDeltaX.value : 0);
    const currentSy = baseSy + (activeDragId.value === fromId ? activeDragDeltaY.value : 0);
    const currentEx = baseEx + (activeDragId.value === toId ? activeDragDeltaX.value : 0);
    const currentEy = baseEy + (activeDragId.value === toId ? activeDragDeltaY.value : 0);

    const w25 = SCREEN_W * 2.5;
    const w05 = SCREEN_W * 0.5;
    const h25 = SCREEN_H * 2.5;
    const h05 = SCREEN_H * 0.5;

    const screenSx = (currentSx - w25) * scale.value + w05 + panX.value;
    const screenSy = (currentSy - h25) * scale.value + h05 + panY.value;
    const screenEx = (currentEx - w25) * scale.value + w05 + panX.value;
    const screenEy = (currentEy - h25) * scale.value + h05 + panY.value;

    const distanceX = Math.abs(screenEx - screenSx);
    const offset = Math.max(80 * scale.value, distanceX * 0.4);

    return {
      d: `M ${screenSx} ${screenSy} C ${screenSx + offset} ${screenSy}, ${screenEx - offset} ${screenEy}, ${screenEx} ${screenEy}`
    };
  });

  return <AnimatedPath animatedProps={animatedProps} stroke="#cb997e" strokeWidth={4} fill="none" />;
};

export const BlueprintWorkspace: React.FC = () => {
  const { nodes, wires, draftWire, selectedNodeId, setSelectedNodeId, panX, panY, scale, activeDragId, activeDragDeltaX, activeDragDeltaY } = useBlueprint();

  const isPinching = useSharedValue(false);
  const blockPanNextFrame = useSharedValue(false);
  const pinchStartScale = useSharedValue(1);
  const pinchStartPanX = useSharedValue(0);
  const pinchStartPanY = useSharedValue(0);
  const pinchStartFocalX = useSharedValue(0);
  const pinchStartFocalY = useSharedValue(0);
  const lastSafeFocalX = useSharedValue(0);
  const lastSafeFocalY = useSharedValue(0);

  const canvasPanGesture = Gesture.Pan()
    .maxPointers(1)
    .onChange((e) => {
      if (isPinching.value) return;
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

      lastSafeFocalX.value = e.focalX;
      lastSafeFocalY.value = e.focalY;
    })
    .onUpdate((e) => {
      const jumpDist = Math.hypot(e.focalX - lastSafeFocalX.value, e.focalY - lastSafeFocalY.value);

      if (jumpDist > 50) return;

      lastSafeFocalX.value = e.focalX;
      lastSafeFocalY.value = e.focalY;

      const newScale = Math.max(0.2, Math.min(3, pinchStartScale.value * e.scale));
      scale.value = newScale;
      const k = newScale / pinchStartScale.value;

      panX.value = lastSafeFocalX.value - SCREEN_W / 2 - (pinchStartFocalX.value - SCREEN_W / 2 - pinchStartPanX.value) * k;
      panY.value = lastSafeFocalY.value - SCREEN_H / 2 - (pinchStartFocalY.value - SCREEN_H / 2 - pinchStartPanY.value) * k;
    })
    .onEnd(() => {
      isPinching.value = false;
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

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg width="100%" height="100%">
          {wires.map(wire => {
            const fromNode = nodes.find(n => n.id === wire.fromNodeId);
            const toNode = nodes.find(n => n.id === wire.toNodeId);
            if (!fromNode || !toNode) return null;

            const sx = fromNode.x + 180;
            const sy = fromNode.y + (fromNode.height ? fromNode.height / 2 : 55);
            const ex = toNode.x;
            const ey = toNode.y + (toNode.height ? toNode.height / 2 : 55);

            return (
              <WireConnection
                key={wire.id}
                fromId={fromNode.id}
                toId={toNode.id}
                baseSx={sx}
                baseSy={sy}
                baseEx={ex}
                baseEy={ey}
                panX={panX}
                panY={panY}
                scale={scale}
                activeDragId={activeDragId}
                activeDragDeltaX={activeDragDeltaX}
                activeDragDeltaY={activeDragDeltaY}
              />
            );
          })}
          {draftWire && !isNaN(draftWire.startX) && !isNaN(draftWire.endX) && (
            <WireConnection
              key="draft"
              fromId="draft_start"
              toId="draft_end"
              baseSx={draftWire.startX}
              baseSy={draftWire.startY}
              baseEx={draftWire.endX}
              baseEy={draftWire.endY}
              panX={panX}
              panY={panY}
              scale={scale}
              activeDragId={activeDragId}
              activeDragDeltaX={activeDragDeltaX}
              activeDragDeltaY={activeDragDeltaY}
            />
          )}
        </Svg>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#12141a',
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