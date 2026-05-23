import React from 'react';
import { StyleSheet, View, Text, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Button } from '../../atom/Button';

interface StatusModalProps {
  visible: boolean;
  success: boolean;
  msg: string;
  buttonText: string;
  onAction: () => void;
}

export const MazeStatusModal: React.FC<StatusModalProps> = ({
  visible,
  success,
  msg,
  buttonText,
  onAction,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.statusBg}>
        <View style={styles.statusContent}>
          <View style={[styles.statusIcon, { backgroundColor: success ? '#12db98' : '#ef4444' }]}>
            {success ? (
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            ) : (
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
                <Path d="M18 6L6 18M6 6l12 12" />
              </Svg>
            )}
          </View>
          <Text style={styles.statusTitle}>{success ? 'Victory!' : 'Failed!'}</Text>
          <Text style={styles.statusMsg}>{msg}</Text>
          <Button
            onPress={onAction}
            title={buttonText}
            variant={success ? 'success' : 'danger'}
            style={styles.statusBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

interface PublishSuccessModalProps {
  visible: boolean;
  onPlay: () => void;
  onClose: () => void;
}

export const MazePublishSuccessModal: React.FC<PublishSuccessModalProps> = ({
  visible,
  onPlay,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.statusBg}>
        <View style={styles.statusContent}>
          <View style={styles.publishSuccessIcon}>
            <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
          </View>
          <Text style={styles.statusTitle}>Bundle Published!</Text>
          <Text style={styles.statusMsg}>Your Custom Maze Bundle is now ready in the Playground Room.</Text>
          <Button
            onPress={onPlay}
            title="Play Game Now"
            variant="success"
            style={styles.statusBtn}
          />
          <Button
            onPress={onClose}
            title="Back to Editor"
            variant="secondary"
            style={[styles.statusBtn, { marginTop: 10 }]}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  statusBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusContent: {
    backgroundColor: '#2d312e',
    padding: 24,
    borderRadius: 24,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#474f44',
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  publishSuccessIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#12db98',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  statusMsg: {
    fontSize: 13,
    color: '#a4a790',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusBtn: {
    width: '100%',
  },
});
