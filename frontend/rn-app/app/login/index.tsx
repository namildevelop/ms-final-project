import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './styles';

const Login: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // TODO: 백엔드 API 연동
      console.log('로그인 시도:', { email, password });
      
      // 마스터키 확인
      if (email === 'test' && password === '1234') {
        console.log('마스터키 로그인 성공!');
        Alert.alert('성공', '마스터키로 로그인되었습니다!', [
          {
            text: '확인',
            onPress: () => {
              router.replace('/main');
            },
          },
        ]);
        return;
      }

      // 임시 로그인 로직 (나중에 백엔드로 교체)
      if (email === 'test@test.com' && password === 'password') {
        console.log('일반 로그인 성공!');
        Alert.alert('성공', '로그인되었습니다!', [
          {
            text: '확인',
            onPress: () => {
              router.replace('/main');
            },
          },
        ]);
      } else {
        setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      setErrorMessage('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Google 로그인 API 연동
    console.log('Google 로그인 시도');
    Alert.alert('알림', 'Google 로그인 기능은 준비 중입니다.');
  };

  const handleForgotPassword = () => {
    // TODO: 비밀번호 찾기 페이지로 이동
    console.log('비밀번호 찾기');
    Alert.alert('알림', '비밀번호 찾기 기능은 준비 중입니다.');
  };

  const handleEmailSignup = () => {
    console.log('이메일로 가입하기');
    router.push('/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* 앱 이름 */}
          <View style={styles.appTitle}>
            <Text style={styles.airText}>Air</Text>
            <Text style={styles.travelText}>Travel</Text>
          </View>
          
          {/* 로그인 제목 */}
          <Text style={styles.loginTitle}>로그인</Text>
          
          {/* 로그인 폼 */}
          <View style={styles.form}>
            <TextInput
              style={styles.inputField}
              placeholder="이메일 입력"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TextInput
              style={styles.inputField}
              placeholder="비밀번호 입력"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            {/* 에러 메시지 영역 */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              </View>
            ) : null}
            
            {/* 로그인 버튼 */}
            <TouchableOpacity 
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>로그인</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* 비밀번호 찾기 */}
          <TouchableOpacity 
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>비밀번호를 잊어버리셨나요?</Text>
          </TouchableOpacity>
          
          {/* 이메일로 가입하기 */}
          <TouchableOpacity 
            onPress={handleEmailSignup}
            style={styles.emailSignupButton}
          >
            <Text style={styles.emailSignupText}>이메일로 가입하기</Text>
          </TouchableOpacity>
          
          {/* 구글 로그인 */}
          <TouchableOpacity 
            onPress={handleGoogleLogin}
            style={styles.googleLoginButton}
          >
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleLoginText}>구글 로그인</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

