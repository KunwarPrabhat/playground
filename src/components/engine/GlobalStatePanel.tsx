import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useEngine } from '../../context/EngineContext';

export const GlobalStatePanel: React.FC = () => {
  const { globalVariables, addGlobalVariable, updateGlobalVariable, removeGlobalVariable } = useEngine();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Global State</Text>
        <TouchableOpacity style={styles.addBtn} onPress={addGlobalVariable}>
          <Feather name="plus" size={14} color="#fff" />
          <Text style={styles.addBtnText}>Add Variable</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list}>
        {globalVariables.map((v) => (
          <View key={v.id} style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={v.name}
                onChangeText={(text) => updateGlobalVariable(v.id, { name: text })}
                placeholder="Variable Name"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 0.5 }]}>
              <Text style={styles.label}>Initial Value</Text>
              <TextInput
                style={styles.input}
                value={v.value.toString()}
                onChangeText={(text) => {
                  const val = parseFloat(text);
                  if (!isNaN(val)) {
                    updateGlobalVariable(v.id, { value: val });
                  } else if (text === '' || text === '-') {
                    // Allow intermediate typing states if needed, but for simplicity store 0 or keep old.
                    // In a production app you might use local state for the input, but here we'll let it be.
                    // To avoid typing issues with '0', we'll just allow numeric changes.
                  }
                }}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.2)"
              />
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeGlobalVariable(v.id)}>
              <Feather name="trash-2" size={16} color="#cb4f4f" />
            </TouchableOpacity>
          </View>
        ))}
        {globalVariables.length === 0 && (
          <Text style={styles.emptyText}>No global variables defined. Click "Add Variable" to create one.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12141a', // Blueprint theme background
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#ddbea9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(113, 160, 113, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(113, 160, 113, 0.4)',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  deleteBtn: {
    padding: 10,
    backgroundColor: 'rgba(203, 79, 79, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(203, 79, 79, 0.3)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 12,
  },
});
