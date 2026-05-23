import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { CellType, MazeDimensions } from '../../../types/mazeTypes';
import { AdaptiveGrid } from './AdaptiveGrid';
import { MazeConfigDrawer } from './MazeConfigDrawer';
import { MazeCellOverlay } from './MazeCellOverlay';
import { MazeJoystick } from './MazeJoystick';
import { useAdaptiveMaze } from './useAdaptiveMaze';
import { Button } from '../../atom/Button';

// Decoupled shared UI primitives
import { MazeHeader } from './MazeHeader';
import { MazeScoreBoard } from './MazeScoreBoard';
import { MazeStatusModal, MazePublishSuccessModal } from './MazeStatusModal';
import { MazeBundleConfig } from './MazeBundleConfig';
import { MazeBottomDeck } from './MazeBottomDeck';

interface Props {
  onBack?: () => void;
}

export const AdaptiveMazeBuilder: React.FC<Props> = ({ onBack }) => {
  const {
    bundleName,
    setBundleName,
    levels,
    setLevels,
    activeLevelIdx,
    setActiveLevelIdx,
    brush,
    isPlayMode,
    playerPos,
    score,
    targetGoal,
    history,
    overlay,
    setOverlay,
    drawerVisible,
    setDrawerVisible,
    statusModal,
    setStatusModal,
    publishSuccess,
    setPublishSuccess,
    headerAnim,
    activeLevel,
    handleScroll,
    handleSelectDimension,
    handleAddLevel,
    handleRemoveLevel,
    handleSpread,
    handleCellPress,
    handleSaveOverlay,
    handleSelectElement,
    handleBuild,
    handleMove,
    handleUndo,
    handleReset,
    handlePublish,
  } = useAdaptiveMaze(onBack);

  if (!activeLevel) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading Creator...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Decoupled Header View */}
      <MazeHeader
        headerAnim={headerAnim}
        title={isPlayMode ? 'Test Mode Active' : 'Adaptive Maze Canvas'}
        onBack={onBack}
        scoreText={
          isPlayMode
            ? `Score: ${score} | Goal: ${targetGoal}`
            : `Dim: ${activeLevel.dims.rows}x${activeLevel.dims.cols}`
        }
      />

      {/* Main Builder Scroll Canvas */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[
          styles.scrollContent,
          isPlayMode ? { paddingBottom: 350 } : { paddingBottom: 40 },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Reservation Spacer for the Collapsible Absolute Header */}
        <View style={{ height: 60 }} />

        {isPlayMode ? (
          <MazeScoreBoard score={score} targetGoal={targetGoal} />
        ) : (
          <MazeBundleConfig
            bundleName={bundleName}
            onChangeBundleName={setBundleName}
            levels={levels}
            activeLevelIdx={activeLevelIdx}
            onSelectLevelIdx={setActiveLevelIdx}
            onAddLevel={handleAddLevel}
            onRemoveLevel={handleRemoveLevel}
            onChangeTimer={(sec) => {
              setLevels((prev) => {
                const next = [...prev];
                next[activeLevelIdx] = { ...next[activeLevelIdx], timerSeconds: sec };
                return next;
              });
            }}
          />
        )}

        <View style={styles.gridWrapper}>
          <AdaptiveGrid
            dims={activeLevel.dims}
            grid={activeLevel.grid}
            onCellPress={handleCellPress}
            playerPos={isPlayMode ? playerPos : undefined}
          />
        </View>

        {!isPlayMode && drawerVisible && (
          <View style={styles.drawerWrapper}>
            <MazeConfigDrawer
              onSelectDimension={handleSelectDimension}
              onSelectElement={handleSelectElement}
              activeElement={brush}
            />
          </View>
        )}

        {!isPlayMode && (
          <MazeBottomDeck
            onSpread={handleSpread}
            onToggleDrawer={() => setDrawerVisible(!drawerVisible)}
            onTest={handleBuild}
            onPublish={handlePublish}
          />
        )}
      </ScrollView>

      {/* Virtual Joystick Dock */}
      {isPlayMode && (
        <View style={styles.joystickDock}>
          <MazeJoystick onMove={handleMove} onUndo={history.length > 0 ? handleUndo : undefined} />
          <Button
            onPress={handleReset}
            title="Back to Editor"
            icon="edit"
            iconSize={14}
            iconColor="#FFFFFF"
            variant="danger"
            style={styles.exitTestBtn}
            textStyle={styles.exitTestBtnText}
          />
        </View>
      )}

      {/* Grid Cell Editor Configuration Popover */}
      <MazeCellOverlay
        visible={overlay.visible}
        type={overlay.type}
        onCancel={() => setOverlay({ visible: false, type: null, coord: null })}
        onSave={handleSaveOverlay}
      />

      {/* Decoupled Victory / Failure modals */}
      <MazeStatusModal
        visible={!!statusModal?.visible}
        success={!!statusModal?.success}
        msg={statusModal?.msg || ''}
        buttonText={statusModal?.success ? 'Awesome' : 'Retry'}
        onAction={() => {
          setStatusModal(null);
          handleReset();
        }}
      />

      {/* Decoupled Publish success notification */}
      <MazePublishSuccessModal
        visible={publishSuccess}
        onPlay={() => {
          setPublishSuccess(false);
          if (onBack) onBack();
        }}
        onClose={() => setPublishSuccess(false)}
      />
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
    color: '#1d201e',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 290,
  },
  gridWrapper: {
    justifyContent: 'center',
    marginVertical: 10,
  },
  drawerWrapper: {
    marginVertical: 4,
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
  exitTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginTop: 8,
    elevation: 3,
  },
  exitTestBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
