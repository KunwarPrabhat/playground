import React, { createContext, useContext, useState } from 'react';
import { MazeBundleData } from '../types/mazeTypes';
import { SudokuBundleData } from '../types/sudokuTypes';

interface GameContextType {
  activeTab: number;
  setActiveTab: (tab: number) => void;
  publishedMazes: MazeBundleData[];
  publishMaze: (maze: MazeBundleData) => void;
  deleteMaze: (id: string) => void;
  publishedSudokus: SudokuBundleData[];
  publishSudoku: (sudoku: SudokuBundleData) => void;
  deleteSudoku: (id: string) => void;
  tabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [publishedMazes, setPublishedMazes] = useState<MazeBundleData[]>([]);
  const [publishedSudokus, setPublishedSudokus] = useState<SudokuBundleData[]>([]);
  const [tabBarVisible, setTabBarVisible] = useState(true);

  const publishMaze = (maze: MazeBundleData) => {
    setPublishedMazes((prev) => [...prev, maze]);
  };

  const deleteMaze = (id: string) => {
    setPublishedMazes((prev) => prev.filter((m) => m.id !== id));
  };

  const publishSudoku = (sudoku: SudokuBundleData) => {
    setPublishedSudokus((prev) => [...prev, sudoku]);
  };

  const deleteSudoku = (id: string) => {
    setPublishedSudokus((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <GameContext.Provider
      value={{
        activeTab,
        setActiveTab,
        publishedMazes,
        publishMaze,
        deleteMaze,
        publishedSudokus,
        publishSudoku,
        deleteSudoku,
        tabBarVisible,
        setTabBarVisible,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
