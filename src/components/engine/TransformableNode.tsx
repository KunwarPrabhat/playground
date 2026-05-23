import React from 'react';
import { View, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ElementNode } from '../../types/engineTypes';
import { PrimitiveRenderer } from './primitives/PrimitiveRenderer';
import { useEngine } from '../../context/EngineContext';

interface Props {
  element: ElementNode;
}

const HANDLE_SIZE = 20;

export const TransformableNode: React.FC<Props> = ({ element }) => {
  const { snapSize, updateElement, selectedId, setSelectedId } = useEngine();

  const isSelected = selectedId === element.id;

  const translateX = useSharedValue(element.x);
  const translateY = useSharedValue(element.y);
  const width = useSharedValue(element.w);
  const height = useSharedValue(element.h);

  // Sync state if element updates externally
  React.useEffect(() => {
    translateX.value = element.x;
    translateY.value = element.y;
    width.value = element.w;
    height.value = element.h;
  }, [element, translateX, translateY, width, height]);

  const commitChanges = (x: number, y: number, w: number, h: number) => {
    updateElement(element.id, { x, y, w, h });
  };

  const getSnapped = (val: number) => {
    'worklet';
    if (snapSize === 'off') return val;
    return Math.round(val / snapSize) * snapSize;
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = element.x + e.translationX;
      translateY.value = element.y + e.translationY;
    })
    .onEnd(() => {
      const snappedX = getSnapped(translateX.value);
      const snappedY = getSnapped(translateY.value);
      translateX.value = withSpring(snappedX, { damping: 15, stiffness: 120 });
      translateY.value = withSpring(snappedY, { damping: 15, stiffness: 120 });
      runOnJS(commitChanges)(snappedX, snappedY, width.value, height.value);
    });

  const resizeGesture = Gesture.Pan()
    .onUpdate((e) => {
      width.value = Math.max(32, element.w + e.translationX);
      height.value = Math.max(32, element.h + e.translationY);
    })
    .onEnd(() => {
      const snappedW = Math.max(32, getSnapped(width.value));
      const snappedH = Math.max(32, getSnapped(height.value));
      width.value = withSpring(snappedW, { damping: 15, stiffness: 120 });
      height.value = withSpring(snappedH, { damping: 15, stiffness: 120 });
      runOnJS(commitChanges)(translateX.value, translateY.value, snappedW, snappedH);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    width: width.value,
    height: height.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFill}>
          <TouchableWithoutFeedback onPress={() => setSelectedId(element.id)}>
            <View style={StyleSheet.absoluteFill}>
              <PrimitiveRenderer type={element.type} width={element.w} height={element.h} />
              {isSelected && (
                <View style={styles.selectionBorder} pointerEvents="none" />
              )}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </GestureDetector>

      {isSelected && (
        <GestureDetector gesture={resizeGesture}>
          <Animated.View style={styles.resizeHandle} />
        </GestureDetector>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  selectionBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: '#cb997e', // Highlight color
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  resizeHandle: {
    position: 'absolute',
    right: -HANDLE_SIZE / 2,
    bottom: -HANDLE_SIZE / 2,
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    backgroundColor: '#cb997e',
    borderRadius: HANDLE_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});
