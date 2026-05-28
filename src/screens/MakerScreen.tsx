import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { EngineProvider, useEngine } from '../context/EngineContext';
import { SidebarLibrary } from '../components/engine/SidebarLibrary';
import { CanvasWorkspace } from '../components/engine/CanvasWorkspace';
import { HierarchyPanel } from '../components/engine/HierarchyPanel';
import { BlueprintWorkspace } from '../components/engine/BlueprintWorkspace';
import { GlobalStatePanel } from '../components/engine/GlobalStatePanel';
import { BlueprintProvider, useBlueprint } from '../context/BlueprintContext';
import { Feather } from '@expo/vector-icons';
import * as ProjectManager from '../utils/ProjectManager';

interface EngineInterfaceProps {
  projectId: string;
  projectName: string;
  initialMode?: 'edit' | 'play';
  onExit: () => void;
}

const EngineInterface: React.FC<EngineInterfaceProps> = ({ projectId, projectName, initialMode, onExit }) => {
  const { mode, setMode, elements, selectedId, deleteElement, loadEngineState, clearEngineState, globalVariables } = useEngine();
  const { nodes, wires, loadBlueprintState, clearBlueprintState } = useBlueprint();
  const [showLibrary, setShowLibrary] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [activeTab, setActiveTab] = useState<'scene' | 'blueprint' | 'global_state'>('scene');

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode, setMode]);

  useEffect(() => {
    if (projectId) {
      ProjectManager.loadProject(projectId).then((proj) => {
        if (proj) {
          loadEngineState(proj.engineData?.elements || [], proj.engineData?.globalVariables || []);
          loadBlueprintState(proj.blueprintData?.nodes || [], proj.blueprintData?.wires || []);
        }
      });
    } else {
      clearEngineState();
      clearBlueprintState();
    }
  }, [projectId]);

  const handleSave = () => {
    ProjectManager.saveProject({
      id: projectId,
      name: projectName,
      lastModified: Date.now(),
      engineData: { elements, globalVariables },
      blueprintData: { nodes, wires }
    }).then(() => {
      Alert.alert('Saved', 'Project saved successfully!');
    }).catch((err) => {
      Alert.alert('Error', 'Failed to save project.');
      console.error(err);
    });
  };

  if (mode === 'play') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onExit} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{projectName} (Play)</Text>
          <TouchableOpacity onPress={() => setMode('edit')} style={styles.modeBtn}>
            <Feather name="square" size={16} color="#cb997e" />
          </TouchableOpacity>
        </View>
        <CanvasWorkspace />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onExit} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'scene' && styles.tabBtnActive]}
            onPress={() => setActiveTab('scene')}
          >
            <Text style={[styles.tabText, activeTab === 'scene' && styles.tabTextActive]}>Scene</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'blueprint' && styles.tabBtnActive]}
            onPress={() => setActiveTab('blueprint')}
          >
            <Text style={[styles.tabText, activeTab === 'blueprint' && styles.tabTextActive]}>Blueprint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'global_state' && styles.tabBtnActive]}
            onPress={() => setActiveTab('global_state')}
          >
            <Text style={[styles.tabText, activeTab === 'global_state' && styles.tabTextActive]}>State</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.headerActionsWrapper}
          contentContainerStyle={styles.headerActionsScroll}
        >
          {selectedId && (
            <TouchableOpacity onPress={() => deleteElement(selectedId)} style={styles.deleteBtn}>
              <Feather name="trash-2" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          {activeTab === 'scene' && (
            <TouchableOpacity onPress={() => setShowHierarchy(!showHierarchy)} style={styles.modeBtn}>
              <Feather name="list" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          {activeTab !== 'global_state' && (
            <TouchableOpacity onPress={() => setShowLibrary(!showLibrary)} style={styles.modeBtn}>
              <Feather name="box" size={16} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSave} style={styles.modeBtn}>
            <Feather name="save" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('play')} style={styles.modeBtn}>
            <Feather name="play" size={16} color="#71a071" />
          </TouchableOpacity>
        </ScrollView>
      </View>
      <View style={styles.workspace}>
        <View 
          style={[StyleSheet.absoluteFill, { opacity: activeTab === 'scene' ? 1 : 0, zIndex: activeTab === 'scene' ? 1 : 0 }]} 
          pointerEvents={activeTab === 'scene' ? 'auto' : 'none'}
        >
          <HierarchyPanel isVisible={showHierarchy} />
          <CanvasWorkspace />
        </View>
        <View 
          style={[StyleSheet.absoluteFill, { opacity: activeTab === 'blueprint' ? 1 : 0, zIndex: activeTab === 'blueprint' ? 1 : 0 }]} 
          pointerEvents={activeTab === 'blueprint' ? 'auto' : 'none'}
        >
          <BlueprintWorkspace />
        </View>
        <View 
          style={[StyleSheet.absoluteFill, { opacity: activeTab === 'global_state' ? 1 : 0, zIndex: activeTab === 'global_state' ? 1 : 0 }]} 
          pointerEvents={activeTab === 'global_state' ? 'auto' : 'none'}
        >
          <GlobalStatePanel />
        </View>
        {showLibrary && activeTab !== 'global_state' && (
          <View style={styles.floatingSidebar}>
            <SidebarLibrary mode={activeTab as 'scene' | 'blueprint'} />
          </View>
        )}
      </View>
    </View>
  );
};

interface MakerScreenProps {
  projectId: string;
  projectName: string;
  initialMode?: 'edit' | 'play';
  onExit: () => void;
}

export const MakerScreen: React.FC<MakerScreenProps> = ({ projectId, projectName, initialMode, onExit }) => {
  return (
    <EngineProvider>
      <BlueprintProvider>
        <EngineInterface projectId={projectId} projectName={projectName} initialMode={initialMode} onExit={onExit} />
      </BlueprintProvider>
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
  backBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    padding: 4,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tabBtnActive: {
    backgroundColor: '#cb997e',
  },
  tabText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 'bold',
    fontSize: 12,
  },
  tabTextActive: {
    color: '#fff',
  },
  title: {
    color: '#ddbea9',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.2,
    flex: 1,
    marginLeft: 12,
  },
  headerActionsWrapper: {
    marginLeft: 6,
  },
  headerActionsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 1,
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
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
