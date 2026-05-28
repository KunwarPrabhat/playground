import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SceneData {
  id: string;
  name: string;
  elements: any[];
  nodes: any[];
  wires: any[];
}

export interface Project {
  id: string;
  name: string;
  lastModified: number;
  globalVariables: any[];
  scenes: SceneData[];
}

const LIST_KEY = 'make2d_project_list';
const PROJECT_PREFIX = 'make2d_project_';
const DEMO_LIST_KEY = 'make2d_demo_list';

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

export async function getDemoIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(DEMO_LIST_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function addDemoId(id: string): Promise<void> {
  const ids = await getDemoIds();
  if (!ids.includes(id)) {
    ids.push(id);
    await AsyncStorage.setItem(DEMO_LIST_KEY, JSON.stringify(ids));
  }
}

export async function removeDemoId(id: string): Promise<void> {
  let ids = await getDemoIds();
  ids = ids.filter((dId) => dId !== id);
  await AsyncStorage.setItem(DEMO_LIST_KEY, JSON.stringify(ids));
}

export async function deleteProjects(ids: string[]): Promise<void> {
  const listRaw = await AsyncStorage.getItem(LIST_KEY);
  if (!listRaw) return;
  let list: { id: string; name: string; lastModified: number }[] = JSON.parse(listRaw);
  list = list.filter((p) => !ids.includes(p.id));
  await AsyncStorage.setItem(LIST_KEY, JSON.stringify(list));

  const demoRaw = await AsyncStorage.getItem(DEMO_LIST_KEY);
  if (demoRaw) {
    let demoIds: string[] = JSON.parse(demoRaw);
    demoIds = demoIds.filter((dId) => !ids.includes(dId));
    await AsyncStorage.setItem(DEMO_LIST_KEY, JSON.stringify(demoIds));
  }

  for (const id of ids) {
    await AsyncStorage.removeItem(PROJECT_PREFIX + id);
  }
}
