import React from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '../../atom/Button';

interface MazeHeaderProps {
  headerAnim: Animated.Value;
  title: string;
  onBack?: () => void;
  scoreText?: string;
  subtitle?: string;
  timeLeft?: number;
  isExitButton?: boolean;
}

export const MazeHeader: React.FC<MazeHeaderProps> = ({
  headerAnim,
  title,
  onBack,
  scoreText,
  subtitle,
  timeLeft,
  isExitButton = false,
}) => {
  return (
    <Animated.View style={[styles.headerAnimated, { transform: [{ translateY: headerAnim }] }]}>
      <View style={styles.headerLeft}>
        {onBack && (
          <Button
            onPress={onBack}
            title={isExitButton ? '← Exit' : undefined}
            icon={isExitButton ? undefined : 'arrow-left'}
            iconSize={22}
            iconColor="#1d201e"
            variant={isExitButton ? 'exit' : 'secondary'}
            style={isExitButton ? styles.exitBtn : styles.backBtn}
          />
        )}
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle && <Text style={styles.lvlSub}>{subtitle}</Text>}
        </View>
      </View>

      {scoreText && <Text style={styles.scoreText}>{scoreText}</Text>}

      {timeLeft !== undefined && (
        <View style={styles.timerBadge}>
          <Feather name="clock" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerAnimated: {
    position: 'absolute',
    top: 50,
    left: 12,
    right: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#c2c5aa',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  backBtn: {
    marginRight: 10,
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  exitBtn: {
    marginRight: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1d201e',
  },
  lvlSub: {
    fontSize: 11,
    color: '#656d4a',
    fontWeight: '600',
  },
  scoreText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  timerBadge: {
    backgroundColor: '#656d4a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
