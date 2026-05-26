import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  engineData: {
    elements: any[];
    globalVariables: any[];
  };
  blueprintData: {
    nodes: any[];
    wires: any[];
  };
}

const LIST_KEY = 'make2d_project_list';
const PROJECT_PREFIX = 'make2d_project_';

export async function saveProject(project: Project): Promise<void> {
  const updatedProject = {
    ...project,
    lastModified: Date.now(),
  };

  await AsyncStorage.setItem(PROJECT_PREFIX + project.id, JSON.stringify(updatedProject));

  const listRaw = await AsyncStorage.getItem(LIST_KEY);
  let list: { id: string; name: string; lastModified: number }[] = [];
  if (listRaw) {
    list = JSON.parse(listRaw);
  }

  list = list.filter((p) => p.id !== project.id);
  list.unshift({
    id: project.id,
    name: project.name,
    lastModified: updatedProject.lastModified,
  });

  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(list));
}

export async function loadProject(id: string): Promise<Project | null> {
  const raw = await AsyncStorage.getItem(PROJECT_PREFIX + id);
  if (!raw) return null;
  return JSON.parse(raw) as Project;
}

export async function getProjectList(): Promise<{ id: string; name: string; lastModified: number }[]> {
  const listRaw = await AsyncStorage.getItem(LIST_KEY);
  if (!listRaw) return [];
  return JSON.parse(listRaw);
}
