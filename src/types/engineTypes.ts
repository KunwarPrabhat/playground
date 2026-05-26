import { SharedValue } from 'react-native-reanimated';

export type PrimitiveType =
  | 'grid'
  | 'spawner_marker'
  | 'tile'
  | 'text_element'
  // Blueprint Blocks
  | 'on_interact'
  | 'modify_variable'
  | 'compare_state'
  | 'set_canvas_text'
  | 'random_int'
  | 'set_instance_var';

export type GridSnap = 'off' | 8 | 16 | 32;

export interface ElementNode {
  id: string;
  name: string; // User-friendly name (e.g., "MainPlayer")
  type: PrimitiveType;
  x: number;
  y: number;
  w: number;
  h: number;
  parentId?: string | null; // For Unity-style grouping
  targetId?: string | null; // For Blueprint nodes to reference a Scene ID
  props?: Record<string, any>;
  instanceState?: Record<string, any>;
}

export interface GlobalVariable {
  id: string;
  name: string;
  value: number;
}

export type EngineMode = 'edit' | 'play';
