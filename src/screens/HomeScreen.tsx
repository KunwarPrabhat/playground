import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ProjectManager from '../utils/ProjectManager';

interface HomeScreenProps {
  onOpenProject: (id: string, name: string) => void;
}

const { width: SCREEN_W } = Dimensions.get('window');

export const HomeScreen: React.FC<HomeScreenProps> = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<{ id: string; name: string; lastModified: number }[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const fetchProjects = async () => {
    try {
      const list = await ProjectManager.getProjectList();
      setProjects(list);
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
      onOpenProject(newId, newProj.name);
    } catch (err) {
      Alert.alert('Error', 'Failed to create new project.');
      console.error(err);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Feather name="layers" size={48} color="#00f0ff" style={styles.heroIcon} />
        <Text style={styles.title}>Make2D Engine</Text>
        <Text style={styles.subtitle}>Visual Logic & Game Sandbox</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Your Projects</Text>
        
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No projects yet. Build something amazing!</Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.projectRow}
                onPress={() => onOpenProject(item.id, item.name)}
                activeOpacity={0.7}
              >
                <View style={styles.rowLeft}>
                  <Feather name="file-text" size={20} color="#ddbea9" />
                  <View style={styles.rowDetails}>
                    <Text style={styles.projectName}>{item.name}</Text>
                    <Text style={styles.projectDate}>Modified: {formatDate(item.lastModified)}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.3)" />
              </TouchableOpacity>
            )}
          />
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1218',
    paddingTop: 60,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 30,
  },
  heroIcon: {
    marginBottom: 12,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 4,
  },
  content: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: '#141822',
    padding: 24,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 16,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1B2130',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowDetails: {
    justifyContent: 'center',
  },
  projectName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  projectDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 3,
  },
  newProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00f0ff',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#00f0ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  newProjectText: {
    color: '#0F1218',
    fontWeight: '700',
    fontSize: 15,
  },
  createForm: {
    backgroundColor: '#1B2130',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 12,
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  createSubmitBtn: {
    backgroundColor: '#00f0ff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createSubmitText: {
    color: '#0F1218',
    fontWeight: '700',
  },
});
