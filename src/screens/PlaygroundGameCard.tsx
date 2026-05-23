import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Button } from '../components/atom/Button';

interface PlaygroundGameCardProps {
  title: string;
  subtitle: string;
  onPress: () => void;
  onDelete?: () => void;
}

export const PlaygroundGameCard: React.FC<PlaygroundGameCardProps> = ({
  title,
  subtitle,
  onPress,
  onDelete,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSub}>{subtitle}</Text>
      </View>
      <View style={styles.cardActions}>
        <Button
          onPress={onPress}
          title="Play"
          icon="play"
          iconSize={10}
          variant="primary"
          style={styles.playBtnPill}
          textStyle={styles.playBtnPillText}
        />
        {onDelete && (
          <Button
            onPress={onDelete}
            icon="trash-2"
            iconSize={10}
            iconColor="#FFFFFF"
            variant="danger"
            style={styles.deleteBtn}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#b6ad90',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#a68a64',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d201e',
  },
  cardSub: {
    fontSize: 11,
    color: '#656d4a',
    marginTop: 4,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playBtnPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  playBtnPillText: {
    fontSize: 10,
  },
  deleteBtn: {
    marginLeft: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#ef4444',
  },
});
