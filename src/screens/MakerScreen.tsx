import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { EngineProvider, useEngine } from '../context/EngineContext';
import { SidebarLibrary } from '../components/engine/SidebarLibrary';
import { CanvasWorkspace } from '../components/engine/CanvasWorkspace';
import { Feather } from '@expo/vector-icons';

const EngineInterface: React.FC = () => {
  const { mode, setMode, elements, selectedId, deleteElement } = useEngine();
  const [showLibrary, setShowLibrary] = useState(false);

  if (mode === 'play') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Make2D: Sim <Text style={{ fontSize: 12, color: '#aaa' }}>({elements.length} nodes)</Text></Text>
          <TouchableOpacity onPress={() => setMode('edit')} style={styles.modeBtn}>
            <Text style={styles.modeText}>Stop Simulation</Text>
            <Feather name="square" size={16} color="#cb997e" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
        <CanvasWorkspace />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Make2D <Text style={{ fontSize: 12, color: '#aaa' }}>({elements.length} nodes)</Text></Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowLibrary(!showLibrary)} style={styles.modeBtn}>
            <Feather name="box" size={16} color="#fff" />
            <Text style={[styles.modeText, { marginLeft: 6 }]}>Library</Text>
          </TouchableOpacity>
          {selectedId && (
            <TouchableOpacity onPress={() => deleteElement(selectedId)} style={styles.deleteBtn}>
              <Feather name="trash-2" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setMode('play')} style={styles.modeBtn}>
            <Text style={styles.modeText}>Test Simulation</Text>
            <Feather name="play" size={16} color="#71a071" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.workspace}>
        <CanvasWorkspace />
        {showLibrary && (
          <View style={styles.floatingSidebar}>
            <SidebarLibrary />
          </View>
        )}
      </View>
    </View>
  );
};

export const MakerScreen = () => {
  return (
    <EngineProvider>
      <EngineInterface />
    </EngineProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1d201e',
    paddingTop: 45,
  },
  header: {
    height: 60,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  title: {
    color: '#ddbea9',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: '#cb4f4f',
    padding: 8,
    borderRadius: 8,
  },
  workspace: {
    flex: 1,
    position: 'relative',
  },
  floatingSidebar: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(30,30,30,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    zIndex: 100,
  },
});
