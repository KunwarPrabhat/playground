import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.canvas}>
        <Text style={styles.text}>Settings Section Workspace</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c2c5aa',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 110,
  },
  canvas: {
    flex: 1,
    backgroundColor: '#b6ad90',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#a68a64',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#1E293B',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
