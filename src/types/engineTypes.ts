export type PrimitiveType =
  | 'grid'
  | 'input_block'
  | 'deadblock'
  | 'flowflow'
  | 'if_else_block'
  | 'loop_block'
  | 'game_start'
  | 'game_end';

export type GridSnap = 'off' | 8 | 16 | 32;

export interface ElementNode {
  id: string;
  type: PrimitiveType;
  x: number;
  y: number;
  w: number;
  h: number;
  props?: Record<string, any>;
}

export type EngineMode = 'edit' | 'play';
