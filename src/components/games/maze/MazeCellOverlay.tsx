import React, { useState } from 'react';
import { StyleSheet, View, Text, Modal, TextInput } from 'react-native';
import { Button } from '../../atom/Button';

interface Props {
  visible: boolean;
  type: 'goal' | 'math' | null;
  onCancel: () => void;
  onSave: (value: string) => void;
}

export const MazeCellOverlay: React.FC<Props> = ({ visible, type, onCancel, onSave }) => {
  const [goalInput, setGoalInput] = useState('15');
  const [operator, setOperator] = useState('+');
  const [operand, setOperand] = useState('2');

  const handleSave = () => {
    if (type === 'goal') {
      onSave(goalInput);
    } else if (type === 'math') {
      onSave(`${operator}${operand}`);
    }
  };

  const ops = ['+', '-', '*'];
  const nums = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalBg}>
        <View style={styles.content}>
          <Text style={styles.title}>
            {type === 'goal' ? 'Set Target Goal Score' : 'Configure Math Patch'}
          </Text>

          {type === 'goal' ? (
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={goalInput}
              onChangeText={setGoalInput}
              autoFocus
            />
          ) : (
            <View>
              <View style={styles.row}>
                {ops.map((o) => (
                  <Button
                    key={o}
                    onPress={() => setOperator(o)}
                    title={o}
                    variant={operator === o ? 'primary' : 'secondary'}
                    style={styles.selBtn}
                  />
                ))}
              </View>
              <View style={styles.row}>
                {nums.map((n) => (
                  <Button
                    key={n}
                    onPress={() => setOperand(n)}
                    title={n}
                    variant={operand === n ? 'success' : 'secondary'}
                    style={styles.numBtn}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={styles.buttons}>
            <Button
              onPress={onCancel}
              title="Cancel"
              variant="secondary"
              style={styles.btn}
            />
            <Button
              onPress={handleSave}
              title="Apply"
              variant="primary"
              style={[styles.btn, styles.confirmBtn]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#505451ff',
    padding: 20,
    borderRadius: 20,
    width: '85%',
    borderWidth: 1.5,
    borderColor: '#474f44',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderBottomWidth: 2,
    borderBottomColor: '#6b705c',
    paddingVertical: 8,
    color: '#FFFFFF',
    marginBottom: 20,
    fontSize: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selBtn: {
    margin: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  numBtn: {
    width: 32,
    height: 32,
    margin: 3,
    borderRadius: 6,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  btn: {
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmBtn: {
    backgroundColor: '#6b705c',
  },
});
