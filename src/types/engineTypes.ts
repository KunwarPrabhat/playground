import { SharedValue } from 'react-native-reanimated';

export type PrimitiveType =
  | 'grid'
  | 'input_block'
  | 'deadblock'
  | 'flowflow'
  | 'if_else_block'
  | 'loop_block'
  | 'game_start'
  | 'game_end'
  | 'spawner_marker'
  // New Scene Components
  | 'tile'
  | 'text_element';

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
}

export type EngineMode = 'edit' | 'play';
