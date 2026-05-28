import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ProjectManager from '../utils/ProjectManager';

interface HomeScreenProps {
  onOpenProject: (id: string, name: string, mode?: 'edit' | 'play') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<{ id: string; name: string; lastModified: number }[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [demoIds, setDemoIds] = useState<Set<string>>(new Set());

  const fetchProjects = async () => {
    try {
      const list = await ProjectManager.getProjectList();
      setProjects(list);
      const dIds = await ProjectManager.getDemoIds();
      setDemoIds(new Set(dIds));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async () => {
    if (!newProjectName.trim()) {
      Alert.alert('Error', 'Please enter a valid project name.');
      return;
    }
    try {
      const newId = 'proj_' + Math.random().toString(36).substring(2, 11);
      const newProj: ProjectManager.Project = {
        id: newId,
        name: newProjectName.trim(),
        lastModified: Date.now(),
        engineData: { elements: [], globalVariables: [] },
        blueprintData: { nodes: [], wires: [] },
      };
      await ProjectManager.saveProject(newProj);
      setIsCreating(false);
      setNewProjectName('');
      onOpenProject(newId, newProj.name, 'edit');
    } catch (err) {
      Alert.alert('Error', 'Failed to create new project.');
      console.error(err);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLongPressProject = (item: { id: string; name: string }) => {
    if (isSelectionMode) {
      toggleSelection(item.id);
      return;
    }

    const isDemo = demoIds.has(item.id);
    Alert.alert(
      'Project Options',
      `Choose action for "${item.name}":`,
      [
        {
          text: isDemo ? 'Remove from Demo Projects' : 'Add to Demo Projects',
          onPress: async () => {
            if (isDemo) {
              await ProjectManager.removeDemoId(item.id);
            } else {
              await ProjectManager.addDemoId(item.id);
            }
            fetchProjects();
          }
        },
        {
          text: 'Select Projects',
          onPress: () => toggleSelection(item.id)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleDeleteSelected = () => {
    Alert.alert('Delete Projects', `Are you sure you want to delete ${selectedIds.size} project(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await ProjectManager.deleteProjects(Array.from(selectedIds));
          setSelectedIds(new Set());
          fetchProjects();
        }
      }
    ]);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const isSelectionMode = selectedIds.size > 0;
  const demoProjects = projects.filter(p => demoIds.has(p.id));

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Feather name="layers" size={48} color="#00f0ff" style={styles.heroIcon} />
        <Text style={styles.title}>Make2D Engine</Text>
        <Text style={styles.subtitle}>Visual Logic & Game Sandbox</Text>
      </View>

      <View style={styles.content}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Projects</Text>
            {isSelectionMode && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteSelected}>
                <Feather name="trash-2" size={14} color="#fff" />
                <Text style={styles.deleteBtnText}>Delete ({selectedIds.size})</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {projects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No projects yet. Build something amazing!</Text>
            </View>
          ) : (
            projects.map((item) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.projectRow, isSelected && styles.projectRowSelected]}
                  onLongPress={() => handleLongPressProject(item)}
                  onPress={() => {
                    if (isSelectionMode) toggleSelection(item.id);
                    else onOpenProject(item.id, item.name, 'edit');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    {isSelectionMode ? (
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Feather name="check" size={14} color="#0F1218" />}
                      </View>
                    ) : (
                      <Feather name="file-text" size={20} color={isSelected ? "#00f0ff" : "#ddbea9"} />
                    )}
                    <View style={styles.rowDetails}>
                      <Text style={[styles.projectName, isSelected && { color: '#00f0ff' }]}>{item.name}</Text>
                      <Text style={styles.projectDate}>Modified: {formatDate(item.lastModified)}</Text>
                    </View>
                  </View>
                  {!isSelectionMode && (
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        style={styles.playIconBtn}
                        onPress={() => onOpenProject(item.id, item.name, 'play')}
                      >
                        <Feather name="play" size={16} color="#50c878" />
                      </TouchableOpacity>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}

          {isCreating ? (
            <View style={styles.createForm}>
              <TextInput
                style={styles.input}
                placeholder="Enter Project Name..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={newProjectName}
                onChangeText={setNewProjectName}
                autoFocus
              />
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreating(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createSubmitBtn} onPress={handleCreate}>
                  <Text style={styles.createSubmitText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.newProjectBtn} onPress={() => setIsCreating(true)} activeOpacity={0.8}>
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.newProjectText}>New Project</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', marginTop: 32, marginBottom: 24 }} />
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Demo Projects</Text>
            </View>
            {demoProjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No demo projects. Long press a project to add one!</Text>
              </View>
            ) : (
              demoProjects.map((demo) => (
                <TouchableOpacity
                  key={demo.id}
                  style={styles.projectRow}
                  onPress={() => onOpenProject(demo.id, demo.name, 'edit')}
                  activeOpacity={0.7}
                >
                  <View style={styles.rowLeft}>
                    <Feather name="box" size={20} color="#cb997e" />
                    <View style={styles.rowDetails}>
                      <Text style={styles.projectName}>{demo.name}</Text>
                      <Text style={styles.projectDate}>Demo Sandbox</Text>
                    </View>
                  </View>
                  <View style={styles.rowActions}>
                    <TouchableOpacity 
                      style={styles.playIconBtn} 
                      onPress={() => onOpenProject(demo.id, demo.name, 'play')}
                    >
                      <Feather name="play" size={16} color="#50c878" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1218', paddingTop: 60 },
  hero: { alignItems: 'center', marginBottom: 30 },
  heroIcon: { marginBottom: 12, shadowColor: '#00f0ff', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 8 },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 1.5 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 },
  content: { flex: 1, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#141822', padding: 24 },
  scrollContent: { paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#cb4f4f', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 6 },
  deleteBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyState: { paddingVertical: 20, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: 14 },
  projectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1B2130', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  projectRowSelected: { borderColor: '#00f0ff', backgroundColor: 'rgba(0, 240, 255, 0.05)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  checkboxSelected: { backgroundColor: '#00f0ff', borderColor: '#00f0ff' },
  rowDetails: { justifyContent: 'center' },
  projectName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  projectDate: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 3 },
  rowActions: { flexDirection: 'row', gap: 8 },
  playIconBtn: { padding: 8, backgroundColor: 'rgba(80, 200, 120, 0.1)', borderRadius: 8 },
  newProjectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00f0ff', paddingVertical: 14, borderRadius: 12, gap: 8, marginTop: 8 },
  newProjectText: { color: '#0F1218', fontWeight: '700', fontSize: 15 },
  createForm: { backgroundColor: '#1B2130', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 8 },
  input: { backgroundColor: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 12 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  cancelText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  createSubmitBtn: { backgroundColor: '#00f0ff', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  createSubmitText: { color: '#0F1218', fontWeight: '700' },
});
