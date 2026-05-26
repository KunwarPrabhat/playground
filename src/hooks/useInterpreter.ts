import { useCallback } from 'react';
import { useEngine } from '../context/EngineContext';
import { useBlueprint } from '../context/BlueprintContext';
import { ElementNode } from '../types/engineTypes';

export const useInterpreter = () => {
  const {
    elements,
    globalVariables,
    updateGlobalVariable,
    updateElementState,
    bulkAddElements,
  } = useEngine();
  const { nodes, wires } = useBlueprint();

  const traverse = useCallback((currentNodeId: string, activeElementId: string) => {
    const outgoingWires = wires.filter((w) => w.fromNodeId === currentNodeId);

    outgoingWires.forEach((wire) => {
      const targetNode = nodes.find((n) => n.id === wire.toNodeId);
      if (!targetNode) return;

      console.log(`[Interpreter] Executing: ${targetNode.type} (ID: ${targetNode.id})`);

      const applyOp = (current: any, val: any, op: string) => {
        const c = parseFloat(current) || 0;
        const v = parseFloat(val) || 0;
        if (op === '+') return c + v;
        if (op === '-') return c - v;
        if (op === '*') return c * v;
        return v;
      };

      if (targetNode.type === 'modify_variable') {
        const targetVarId = targetNode.props?.targetVar;
        const gVar = globalVariables.find((v) => v.id === targetVarId);
        if (gVar) {
          const newVal = applyOp(gVar.value, targetNode.props?.val, targetNode.props?.op || '=');
          updateGlobalVariable(gVar.id, { value: newVal });
          console.log(`[Interpreter] Modify Variable [${gVar.name}] from ${gVar.value} to ${newVal}`);
        }
      } else if (targetNode.type === 'set_instance_var') {
        const activeElement = elements.find((e) => e.id === activeElementId);
        const key = targetNode.props?.key;
        if (activeElement && key) {
          const currentVal = activeElement.instanceState?.[key];
          const newVal = applyOp(currentVal, targetNode.props?.val, targetNode.props?.op || '=');
          updateElementState(activeElementId, key, newVal);
          console.log(`[Interpreter] Set Instance Var [${key}] on element [${activeElement.name}] from ${currentVal} to ${newVal}`);
        }
      } else if (targetNode.type === 'spawn_grid') {
        const templateId = targetNode.targetSceneId;
        const template = elements.find((e) => e.id === templateId);
        if (template) {
          const rows = parseInt(targetNode.props?.rows) || 1;
          const cols = parseInt(targetNode.props?.cols) || 1;
          const gapX = parseFloat(targetNode.props?.gapX) || 0;
          const gapY = parseFloat(targetNode.props?.gapY) || 0;

          const newElements: ElementNode[] = [];
          for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
              if (r === 0 && c === 0) continue;

              const newX = template.x + c * (template.w + gapX);
              const newY = template.y + r * (template.h + gapY);
              const newId = Math.random().toString(36).substring(7);

              newElements.push({
                ...template,
                id: newId,
                name: `${template.name}_${r}_${c}`,
                x: newX,
                y: newY,
                instanceState: template.instanceState ? { ...template.instanceState } : undefined,
              });
            }
          }

          if (newElements.length > 0) {
            bulkAddElements(newElements);
            console.log(`[Interpreter] Spawned grid: ${newElements.length} elements from template [${template.name}]`);
          }
        }
      }

      traverse(targetNode.id, activeElementId);
    });
  }, [nodes, wires, globalVariables, updateGlobalVariable, elements, updateElementState, bulkAddElements]);

  const executeEvent = useCallback((targetElementId: string, eventType: 'tap' | 'long_press') => {
    console.log(`[Interpreter] Event triggered: ${eventType.toUpperCase()} on Element ID: ${targetElementId}`);

    const startingNodes = nodes.filter(
      (n) => n.type === 'on_interact' && n.targetSceneId === targetElementId
    );

    startingNodes.forEach((node) => {
      console.log(`[Interpreter] Starting execution from node: ${node.id}`);
      traverse(node.id, targetElementId);
    });
  }, [nodes, traverse]);

  return { executeEvent };
};
