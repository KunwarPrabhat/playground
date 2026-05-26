import React, { useState } from 'react';
import { StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MakerScreen } from './src/screens/MakerScreen';
import { HomeScreen } from './src/screens/HomeScreen';

export default function App() {
  const [currentProject, setCurrentProject] = useState<{ id: string; name: string } | null>(null);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        {currentProject ? (
          <MakerScreen
            projectId={currentProject.id}
            projectName={currentProject.name}
            onExit={() => setCurrentProject(null)}
          />
        ) : (
          <HomeScreen
            onOpenProject={(id, name) => setCurrentProject({ id, name })}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1218',
  },
  safeArea: {
    flex: 1,
  },
});