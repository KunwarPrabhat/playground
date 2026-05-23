import React from 'react';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useGame } from '../context/GameContext';
import { COLORS } from '../constants/theme';

export const TabBar = () => {
  const { activeTab, setActiveTab, tabBarVisible } = useGame();
  
  const tabAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: tabBarVisible ? 0 : 150, // slide below screen
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [tabBarVisible]);

  const tabs = [
    { icon: 'edit-3' as const, name: 'Component' },
    { icon: 'play' as const, name: 'Test' },
    { icon: 'globe' as const, name: 'Playground' },
    { icon: 'settings' as const, name: 'Settings' },
  ];

  return (
    <Animated.View style={[styles.tabBarContainer, { transform: [{ translateY: tabAnim }] }]}>
      <View style={styles.tray}>
        {tabs.map((tab, index) => {
          const isActive = activeTab === index;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.circleButton,
                isActive ? styles.activeCircleButton : styles.inactiveCircleButton,
              ]}
              onPress={() => setActiveTab(index)}
              activeOpacity={0.8}
            >
              <Feather
                name={tab.icon}
                size={22}
                color={isActive ? COLORS.white : COLORS.active}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tray: {
    flexDirection: 'row',
    backgroundColor: COLORS.tray,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 35,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  circleButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  activeCircleButton: {
    backgroundColor: COLORS.active,
  },
  inactiveCircleButton: {
    backgroundColor: COLORS.inactive,
  },
});
