import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, TextInput, Dimensions } from 'react-native';
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
  const { mode, setMode, elements, selectedId, deleteElement, loadEngineState, clearEngineState, globalVariables, sceneLoadRequest, setSceneLoadRequest } = useEngine();
  const { nodes, wires, loadBlueprintState, clearBlueprintState } = useBlueprint();
  
  const [scenes, setScenes] = useState<ProjectManager.SceneData[]>([]);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingSceneName, setEditingSceneName] = useState('');
  
  const [showLibrary, setShowLibrary] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);
  const [showSceneManager, setShowSceneManager] = useState(false);
  const [activeTab, setActiveTab] = useState<'scene' | 'blueprint' | 'global_state'>('scene');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const handleImportJSON = () => {
    try {
      const data = JSON.parse(importText);
      const { width, height } = Dimensions.get('window');
      
      const offsetX = (width * 2) + 50;
      const offsetY = (height * 2) + 100;

      const newElements = (data.elements || []).map((el: any) => ({
        ...el,
        x: el.x + offsetX,
        y: el.y + offsetY
      }));

      const newNodes = (data.nodes || []).map((n: any) => ({
        ...n,
        x: n.x + offsetX,
        y: n.y + offsetY
      }));

      loadEngineState(newElements, data.globalVariables || globalVariables);
      loadBlueprintState(newNodes, data.wires || []);

      setShowImport(false);
      setImportText('');
      Alert.alert("Success", "Scene imported and centered!");
    } catch (err) {
      Alert.alert("Error", "Invalid JSON payload. Please check formatting.");
    }
  };

  useEffect(() => {
    if (initialMode) setMode(initialMode);
  }, [initialMode, setMode]);

  useEffect(() => {
    if (projectId) {
      ProjectManager.loadProject(projectId).then((proj) => {
        if (proj && proj.scenes && proj.scenes.length > 0) {
          setScenes(proj.scenes);
          setActiveSceneId(proj.scenes[0].id);
          loadEngineState(proj.scenes[0].elements || [], proj.globalVariables || []);
          loadBlueprintState(proj.scenes[0].nodes || [], proj.scenes[0].wires || []);
        }
      });
    } else {
      clearEngineState();
      clearBlueprintState();
    }
  }, [projectId]);

  const handleSceneSwitch = (newSceneId: string) => {
    const updatedScenes = scenes.map(s => 
      s.id === activeSceneId ? { ...s, elements, nodes, wires } : s
    );
    setScenes(updatedScenes);
    const nextScene = updatedScenes.find(s => s.id === newSceneId);
    if (nextScene) {
      setActiveSceneId(nextScene.id);
      loadEngineState(nextScene.elements || [], globalVariables);
      loadBlueprintState(nextScene.nodes || [], nextScene.wires || []);
    }
    setShowSceneManager(false);
  };

  useEffect(() => {
    if (sceneLoadRequest) {
      const target = scenes.find(s => s.name.toLowerCase() === sceneLoadRequest.toLowerCase());
      if (target && target.id !== activeSceneId) {
        handleSceneSwitch(target.id);
      } else if (!target) {
        console.warn(`[Engine] Scene not found: ${sceneLoadRequest}`);
      }
      setSceneLoadRequest(null);
    }
  }, [sceneLoadRequest, scenes, activeSceneId]);

  const handleCreateScene = () => {
    const newSceneId = 'scene_' + Math.random().toString(36).substring(2, 9);
    const newSceneName = `Scene ${scenes.length + 1}`;
    
    const updatedScenes = scenes.map(s => 
      s.id === activeSceneId ? { ...s, elements, nodes, wires } : s
    );
    
    const newSceneData = { id: newSceneId, name: newSceneName, elements: [], nodes: [], wires: [] };
    const finalScenes = [...updatedScenes, newSceneData];
    
    setScenes(finalScenes);
    setActiveSceneId(newSceneId);
    loadEngineState([], globalVariables);
    loadBlueprintState([], []);
    setShowSceneManager(false);
  };

  const submitSceneRename = () => {
    if (editingSceneId && editingSceneName.trim()) {
      setScenes(scenes.map(s => s.id === editingSceneId ? { ...s, name: editingSceneName.trim() } : s));
    }
    setEditingSceneId(null);
  };

  const handleSave = () => {
    const updatedScenes = scenes.map(s => 
      s.id === activeSceneId ? { ...s, elements, nodes, wires } : s
    );
    setScenes(updatedScenes);

    ProjectManager.saveProject({
      id: projectId,
      name: projectName,
      lastModified: Date.now(),
      globalVariables,
      scenes: updatedScenes
    }).then(() => {
      Alert.alert('Saved', 'Project saved successfully!');
    }).catch((err) => {
      Alert.alert('Error', 'Failed to save project.');
    });
  };

  const activeSceneName = scenes.find(s => s.id === activeSceneId)?.name || 'Unknown Scene';

  if (mode === 'play') {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onExit} style={styles.backBtn}>
              <Feather name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>{projectName} - {activeSceneName} (Play)</Text>
            <TouchableOpacity onPress={() => setMode('edit')} style={styles.modeBtn}>
              <Feather name="square" size={16} color="#cb997e" />
            </TouchableOpacity>
          </View>
          <View style={styles.subHeader} />
        </View>
        <CanvasWorkspace />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onExit} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sceneDropdownBtn} onPress={() => setShowSceneManager(!showSceneManager)}>
            <Text style={styles.title} numberOfLines={1}>{projectName} / {activeSceneName}</Text>
            <Feather name={showSceneManager ? "chevron-up" : "chevron-down"} size={16} color="#ddbea9" />
          </TouchableOpacity>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.headerActionsWrapper} contentContainerStyle={styles.headerActionsScroll}>
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
            {activeTab !== 'global_state' && (
              <TouchableOpacity onPress={() => setShowImport(true)} style={styles.modeBtn}>
                <Feather name="code" size={16} color="#d4a373" />
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

        <View style={styles.subHeader}>
          <View style={styles.tabToggle}>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'scene' && styles.tabBtnActive]} onPress={() => setActiveTab('scene')}>
              <Text style={[styles.tabText, activeTab === 'scene' && styles.tabTextActive]}>Scene</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'blueprint' && styles.tabBtnActive]} onPress={() => setActiveTab('blueprint')}>
              <Text style={[styles.tabText, activeTab === 'blueprint' && styles.tabTextActive]}>Blueprint</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, activeTab === 'global_state' && styles.tabBtnActive]} onPress={() => setActiveTab('global_state')}>
              <Text style={[styles.tabText, activeTab === 'global_state' && styles.tabTextActive]}>State</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showSceneManager && (
        <View style={styles.sceneManagerDropdown}>
          <Text style={styles.sceneManagerTitle}>Scenes in Project</Text>
          <ScrollView style={styles.sceneList}>
            {scenes.map(s => (
              <TouchableOpacity 
                key={s.id} 
                style={[styles.sceneRow, s.id === activeSceneId && styles.sceneRowActive]} 
                onPress={() => {
                  if (editingSceneId === s.id) return;
                  handleSceneSwitch(s.id);
                }}
                onLongPress={() => {
                  setEditingSceneId(s.id);
                  setEditingSceneName(s.name);
                }}
              >
                <Feather name="layout" size={14} color={s.id === activeSceneId ? "#ddbea9" : "rgba(255,255,255,0.5)"} />
                {editingSceneId === s.id ? (
                  <TextInput
                    style={[styles.sceneRowText, styles.sceneRowTextActive, { padding: 0, margin: 0, flex: 1, borderBottomWidth: 1, borderBottomColor: '#ddbea9' }]}
                    value={editingSceneName}
                    onChangeText={setEditingSceneName}
                    autoFocus
                    onBlur={submitSceneRename}
                    onSubmitEditing={submitSceneRename}
                  />
                ) : (
                  <Text style={[styles.sceneRowText, s.id === activeSceneId && styles.sceneRowTextActive]}>{s.name}</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.newSceneBtn} onPress={handleCreateScene}>
            <Feather name="plus" size={14} color="#0F1218" />
            <Text style={styles.newSceneBtnText}>New Scene</Text>
          </TouchableOpacity>
        </View>
      )}

      {showImport && (
        <View style={styles.importOverlay}>
          <View style={styles.importModal}>
            <Text style={styles.importTitle}>Developer Import</Text>
            <TextInput
              style={styles.importInput}
              value={importText}
              onChangeText={setImportText}
              multiline
              placeholder='Paste JSON payload with { "elements": [], "nodes": [], "wires": [], "globalVariables": [] }'
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
            <View style={styles.importActions}>
              <TouchableOpacity style={styles.importCancelBtn} onPress={() => setShowImport(false)}>
                <Text style={styles.importCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.importSubmitBtn} onPress={handleImportJSON}>
                <Text style={styles.importSubmitText}>Import Scene</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={styles.workspace}>
        <View style={[StyleSheet.absoluteFill, { opacity: activeTab === 'scene' ? 1 : 0, zIndex: activeTab === 'scene' ? 1 : 0 }]} pointerEvents={activeTab === 'scene' ? 'auto' : 'none'}>
          <HierarchyPanel isVisible={showHierarchy} />
          <CanvasWorkspace />
        </View>
        <View style={[StyleSheet.absoluteFill, { opacity: activeTab === 'blueprint' ? 1 : 0, zIndex: activeTab === 'blueprint' ? 1 : 0 }]} pointerEvents={activeTab === 'blueprint' ? 'auto' : 'none'}>
          <BlueprintWorkspace />
        </View>
        <View style={[StyleSheet.absoluteFill, { opacity: activeTab === 'global_state' ? 1 : 0, zIndex: activeTab === 'global_state' ? 1 : 0 }]} pointerEvents={activeTab === 'global_state' ? 'auto' : 'none'}>
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
  headerContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  subHeader: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
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
    fontSize: 13,
    letterSpacing: 1.0,
    flex: 1,
    marginLeft: 0,
  },
  headerActionsWrapper: {
    marginLeft: 6,
    maxWidth: 130,
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
  sceneDropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    marginRight: 12,
    gap: 6,
    minWidth: 120,
  },
  sceneManagerDropdown: {
    position: 'absolute',
    top: 95,
    left: 48,
    width: 200,
    backgroundColor: '#1B2130',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    zIndex: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  sceneManagerTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  sceneList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  sceneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
    borderRadius: 6,
  },
  sceneRowActive: {
    backgroundColor: 'rgba(221, 190, 169, 0.1)',
  },
  sceneRowText: {
    color: '#fff',
    fontSize: 13,
  },
  sceneRowTextActive: {
    color: '#ddbea9',
    fontWeight: 'bold',
  },
  newSceneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ddbea9',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  newSceneBtnText: {
    color: '#0F1218',
    fontSize: 12,
    fontWeight: 'bold',
  },
  importOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  importModal: {
    width: '85%',
    backgroundColor: '#1B2130',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.4)',
  },
  importTitle: {
    color: '#d4a373',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  importInput: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    height: 250,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontFamily: 'monospace',
    fontSize: 11,
    marginBottom: 16,
  },
  importActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  importCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  importCancelText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 'bold',
  },
  importSubmitBtn: {
    backgroundColor: '#d4a373',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  importSubmitText: {
    color: '#0F1218',
    fontWeight: 'bold',
  },
});
