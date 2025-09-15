import React, { useState, useEffect } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { styles } from './_styles';
import { useAuth } from '../../src/context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const Login: React.FC = () => {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const extra = Constants.expoConfig?.extra as any;
  const redirectUri = AuthSession.makeRedirectUri();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: extra?.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: extra?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: extra?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    redirectUri,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleToken(id_token);
    }
  }, [response]);

  const handleGoogleToken = async (idToken: string) => {
    setIsGoogleLoading(true);
    try {
      const success = await loginWithGoogle(idToken);
      if (success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage('Google 로그인에 실패했습니다.');
      }
    } catch (error) {
      setErrorMessage('Google 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const success = await login(email, password);
      if (success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      setErrorMessage('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!request) {
      Alert.alert('오류', 'Google 로그인 요청이 준비되지 않았습니다. app.config.js와 .env 파일을 확인해주세요.');
      return;
    }
    promptAsync();
  };

  const handleForgotPassword = () => {
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
          <View style={styles.appTitle}>
            <Text style={styles.airText}>Air</Text>
            <Text style={styles.travelText}>Travel</Text>
          </View>
          
          <Text style={styles.loginTitle}>로그인</Text>
          
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
            
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>{errorMessage}</Text>
              </View>
            ) : null}
            
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
          
          <TouchableOpacity 
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>비밀번호를 잊어버리셨나요?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleEmailSignup}
            style={styles.emailSignupButton}
          >
            <Text style={styles.emailSignupText}>이메일로 가입하기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleGoogleLogin}
            style={[styles.googleLoginButton, isGoogleLoading && styles.loginButtonDisabled]}
            disabled={isGoogleLoading || !request}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleLoginText}>구글 로그인</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Login;

