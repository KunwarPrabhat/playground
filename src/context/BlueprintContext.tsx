import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSharedValue, SharedValue } from 'react-native-reanimated';
import { PrimitiveType } from '../types/engineTypes';

export interface LogicNode {
  id: string;
  type: PrimitiveType;
  targetSceneId: string | null;
  x: number;
  y: number;
  props?: Record<string, any>;
}

export interface Wire {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPinId?: string; // Optional for multi-pin support like True/False
}

interface BlueprintContextType {
  nodes: LogicNode[];
  setNodes: React.Dispatch<React.SetStateAction<LogicNode[]>>;
  wires: Wire[];
  setWires: React.Dispatch<React.SetStateAction<Wire[]>>;
  addLogicNode: (node: LogicNode) => void;
  updateLogicNode: (id: string, updates: Partial<LogicNode>) => void;
  updateLogicNodeTarget: (id: string, targetSceneId: string | null) => void;
  addWire: (wire: Wire) => void;
  panX: SharedValue<number>;
  panY: SharedValue<number>;
  scale: SharedValue<number>;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  draftWire: { startX: number; startY: number; endX: number; endY: number } | null;
  setDraftWire: (wire: { startX: number; startY: number; endX: number; endY: number } | null) => void;
  deleteLogicNode: (id: string) => void;
}

const BlueprintContext = createContext<BlueprintContextType | undefined>(undefined);

export const BlueprintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes] = useState<LogicNode[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draftWire, setDraftWire] = useState<{ startX: number, startY: number, endX: number, endY: number } | null>(null);

  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const scale = useSharedValue(1);

  const addLogicNode = useCallback((node: LogicNode) => {
    setNodes((prev) => [...prev, node]);
  }, []);

  const updateLogicNode = useCallback((id: string, updates: Partial<LogicNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  }, []);

  const updateLogicNodeTarget = useCallback((id: string, targetSceneId: string | null) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, targetSceneId } : n)));
  }, []);

  const addWire = useCallback((wire: Wire) => {
    console.log("[BlueprintContext] ADDING WIRE:", wire);
    setWires((prev) => {
      // Avoid duplicate connections between same nodes
      const exists = prev.some(w => w.fromNodeId === wire.fromNodeId && w.toNodeId === wire.toNodeId);
      if (exists) return prev;
      return [...prev, wire];
    });
  }, []);

  const deleteLogicNode = useCallback((id: string) => {
    console.log("[BlueprintContext] DELETING LOGIC NODE:", id);
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setWires((prev) => prev.filter((w) => w.fromNodeId !== id && w.toNodeId !== id));
  }, []);

  return (
    <BlueprintContext.Provider
      value={{
        nodes,
        setNodes,
        wires,
        setWires,
        addLogicNode,
        updateLogicNode,
        updateLogicNodeTarget,
        addWire,
        panX,
        panY,
        scale,
        selectedNodeId,
        setSelectedNodeId,
        draftWire,
        setDraftWire,
        deleteLogicNode
      }}
    >
      {children}
    </BlueprintContext.Provider>
  );
};

export const useBlueprint = () => {
  const context = useContext(BlueprintContext);
  if (!context) {
    throw new Error('useBlueprint must be used within BlueprintProvider');
  }
  return context;
};
