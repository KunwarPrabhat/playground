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

      const activeEl = elements.find((e) => e.id === activeElementId);

      if (targetNode.type === 'modify_variable') {
        const targetVarId = targetNode.props?.targetVar;
        const gVar = globalVariables.find((v) => v.id === targetVarId);
        if (gVar) {
          const newVal = applyOp(gVar.value, targetNode.props?.val, targetNode.props?.op || '=');
          updateGlobalVariable(gVar.id, { value: newVal });
          console.log(`[Interpreter] Modify Variable [${gVar.name}] from ${gVar.value} to ${newVal}`);
        }
      } else if (targetNode.type === 'set_instance_var') {
        if (activeEl) {
          const key = targetNode.props?.key;
          if (key) {
            const currentVal = activeEl.instanceState?.[key];
            const rawVal = targetNode.props?.val;
            const gVar = globalVariables.find(v => v.name === rawVal);
            const valToUse = gVar ? gVar.value : rawVal;
            const newVal = applyOp(currentVal, valToUse, targetNode.props?.op || '=');
            updateElementState(activeElementId, key, newVal);
            console.log(`[Interpreter] Set Instance Var [${key}] on element [${activeEl.name}] from ${currentVal} to ${newVal}`);
          }
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
                targetId: template.id,
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
      } else if (targetNode.type === 'get_in_radius') {
        if (activeEl) {
          const radius = parseFloat(targetNode.props?.radius) || 0;
          const hitIds = elements
            .filter((el) => el.id !== activeElementId && Math.hypot(el.x - activeEl.x, el.y - activeEl.y) <= radius)
            .map((el) => el.id);
          updateElementState(activeElementId, targetNode.props?.saveKey, hitIds);
          console.log(`[Interpreter] get_in_radius found ${hitIds.length} elements. Saved to '${targetNode.props?.saveKey}'`);
        }
      } else if (targetNode.type === 'box_cast') {
        if (activeEl) {
          const width = parseFloat(targetNode.props?.width) || 0;
          const height = parseFloat(targetNode.props?.height) || 0;
          const hitIds = elements
            .filter(
              (el) =>
                el.id !== activeElementId &&
                Math.abs(el.x - activeEl.x) <= width / 2 &&
                Math.abs(el.y - activeEl.y) <= height / 2
            )
            .map((el) => el.id);
          updateElementState(activeElementId, targetNode.props?.saveKey, hitIds);
          console.log(`[Interpreter] box_cast found ${hitIds.length} elements. Saved to '${targetNode.props?.saveKey}'`);
        }
      } else if (targetNode.type === 'if_else_block') {
        const valA = activeEl?.instanceState?.[targetNode.props?.key];
        const valB = targetNode.props?.val;
        const cond = targetNode.props?.cond || '==';

        const compareVals = (a: any, b: any, op: string) => {
          const numA = parseFloat(a);
          const numB = parseFloat(b);
          const isNumA = !isNaN(numA);
          const isNumB = !isNaN(numB);

          const left = isNumA && isNumB ? numA : (a === undefined || a === null ? '' : a.toString());
          const right = isNumA && isNumB ? numB : (b === undefined || b === null ? '' : b.toString());

          if (op === '==') return left == right;
          if (op === '!=') return left != right;
          if (op === '>') return left > right;
          if (op === '<') return left < right;
          if (op === '>=') return left >= right;
          if (op === '<=') return left <= right;
          return false;
        };

        if (!compareVals(valA, valB, cond)) {
          console.log(`[Interpreter] if_else_block condition failed: ${valA} ${cond} ${valB}. Halting.`);
          return;
        }
      } else if (targetNode.type === 'for_each_loop') {
        const arr = activeEl?.instanceState?.[targetNode.props?.arrayKey];
        if (Array.isArray(arr)) {
          const innerWires = wires.filter((w) => w.fromNodeId === targetNode.id);
          arr.forEach((targetId) => {
            innerWires.forEach((w) => traverse(w.toNodeId, targetId));
          });
        }
      } else if (targetNode.type === 'init_matrix') {
        const targetId = targetNode.targetSceneId;
        if (targetId) {
          const rows = parseInt(targetNode.props?.rows) || 1;
          const cols = parseInt(targetNode.props?.cols) || 1;
          const newMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));
          updateElementState(targetId, 'matrix', newMatrix);
          console.log(`[Interpreter] init_matrix on [${targetId}] with ${rows}x${cols} grid.`);
        }
      } else if (targetNode.type === 'set_matrix_cell') {
        const targetId = targetNode.targetSceneId;
        const targetEl = elements.find(e => e.id === targetId);
        if (targetId && targetEl) {
          const row = parseInt(targetNode.props?.row) || 0;
          const col = parseInt(targetNode.props?.col) || 0;
          const val = parseInt(targetNode.props?.val) || 0;
          const currentMatrix = targetEl.instanceState?.matrix;
          if (Array.isArray(currentMatrix)) {
            const updatedMatrix = currentMatrix.map(r => [...r]);
            if (updatedMatrix[row]) {
              updatedMatrix[row][col] = val;
              updateElementState(targetId, 'matrix', updatedMatrix);
              console.log(`[Interpreter] set_matrix_cell on [${targetId}] at [${row}, ${col}] = ${val}`);
            }
          }
        }
      } else if (targetNode.type === 'get_matrix_cell') {
        const targetId = targetNode.targetSceneId;
        const targetEl = elements.find(e => e.id === targetId);
        if (targetId && targetEl) {
          const row = parseInt(targetNode.props?.row) || 0;
          const col = parseInt(targetNode.props?.col) || 0;
          const saveKey = targetNode.props?.saveKey;
          const currentMatrix = targetEl.instanceState?.matrix;
          if (Array.isArray(currentMatrix) && currentMatrix[row] && saveKey) {
            const cellVal = currentMatrix[row][col];
            updateElementState(activeElementId, saveKey, cellVal);
            console.log(`[Interpreter] get_matrix_cell on [${targetId}] at [${row}, ${col}] = ${cellVal}. Saved to Active Element Key [${saveKey}].`);
          }
        }
      }

      traverse(targetNode.id, activeElementId);
    });
  }, [nodes, wires, globalVariables, updateGlobalVariable, elements, updateElementState, bulkAddElements]);

  const executeEvent = useCallback((targetElementId: string, eventType: 'tap' | 'long_press') => {
    console.log(`[Interpreter] Event triggered: ${eventType.toUpperCase()} on Element ID: ${targetElementId}`);

    const activeEl = elements.find(e => e.id === targetElementId);
    const startingNodes = nodes.filter(
      (n) => n.type === 'on_interact' && (n.targetSceneId === targetElementId || n.targetSceneId === activeEl?.targetId)
    );

    startingNodes.forEach((node) => {
      console.log(`[Interpreter] Starting execution from node: ${node.id}`);
      traverse(node.id, targetElementId);
    });
  }, [nodes, elements, traverse]);

  return { executeEvent };
};
