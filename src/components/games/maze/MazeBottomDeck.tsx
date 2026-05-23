import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../../atom/Button';

interface MazeBottomDeckProps {
  onSpread: () => void;
  onToggleDrawer: () => void;
  onTest: () => void;
  onPublish: () => void;
}

export const MazeBottomDeck: React.FC<MazeBottomDeckProps> = ({
  onSpread,
  onToggleDrawer,
  onTest,
  onPublish,
}) => {
  return (
    <View style={styles.bottomFloatingDeck}>
      <Button
        onPress={onSpread}
        title="Spread"
        icon="wind"
        variant="deck-spread"
      />

      <Button
        onPress={onToggleDrawer}
        title="Config"
        icon="edit-3"
        variant="deck-pencil"
      />

      <Button
        onPress={onTest}
        title="Test"
        icon="play"
        variant="deck-play"
      />

      <Button
        onPress={onPublish}
        title="Publish"
        icon="check-circle"
        variant="deck-publish"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomFloatingDeck: {
    backgroundColor: '#1d201e',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1.5,
    borderColor: '#474f44',
    marginVertical: 16,
    elevation: 4,
  },
});
