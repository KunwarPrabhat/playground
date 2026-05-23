import React, { createContext, useContext, useState, useCallback } from 'react';
import { ElementNode, EngineMode, GridSnap } from '../types/engineTypes';

interface EngineContextType {
  mode: EngineMode;
  setMode: (mode: EngineMode) => void;
  elements: ElementNode[];
  setElements: React.Dispatch<React.SetStateAction<ElementNode[]>>;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  snapSize: GridSnap;
  setSnapSize: (snap: GridSnap) => void;
  addElement: (element: ElementNode) => void;
  updateElement: (id: string, updates: Partial<ElementNode>) => void;
  deleteElement: (id: string) => void;
}

const EngineContext = createContext<EngineContextType | undefined>(undefined);

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<EngineMode>('edit');
  const [elements, setElements] = useState<ElementNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapSize, setSnapSize] = useState<GridSnap>(16);

  const addElement = useCallback((element: ElementNode) => {
    setElements((prev) => [...prev, element]);
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<ElementNode>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
    );
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
        deleteElement,
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
