import React from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './success-styles';

const PasswordResetSuccess: React.FC = () => {
  const router = useRouter();

  const handleGoToLogin = () => {
    // 로그인 화면으로 이동
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 성공 아이콘 */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>✅</Text>
        </View>

        {/* 성공 메시지 */}
        <Text style={styles.successMessage}>비밀번호가 변경되었습니다.</Text>
        
        {/* 추가 안내 */}
        <Text style={styles.description}>
          새로운 비밀번호로 로그인하실 수 있습니다.
        </Text>

        {/* 로그인하기 버튼 */}
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleGoToLogin}
        >
          <Text style={styles.loginButtonText}>로그인하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PasswordResetSuccess;

