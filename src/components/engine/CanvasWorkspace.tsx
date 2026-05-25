import React from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useEngine } from '../../context/EngineContext';
import { TransformableNode } from './TransformableNode';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

import Svg, { Defs, Pattern, Circle, Line, Rect } from 'react-native-svg';

export const CanvasWorkspace: React.FC = () => {
  const { elements, selectedId, setSelectedId, panX, panY, scale } = useEngine();

  console.log("[Make2D Engine] CANVAS ELEMENTS COUNT:", elements.length, elements);



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

      const newScale = Math.max(0.5, Math.min(3, pinchStartScale.value * e.scale));
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

  const [coords, setCoords] = React.useState({ x: 0, y: 0, s: 100 });



  useAnimatedReaction(
    () => ({
      x: Math.round(-panX.value / scale.value),
      y: Math.round(-panY.value / scale.value),
      s: Math.round(scale.value * 100),
    }),
    (next, prev) => {
      if (!prev || next.x !== prev.x || next.y !== prev.y || next.s !== prev.s) {
        runOnJS(setCoords)(next);
      }
    }
  );

  const handleCanvasTap = () => {
    if (selectedId) {
      setSelectedId(null);
    }
  };

  return (
    <View style={styles.viewport}>
      {/* Dynamic 2D Vector Axis Gizmo HUD */}
      <View style={styles.hudContainer} pointerEvents="none">
        <View style={styles.gizmoBox}>
          {/* Green Y Arrow */}
          <View style={styles.axisYLine} />
          <View style={styles.axisYArrow} />
          <Text style={[styles.axisText, { color: '#84a59d', top: 2, left: 14 }]}>Y</Text>

          {/* Red X Arrow */}
          <View style={styles.axisXLine} />
          <View style={styles.axisXArrow} />
          <Text style={[styles.axisText, { color: '#f28482', top: 22, left: 34 }]}>X</Text>

          {/* Origin Point */}
          <View style={styles.axisOrigin} />
        </View>
        <View style={styles.readoutBox}>
          <Text style={styles.readoutText}>
            X: <Text style={{ color: '#f28482' }}>{coords.x}</Text>   Y: <Text style={{ color: '#84a59d' }}>{coords.y}</Text>
          </Text>
          <Text style={styles.scaleText}>Zoom: {coords.s}%</Text>
        </View>
      </View>

      {/* Hardware-safe Viewport-bounded Infinite Background Grid */}
      <View style={styles.gridContainer} pointerEvents="none">
        <Animated.View style={[styles.gridLayer, gridAnimatedStyle]}>
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern 
                id="bgGrid" 
                width="40" 
                height="40" 
                patternUnits="userSpaceOnUse"
                x={-(SCREEN_W * 1.5)}
                y={-(SCREEN_H * 1.5)}
              >
                <Circle cx="0" cy="0" r="1.5" fill="rgba(113, 160, 113, 0.4)" />
                <Line x1="0" y1="0" x2="40" y2="0" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
                <Line x1="0" y1="0" x2="0" y2="40" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#bgGrid)" />
          </Svg>
        </Animated.View>
      </View>

      <GestureDetector gesture={combinedGesture}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.canvasLayer, canvasAnimatedStyle]}>
            {/* Background Tap Receiver (behind elements) */}
            <TouchableWithoutFeedback onPress={handleCanvasTap}>
              <View style={StyleSheet.absoluteFillObject} />
            </TouchableWithoutFeedback>

            {/* Interactive Elements Layer */}
            <View style={styles.touchArea} pointerEvents="box-none">
              {elements.map((el) => (
                <TransformableNode key={el.id} element={el} />
              ))}
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#1d201e',
  },
  hudContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 32, 30, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
    gap: 10,
  },
  gizmoBox: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  axisOrigin: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
    position: 'absolute',
    zIndex: 3,
  },
  axisXLine: {
    width: 18,
    height: 2,
    backgroundColor: '#f28482',
    position: 'absolute',
    left: 20,
    zIndex: 1,
  },
  axisXArrow: {
    width: 0,
    height: 0,
    borderTopWidth: 3,
    borderBottomWidth: 3,
    borderLeftWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#f28482',
    position: 'absolute',
    left: 36,
    zIndex: 2,
  },
  axisYLine: {
    width: 2,
    height: 18,
    backgroundColor: '#84a59d',
    position: 'absolute',
    bottom: 20,
    zIndex: 1,
  },
  axisYArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#84a59d',
    position: 'absolute',
    bottom: 36,
    zIndex: 2,
  },
  axisText: {
    fontSize: 8,
    fontWeight: 'bold',
    position: 'absolute',
  },
  readoutBox: {
    justifyContent: 'center',
  },
  readoutText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  scaleText: {
    color: '#aaa',
    fontSize: 8,
    marginTop: 1,
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
