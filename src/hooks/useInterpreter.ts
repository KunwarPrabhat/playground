import { useCallback, useEffect, useRef } from 'react';
import { useEngine } from '../context/EngineContext';
import { useBlueprint } from '../context/BlueprintContext';
import { ElementNode } from '../types/engineTypes';

export const useInterpreter = () => {
  const { mode, elements, globalVariables, updateGlobalVariable, updateElementState, bulkAddElements, setSceneLoadRequest, deleteElement, updateElement } = useEngine();
  const { nodes, wires } = useBlueprint();
  const elementsRef = useRef(elements);
  const globalsRef = useRef(globalVariables);

  useEffect(() => {
    elementsRef.current = elements;
    globalsRef.current = globalVariables;
  }, [elements, globalVariables]);

  const processQueue = useCallback(async (nodesToStart: any[], targetElementId: string) => {
    const queue: { nodeId: string; activeElementId: string }[] = [];
    nodesToStart.forEach((node) => {
      queue.push({ nodeId: node.id, activeElementId: targetElementId });
    });

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;
      
      const { nodeId: currentNodeId, activeElementId: currentActiveId } = current;
      const outgoingWires = wires.filter((w) => w.fromNodeId === currentNodeId);

      for (const wire of outgoingWires) {
        const targetNode = nodes.find((n) => n.id === wire.toNodeId);
        if (!targetNode) continue;

        const activeEl = elementsRef.current.find((e) => e.id === currentActiveId);

        const resolveValue = (rawVal: any, el: any) => {
          if (typeof rawVal === 'string' && rawVal.startsWith('$')) {
            return el?.instanceState?.[rawVal.substring(1)] ?? 0;
          }
          const gVar = globalsRef.current.find(v => v.name === rawVal);
          if (gVar) return gVar.value;
          return rawVal;
        };

        const applyOp = (currentVal: any, val: any, op: string) => {
          const c = parseFloat(currentVal) || 0;
          const v = parseFloat(val) || 0;
          if (op === '+') return c + v;
          if (op === '-') return c - v;
          if (op === '*') return c * v;
          return v;
        };

        const compareVals = (a: any, b: any, op: string) => {
          const numA = parseFloat(a), numB = parseFloat(b);
          const isNumA = !isNaN(numA), isNumB = !isNaN(numB);
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

        if (targetNode.type === 'delay') {
          const ms = parseFloat(resolveValue(targetNode.props?.ms, activeEl)) || 0;
          if (ms > 0) {
            await new Promise(res => setTimeout(res, ms));
          }
        } else if (targetNode.type === 'destroy_element') {
          const targetId = targetNode.targetSceneId || currentActiveId;
          deleteElement(targetId);
        } else if (targetNode.type === 'set_transform') {
          const targetId = targetNode.targetSceneId || currentActiveId;
          const targetEl = elementsRef.current.find(e => e.id === targetId);
          if (targetEl) {
            const updates: Partial<ElementNode> = {};
            
            const parseTransformVal = (propVal: any, currentVal: number) => {
              if (!propVal) return currentVal;
              const strVal = propVal.toString().trim();
              if (strVal.startsWith('+')) return currentVal + (parseFloat(strVal.substring(1)) || 0);
              if (strVal.startsWith('-')) return currentVal - (parseFloat(strVal.substring(1)) || 0);
              return parseFloat(resolveValue(propVal, activeEl)) || currentVal;
            };

            if (targetNode.props?.x) updates.x = parseTransformVal(targetNode.props.x, targetEl.x);
            if (targetNode.props?.y) updates.y = parseTransformVal(targetNode.props.y, targetEl.y);
            if (targetNode.props?.w) updates.w = parseTransformVal(targetNode.props.w, targetEl.w);
            if (targetNode.props?.h) updates.h = parseTransformVal(targetNode.props.h, targetEl.h);
            
            updateElement(targetId, updates);
          }
        } else if (targetNode.type === 'modify_variable') {
          const gVar = globalsRef.current.find((v) => v.id === targetNode.props?.targetVar);
          if (gVar) {
            const newVal = applyOp(gVar.value, resolveValue(targetNode.props?.val, activeEl), targetNode.props?.op || '=');
            updateGlobalVariable(gVar.id, { value: newVal });
          }
        } else if (targetNode.type === 'set_instance_var') {
          if (activeEl && targetNode.props?.key) {
            const newVal = applyOp(activeEl.instanceState?.[targetNode.props.key], resolveValue(targetNode.props?.val, activeEl), targetNode.props?.op || '=');
            updateElementState(currentActiveId, targetNode.props.key, newVal);
          }
        } else if (targetNode.type === 'spawn_grid') {
          const template = elementsRef.current.find((e) => e.id === targetNode.targetSceneId);
          if (template) {
            const rows = parseInt(targetNode.props?.rows) || 1;
            const cols = parseInt(targetNode.props?.cols) || 1;
            const gapX = parseFloat(targetNode.props?.gapX) || 0;
            const gapY = parseFloat(targetNode.props?.gapY) || 0;
            const newElements: ElementNode[] = [];
            
            for (let r = 0; r < rows; r++) {
              for (let c = 0; c < cols; c++) {
                if (r === 0 && c === 0) continue;
                newElements.push({
                  ...template,
                  id: Math.random().toString(36).substring(7),
                  targetId: template.id,
                  name: `${template.name}_${r}_${c}`,
                  x: template.x + c * (template.w + gapX),
                  y: template.y + r * (template.h + gapY),
                  instanceState: template.instanceState ? { ...template.instanceState } : undefined,
                });
              }
            }
            if (newElements.length > 0) bulkAddElements(newElements);
          }
        } else if (targetNode.type === 'get_in_radius') {
          if (activeEl) {
            const radius = parseFloat(targetNode.props?.radius) || 0;
            const hitIds = elementsRef.current
              .filter((el) => el.id !== currentActiveId && Math.hypot(el.x - activeEl.x, el.y - activeEl.y) <= radius)
              .map((el) => el.id);
            updateElementState(currentActiveId, targetNode.props?.saveKey, hitIds);
          }
        } else if (targetNode.type === 'get_orthogonal') {
          if (activeEl) {
            const distance = parseFloat(targetNode.props?.distance) || 0;
            const hitIds = elementsRef.current.filter((el) => {
              if (el.id === currentActiveId) return false;
              const dx = Math.abs(el.x - activeEl.x);
              const dy = Math.abs(el.y - activeEl.y);
              const isXMatch = dx >= distance - 5 && dx <= distance + 5 && dy <= 5;
              const isYMatch = dy >= distance - 5 && dy <= distance + 5 && dx <= 5;
              return isXMatch || isYMatch;
            }).map((el) => el.id);
            updateElementState(currentActiveId, targetNode.props?.saveKey, hitIds);
          }
        } else if (targetNode.type === 'box_cast') {
          if (activeEl) {
            const w = parseFloat(targetNode.props?.width) || 0;
            const h = parseFloat(targetNode.props?.height) || 0;
            const hitIds = elementsRef.current
              .filter((el) => el.id !== currentActiveId && Math.abs(el.x - activeEl.x) <= w / 2 && Math.abs(el.y - activeEl.y) <= h / 2)
              .map((el) => el.id);
            updateElementState(currentActiveId, targetNode.props?.saveKey, hitIds);
          }
        } else if (targetNode.type === 'if_else_block') {
          const valA = resolveValue(`$${targetNode.props?.key}`, activeEl);
          const valB = resolveValue(targetNode.props?.val, activeEl);
          if (!compareVals(valA, valB, targetNode.props?.cond || '==')) continue;
        } else if (targetNode.type === 'count_elements') {
          if (activeEl && targetNode.props?.key && targetNode.props?.saveKey) {
            const valB = resolveValue(targetNode.props?.val, activeEl);
            let count = 0;
            elementsRef.current.forEach(el => {
              const valA = el.instanceState?.[targetNode.props!.key];
              if (compareVals(valA, valB, targetNode.props?.cond || '==')) count++;
            });
            updateElementState(currentActiveId, targetNode.props.saveKey, count);
          }
        } else if (targetNode.type === 'for_each_loop') {
          const arr = activeEl?.instanceState?.[targetNode.props?.arrayKey];
          if (Array.isArray(arr)) {
            const innerWires = wires.filter((w) => w.fromNodeId === targetNode.id);
            arr.forEach((targetId) => {
              innerWires.forEach((w) => queue.push({ nodeId: w.toNodeId, activeElementId: targetId }));
            });
          }
          continue;
        } else if (targetNode.type === 'init_matrix') {
          const targetId = targetNode.targetSceneId;
          if (targetId) {
            const rows = parseInt(targetNode.props?.rows) || 1;
            const cols = parseInt(targetNode.props?.cols) || 1;
            const newMatrix = Array.from({ length: rows }, () => Array(cols).fill(0));
            updateElementState(targetId, 'matrix', newMatrix);
          }
        } else if (targetNode.type === 'set_matrix_cell') {
          const targetId = targetNode.targetSceneId;
          const targetEl = elementsRef.current.find(e => e.id === targetId);
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
              }
            }
          }
        } else if (targetNode.type === 'get_matrix_cell') {
          const targetId = targetNode.targetSceneId;
          const targetEl = elementsRef.current.find(e => e.id === targetId);
          if (targetId && targetEl) {
            const row = parseInt(targetNode.props?.row) || 0;
            const col = parseInt(targetNode.props?.col) || 0;
            const saveKey = targetNode.props?.saveKey;
            const currentMatrix = targetEl.instanceState?.matrix;
            if (Array.isArray(currentMatrix) && currentMatrix[row] && saveKey) {
              const cellVal = currentMatrix[row][col];
              updateElementState(currentActiveId, saveKey, cellVal);
            }
          }
        } else if (targetNode.type === 'load_scene') {
          if (targetNode.props?.sceneName) {
            setSceneLoadRequest(targetNode.props.sceneName);
          }
        }

        queue.push({ nodeId: targetNode.id, activeElementId: currentActiveId });
      }
    }
  }, [wires, updateGlobalVariable, updateElementState, bulkAddElements, setSceneLoadRequest, deleteElement, updateElement, nodes]);

  const executeEvent = useCallback(async (targetElementId: string, eventType: 'tap' | 'long_press') => {
    const activeEl = elementsRef.current.find(e => e.id === targetElementId);
    
    const startingNodes = nodes.filter(
      (n) => n.type === 'on_interact' && (n.targetSceneId === targetElementId || n.targetSceneId === activeEl?.targetId)
    );
    
    if (startingNodes.length > 0) {
      await processQueue(startingNodes, targetElementId);
    }

    const completionNodes = nodes.filter(
      (n) => n.type === 'on_execution_complete' && (n.targetSceneId === targetElementId || n.targetSceneId === activeEl?.targetId)
    );
    
    if (completionNodes.length > 0) {
      await processQueue(completionNodes, targetElementId);
    }
  }, [nodes, processQueue]);

  useEffect(() => {
    if (mode === 'play') {
      const timers: NodeJS.Timeout[] = [];
      const tickNodes = nodes.filter(n => n.type === 'on_tick');
      
      tickNodes.forEach(node => {
        const interval = parseInt(node.props?.interval) || 1000;
        const targetId = node.targetSceneId;
        
        if (targetId) {
          const timer = setInterval(() => {
            const el = elementsRef.current.find(e => e.id === targetId);
            if (el) {
              processQueue([node], targetId);
            }
          }, interval);
          timers.push(timer);
        }
      });

      return () => timers.forEach(clearInterval);
    }
  }, [mode, nodes, processQueue]);

  return { executeEvent };
};
