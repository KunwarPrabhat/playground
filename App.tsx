import React from 'react';
import { StyleSheet, SafeAreaView, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GameProvider, useGame } from './src/context/GameContext';
import { TabBar } from './src/components/TabBar';
import { MakerScreen } from './src/screens/MakerScreen';
import { TestScreen } from './src/screens/TestScreen';
import { PlaygroundScreen } from './src/screens/PlaygroundScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { COLORS } from './src/constants/theme';

function MainAppContent() {
  const { activeTab } = useGame();

  const renderScreen = () => {
    switch (activeTab) {
      case 0:
        return <MakerScreen />;
      case 1:
        return <TestScreen />;
      case 2:
        return <PlaygroundScreen />;
      case 3:
        return <SettingsScreen />;
      default:
        return <MakerScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        {renderScreen()}
      </View>
      <TabBar />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <GameProvider>
        <MainAppContent />
      </GameProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});