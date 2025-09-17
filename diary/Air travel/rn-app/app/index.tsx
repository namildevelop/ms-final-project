import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { getApiUrl } from '../lib/api';

export default function MainScreen() {
  const handleNavigation = (route: string) => {
    router.push(route);
  };

  const testBackendConnection = async () => {
    try {
      const response = await fetch(`${getApiUrl()}/health`);
      const data = await response.json();
      Alert.alert('백엔드 연결 성공', JSON.stringify(data, null, 2));
    } catch (error) {
      Alert.alert('백엔드 연결 실패', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AIR TRAVEL</Text>
      <Text style={styles.subtitle}>모바일 앱</Text>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => handleNavigation('/login')}
        >
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => handleNavigation('/signup')}
        >
          <Text style={styles.buttonText}>회원가입</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => handleNavigation('/additional-info')}
        >
          <Text style={styles.buttonText}>추가 정보 입력</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={testBackendConnection}
        >
          <Text style={styles.buttonText}>백엔드 연결 테스트</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
