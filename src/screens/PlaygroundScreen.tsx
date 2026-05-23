import React from 'react';
import { StyleSheet, View, Text, FlatList, ScrollView } from 'react-native';
import { usePlayground } from './usePlayground';
import { PlaygroundTabs } from './PlaygroundTabs';
import { PlaygroundGameCard } from './PlaygroundGameCard';

// Decoupled / centralized game components
import { MazeHeader } from '../components/games/maze/MazeHeader';
import { MazeScoreBoard } from '../components/games/maze/MazeScoreBoard';
import { MazeStatusModal } from '../components/games/maze/MazeStatusModal';
import { AdaptiveGrid } from '../components/games/maze/AdaptiveGrid';
import { MazeJoystick } from '../components/games/maze/MazeJoystick';
import { SudokuPlayer } from '../components/games/sudoku/SudokuPlayer';

export const PlaygroundScreen = () => {
  const {
    publishedMazes,
    publishedSudokus,
    deleteMaze,
    deleteSudoku,
    activePlayTab,
    setActivePlayTab,
    selectedMazeBundle,
    setSelectedMazeBundle,
    selectedSudoku,
    setSelectedSudoku,
    currentLevelIdx,
    setCurrentLevelIdx,
    grid,
    playerPos,
    score,
    timeLeft,
    statusModal,
    history,
    headerAnim,
    handleScroll,
    handleMove,
    handleModalAction,
    handleUndo,
  } = usePlayground();

  // 1. Maze active gameplay viewport render
  if (selectedMazeBundle) {
    const currentLevel = selectedMazeBundle.levels[currentLevelIdx];
    return (
      <View style={styles.container}>
        {/* Centralized collapsible header */}
        <MazeHeader
          headerAnim={headerAnim}
          title={selectedMazeBundle.name}
          onBack={() => {
            setSelectedMazeBundle(null);
            setCurrentLevelIdx(0);
          }}
          subtitle={`Level ${currentLevelIdx + 1} of ${selectedMazeBundle.levels.length}`}
          timeLeft={timeLeft}
          isExitButton={true}
        />

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Reservation Spacer for the Collapsible Absolute Header */}
          <View style={{ height: 60 }} />

          <MazeScoreBoard score={score} targetGoal={currentLevel.targetGoalScore} />

          <View style={styles.gridWrapper}>
            <AdaptiveGrid
              dims={currentLevel.dims}
              grid={grid}
              onCellPress={() => {}}
              playerPos={playerPos}
            />
          </View>
        </ScrollView>

        {/* Absolute Docked Joystick to prevent overlapping system navbar */}
        <View style={styles.joystickDock}>
          <MazeJoystick onMove={handleMove} onUndo={history.length > 0 ? handleUndo : undefined} />
        </View>

        {/* Centralized Victory/Defeat Modal */}
        <MazeStatusModal
          visible={!!statusModal?.visible}
          success={!!statusModal?.success}
          msg={statusModal?.msg || ''}
          buttonText={
            statusModal?.success
              ? currentLevelIdx < selectedMazeBundle.levels.length - 1
                ? 'Next Level'
                : 'Awesome'
              : statusModal?.msg.includes('TIME OUT')
              ? 'Back to Playground'
              : 'Retry Level'
          }
          onAction={handleModalAction}
        />
      </View>
    );
  }

  // 2. Sudoku active gameplay viewport render
  if (selectedSudoku) {
    return <SudokuPlayer bundle={selectedSudoku} onClose={() => setSelectedSudoku(null)} />;
  }

  // 3. Category selection dashboard viewport render
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Playground Room</Text>

      {/* Tabs */}
      <PlaygroundTabs activeTab={activePlayTab} onChangeTab={setActivePlayTab} />

      {activePlayTab === 'mazes' ? (
        <FlatList
          data={publishedMazes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaygroundGameCard
              title={item.name}
              subtitle={`Levels: ${item.levels.length} | Timer: ${item.levels[0]?.timerSeconds || 60}s`}
              onPress={() => {
                setSelectedMazeBundle(item);
                setCurrentLevelIdx(0);
              }}
              onDelete={() => deleteMaze(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No Mazes Published Yet</Text>
              <Text style={styles.emptySub}>Sketch in Creator, hit "Play", then Publish!</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={publishedSudokus}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlaygroundGameCard
              title={item.name}
              subtitle={`Levels: ${item.levels.length} | Timer: ${item.timerSeconds}s | Diff: ${item.difficultyLabel.toUpperCase()}`}
              onPress={() => setSelectedSudoku(item)}
              onDelete={() => deleteSudoku(item.id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No Sudokus Published Yet</Text>
              <Text style={styles.emptySub}>Build a bundle sequence, click publish, and see it here!</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c2c5aa',
    paddingHorizontal: 12,
    paddingTop: 50,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#656d4a',
    marginBottom: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 350,
  },
  gridWrapper: {
    justifyContent: 'center',
    marginVertical: 10,
  },
  joystickDock: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(194, 197, 170, 0.95)',
    paddingTop: 12,
    paddingBottom: 28,
    alignItems: 'center',
    borderTopWidth: 1.5,
    borderTopColor: '#a68a64',
    elevation: 10,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#656d4a',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 11,
    color: '#656d4a',
    textAlign: 'center',
    opacity: 0.8,
  },
});
