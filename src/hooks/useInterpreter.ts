import { useCallback } from 'react';
import { useEngine } from '../context/EngineContext';
import { useBlueprint } from '../context/BlueprintContext';

export const useInterpreter = () => {
  const { elements } = useEngine();
  const { nodes, wires } = useBlueprint();

  const traverse = useCallback((currentNodeId: string) => {
    const outgoingWires = wires.filter((w) => w.fromNodeId === currentNodeId);

    outgoingWires.forEach((wire) => {
      const targetNode = nodes.find((n) => n.id === wire.toNodeId);
      if (!targetNode) return;

      switch (targetNode.type) {
        case 'modify_variable':
        case 'compare_state':
        case 'set_canvas_text':
        case 'random_int':
        default:
          console.log(`[Interpreter] Executing: ${targetNode.type} (ID: ${targetNode.id})`);
          break;
      }

      traverse(targetNode.id);
    });
  }, [nodes, wires]);

  const executeEvent = useCallback((targetElementId: string, eventType: 'tap' | 'long_press') => {
    console.log(`[Interpreter] Event triggered: ${eventType.toUpperCase()} on Element ID: ${targetElementId}`);

    const startingNodes = nodes.filter(
      (n) => n.type === 'on_interact' && n.targetSceneId === targetElementId
    );

    startingNodes.forEach((node) => {
      console.log(`[Interpreter] Starting execution from node: ${node.id}`);
      traverse(node.id);
    });
  }, [nodes, traverse]);

  return { executeEvent };
};
