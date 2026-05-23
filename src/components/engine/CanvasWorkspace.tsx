import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useEngine } from '../../context/EngineContext';
import { TransformableNode } from './TransformableNode';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export const CanvasWorkspace: React.FC = () => {
  const { elements, selectedId, setSelectedId } = useEngine();
  
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const lastPanX = useSharedValue(0);
  const lastPanY = useSharedValue(0);

  const canvasPanGesture = Gesture.Pan()
    .onUpdate((e) => {
      panX.value = lastPanX.value + e.translationX;
      panY.value = lastPanY.value + e.translationY;
    })
    .onEnd(() => {
      lastPanX.value = panX.value;
      lastPanY.value = panY.value;
    });

  const canvasAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: panX.value },
      { translateY: panY.value },
    ],
  }));

  const handleCanvasTap = () => {
    if (selectedId) {
      setSelectedId(null);
    }
  };

  return (
    <View style={styles.viewport}>
      <GestureDetector gesture={canvasPanGesture}>
        <Animated.View style={[styles.canvasLayer, canvasAnimatedStyle]}>
          <TouchableWithoutFeedback onPress={handleCanvasTap}>
            <View style={styles.touchArea}>
              {elements.map((el) => (
                <TransformableNode key={el.id} element={el} />
              ))}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
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
