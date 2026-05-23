import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export const PlaygroundScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Craft2D Published Library</Text>
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No Games Published Yet</Text>
        <Text style={styles.emptySub}>Build engines in Craft2D Editor, then publish them here!</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1d201e',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ddbea9',
    marginBottom: 12,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    opacity: 0.8,
  },
});
