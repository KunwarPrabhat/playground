import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ScrollView, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useGame } from '../../../context/GameContext';
import { SudokuType, SudokuDifficulty, SudokuLevelConfig, SudokuBundleData } from '../../../types/sudokuTypes';
import { Button } from '../../atom/Button';
import { Chip } from '../../atom/Chip';

interface Props {
  onBack: () => void;
}

export const SudokuCreator: React.FC<Props> = ({ onBack }) => {
  const { publishSudoku } = useGame();
  
  const [bundleName, setBundleName] = useState('My Sudoku Challenge');
  const [timerVal, setTimerVal] = useState(120);
  const [customMin, setCustomMin] = useState('');
  const [customSec, setCustomSec] = useState('');
  
  const [overallDiff, setOverallDiff] = useState<SudokuDifficulty>('medium');
  const [levels, setLevels] = useState<SudokuLevelConfig[]>([
    { type: '4x4', difficulty: 'easy' }
  ]);

  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleAddLevel = () => {
    setLevels((prev) => [...prev, { type: '6x6', difficulty: 'medium' }]);
  };

  const handleRemoveLevel = (index: number) => {
    setLevels((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLevel = (index: number, key: keyof SudokuLevelConfig, value: any) => {
    setLevels((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleCustomTime = (min: string, sec: string) => {
    setCustomMin(min);
    setCustomSec(sec);
    const m = parseInt(min) || 0;
    const s = parseInt(sec) || 0;
    setTimerVal(m * 60 + s);
  };

  const handlePublish = () => {
    if (!bundleName.trim() || levels.length === 0) return;
    const bundle: SudokuBundleData = {
      id: Math.random().toString(),
      name: bundleName,
      levels,
      timerSeconds: timerVal > 0 ? timerVal : 120,
      difficultyLabel: overallDiff
    };
    publishSudoku(bundle);
    setPublishSuccess(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button
          onPress={onBack}
          icon="arrow-left"
          iconSize={22}
          iconColor="#656d4a"
          variant="secondary"
          style={styles.backBtn}
        />
        <Text style={styles.headerTitle}>Sudoku Builder</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>Bundle Name</Text>
          <TextInput
            style={styles.input}
            value={bundleName}
            onChangeText={setBundleName}
            placeholder="Quest Name"
            placeholderTextColor="#a68a64"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Difficulty Rating</Text>
          <View style={styles.row}>
            {(['easy', 'medium', 'hard'] as SudokuDifficulty[]).map((d) => (
              <Chip
                key={d}
                label={d.toUpperCase()}
                active={overallDiff === d}
                onPress={() => setOverallDiff(d)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Timer Limit (per level)</Text>
          <View style={styles.row}>
            {[
              { label: '1 Min', val: 60 },
              { label: '2 Min', val: 120 },
              { label: '5 Min', val: 300 }
            ].map((item) => (
              <Chip
                key={item.val}
                label={item.label}
                active={timerVal === item.val}
                onPress={() => {
                  setTimerVal(item.val);
                  setCustomMin('');
                  setCustomSec('');
                }}
              />
            ))}
          </View>
          
          <View style={styles.customTimeRow}>
            <Text style={styles.customTimeLabel}>Or Custom:</Text>
            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              value={customMin}
              onChangeText={(text) => handleCustomTime(text, customSec)}
              placeholder="Min"
              placeholderTextColor="#a68a64"
            />
            <Text style={styles.timeColon}>:</Text>
            <TextInput
              style={styles.timeInput}
              keyboardType="number-pad"
              value={customSec}
              onChangeText={(text) => handleCustomTime(customMin, text)}
              placeholder="Sec"
              placeholderTextColor="#a68a64"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.levelHeader}>
            <Text style={styles.label}>Levels Sequence ({levels.length})</Text>
            <Button
              onPress={handleAddLevel}
              title="Add Level"
              icon="plus-circle"
              iconSize={18}
              iconColor="#656d4a"
              variant="add-level"
            />
          </View>

          {levels.map((item, idx) => (
            <View key={idx} style={styles.levelCard}>
              <View style={styles.levelCardTop}>
                <Text style={styles.levelIdx}>Level {idx + 1}</Text>
                {levels.length > 1 && (
                  <Button
                    onPress={() => handleRemoveLevel(idx)}
                    icon="trash-2"
                    iconSize={18}
                    iconColor="#a68a64"
                    variant="secondary"
                    style={styles.trashBtn}
                  />
                )}
              </View>

              <View style={styles.levelSelectors}>
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Type</Text>
                  <View style={styles.selectorsRow}>
                    {(['4x4', '6x6', '9x9', '16x16', 'irregular', 'shape'] as SudokuType[]).map((type) => (
                      <Chip
                        key={type}
                        label={type}
                        active={item.type === type}
                        onPress={() => handleUpdateLevel(idx, 'type', type)}
                        style={styles.selBtn}
                        textStyle={styles.selText}
                      />
                    ))}
                  </View>
                </View>

                <View style={[styles.pickerCol, { marginTop: 8 }]}>
                  <Text style={styles.pickerLabel}>Difficulty</Text>
                  <View style={styles.selectorsRow}>
                    {(['easy', 'medium', 'hard'] as SudokuDifficulty[]).map((diff) => (
                      <Chip
                        key={diff}
                        label={diff}
                        active={item.difficulty === diff}
                        onPress={() => handleUpdateLevel(idx, 'difficulty', diff)}
                        style={styles.selBtn}
                        textStyle={styles.selText}
                      />
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Button
          onPress={handlePublish}
          title="Publish Bundle"
          variant="secondary"
          style={styles.publishBtn}
          textStyle={styles.publishBtnText}
        />
      </ScrollView>

      <Modal visible={publishSuccess} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={3}>
                <Path d="M20 6L9 17l-5-5" />
              </Svg>
            </View>
            <Text style={styles.modalTitle}>Published!</Text>
            <Text style={styles.modalMsg}>Your Sudoku Bundle is live in Playground Room.</Text>
            <Button
              onPress={() => {
                setPublishSuccess(false);
                onBack();
              }}
              title="Excellent"
              variant="secondary"
              style={styles.modalBtn}
              textStyle={styles.modalBtnText}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#c2c5aa', paddingTop: 50, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { marginRight: 16, backgroundColor: 'transparent', paddingVertical: 0, paddingHorizontal: 0 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#656d4a' },
  scroll: { paddingBottom: 120 },
  section: { backgroundColor: '#b6ad90', padding: 14, borderRadius: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#a68a64' },
  label: { fontSize: 13, fontWeight: 'bold', color: '#656d4a', marginBottom: 8 },
  input: { backgroundColor: '#c2c5aa', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#656d4a', fontWeight: 'bold' },
  row: { flexDirection: 'row' },
  customTimeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  customTimeLabel: { fontSize: 12, fontWeight: 'bold', color: '#656d4a', marginRight: 8 },
  timeInput: { backgroundColor: '#c2c5aa', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, fontSize: 13, color: '#656d4a', fontWeight: 'bold', width: 50, textAlign: 'center', borderWidth: 1, borderColor: '#a68a64' },
  timeColon: { fontSize: 14, fontWeight: 'bold', color: '#656d4a', marginHorizontal: 4 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  levelCard: { backgroundColor: '#c2c5aa', padding: 12, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#a68a64' },
  levelCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  levelIdx: { fontSize: 12, fontWeight: 'bold', color: '#656d4a' },
  trashBtn: { backgroundColor: 'transparent', paddingVertical: 0, paddingHorizontal: 0 },
  levelSelectors: { marginTop: 4 },
  pickerCol: { width: '100%' },
  pickerLabel: { fontSize: 10, fontWeight: 'bold', color: '#a68a64', marginBottom: 4 },
  selectorsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  selBtn: { marginRight: 6, marginBottom: 6 },
  selText: { fontSize: 10 },
  publishBtn: { backgroundColor: '#a4ac86', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 10, borderWidth: 1.5, borderColor: '#656d4a' },
  publishBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#656d4a', padding: 24, borderRadius: 24, width: '80%', alignItems: 'center', borderWidth: 1.5, borderColor: '#a4ac86' },
  successIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#a4ac86', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  modalMsg: { fontSize: 13, color: '#c2c5aa', textAlign: 'center', marginBottom: 20 },
  modalBtn: { backgroundColor: '#a4ac86', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center' },
  modalBtnText: { color: '#FFFFFF', fontWeight: 'bold' }
});
