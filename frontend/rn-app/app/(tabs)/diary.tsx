import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DiaryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>일기 화면</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  text: {
    fontSize: 20,
  },
});

export default DiaryScreen;
