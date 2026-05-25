import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSharedValue, SharedValue } from 'react-native-reanimated';
import { ElementNode, EngineMode, GridSnap, GlobalVariable } from '../types/engineTypes';

interface EngineContextType {
  mode: EngineMode;
  setMode: (mode: EngineMode) => void;
  elements: ElementNode[];
  setElements: React.Dispatch<React.SetStateAction<ElementNode[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  snapSize: GridSnap;
  setSnapSize: (snap: GridSnap) => void;
  addElement: (element: Omit<ElementNode, 'name' | 'id'> & { id?: string }) => void;
  updateElement: (id: string, updates: Partial<ElementNode>) => void;
  moveElementTree: (id: string, dx: number, dy: number) => void;
  deleteElement: (id: string) => void;
  panX: SharedValue<number>;
  panY: SharedValue<number>;
  scale: SharedValue<number>;
  globalVariables: GlobalVariable[];
  addGlobalVariable: () => void;
  updateGlobalVariable: (id: string, updates: Partial<GlobalVariable>) => void;
  removeGlobalVariable: (id: string) => void;
}

const EngineContext = createContext<EngineContextType | undefined>(undefined);

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<EngineMode>('edit');
  const [elements, setElements] = useState<ElementNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapSize, setSnapSize] = useState<GridSnap>(16);
  const [globalVariables, setGlobalVariables] = useState<GlobalVariable[]>([]);

  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const scale = useSharedValue(1);

  const addElement = useCallback((element: Omit<ElementNode, 'name' | 'id'> & { id?: string }) => {
    setElements((prev) => {
      let count = prev.filter(e => e.type === element.type).length + 1;
      let defaultName = `${element.type}_${count}`;
      while (prev.some(e => e.id === defaultName)) {
        count++;
        defaultName = `${element.type}_${count}`;
      }
      return [...prev, { ...element, id: defaultName, name: defaultName, parentId: null, targetId: null } as ElementNode];
    });
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<ElementNode>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
  }, []);

  const addGlobalVariable = useCallback(() => {
    setGlobalVariables((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        name: `Var_${prev.length + 1}`,
        value: 0
      }
    ]);
  }, []);

  const updateGlobalVariable = useCallback((id: string, updates: Partial<GlobalVariable>) => {
    setGlobalVariables((prev) => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  }, []);

  const removeGlobalVariable = useCallback((id: string) => {
    setGlobalVariables((prev) => prev.filter(v => v.id !== id));
  }, []);

  const moveElementTree = useCallback((id: string, dx: number, dy: number) => {
    setElements((prev) => {
      const descendants = new Set<string>();
      const queue = [id];
      while (queue.length > 0) {
        const curr = queue.shift()!;
        descendants.add(curr);
        for (const el of prev) {
          if (el.parentId === curr && !descendants.has(el.id)) {
            queue.push(el.id);
          }
        }
      }
      return prev.map((el) => {
        if (descendants.has(el.id)) {
          return { ...el, x: el.x + dx, y: el.y + dy };
        }
        return el;
      });
    });
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements((prev) => prev.filter((el) => el.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  return (
    <EngineContext.Provider
      value={{
        mode,
        setMode,
        elements,
        setElements,
        selectedId,
        setSelectedId,
        snapSize,
        setSnapSize,
        addElement,
        updateElement,
        moveElementTree,
        deleteElement,
        panX,
        panY,
        scale,
        globalVariables,
        addGlobalVariable,
        updateGlobalVariable,
        removeGlobalVariable
      }}
    >
      {children}
    </EngineContext.Provider>
  );
};

export const useEngine = () => {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error('useEngine must be used within EngineProvider');
  }
  return context;
};
