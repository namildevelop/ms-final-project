import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { styles } from './styles';
import { getApiUrl, API_ENDPOINTS } from '../../lib/api';

// WebBrowser 설정 - 꼭 한 줄
WebBrowser.maybeCompleteAuthSession();

const Login: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // ✅ 프록시 방식 강제 + 프로젝트명 고정으로 통일
  const project = '@kingmin/air-travel';
  const proxyOpts = { useProxy: true };
  const redirectUri = "https://auth.expo.io/@kingmin/air-travel";

  const extra = Constants.expoConfig?.extra as any;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: extra.GOOGLE_EXPO_CLIENT_ID,  // 현재 로그에 찍히는 그 웹 클라ID
    redirectUri,
    responseType: 'id_token',
    scopes: ['openid','profile','email'],
  });

  // 디버깅용
  console.log("🔧 project:", project);
  console.log("🔧 proxyOpts:", proxyOpts);
  console.log("🔧 redirectUri:", redirectUri);
  console.log("🔧 expoClientId:", extra.GOOGLE_EXPO_CLIENT_ID);
  console.log("🔧 request ready:", !!request);
  
  // request 객체 상세 정보 로깅
  if (request) {
    console.log("🔧 request.clientId:", request.clientId);
    console.log("🔧 request.redirectUri:", request.redirectUri);
  }

  // Google 응답 타입 정의
  type GoogleResponse = {
    type: 'success' | 'error' | 'cancel';
    params?: {
      id_token?: string;
    };
    error?: string;
  };

  // 디버깅
  console.log("🔍 appOwnership:", Constants.appOwnership);
  console.log("🔍 isExpoGo:", Constants.appOwnership === "expo");
  console.log("🔍 extra =", extra);
  console.log("🔍 googleConfig:", extra.GOOGLE_EXPO_CLIENT_ID);
  console.log("🔍 request ready:", !!request);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 백엔드 API 호출
      const response = await fetch(`${getApiUrl()}${API_ENDPOINTS.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('로그인 성공!', data);
        // JWT 토큰 저장 (AsyncStorage 설치 후 활성화)
        console.log('JWT 토큰:', data.access_token);
        // TODO: AsyncStorage.setItem('accessToken', data.access_token);
        Alert.alert('성공', '로그인되었습니다!');
        // 메인 화면으로 이동
        router.replace('/');
      } else {
        setErrorMessage(data.detail || '로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      setErrorMessage('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google 로그인 응답 처리
  React.useEffect(() => {
    console.log('🔍 Google OAuth 응답 변경:', response);
    
    // response를 GoogleResponse 타입으로 캐스팅
    const googleResponse = response as GoogleResponse;
    
    if (googleResponse?.type === 'success' && googleResponse.params?.id_token) {
      const idToken = googleResponse.params.id_token;
      console.log('✅ Google 로그인 성공:', googleResponse);

      // 백엔드로 토큰 전송하여 사용자 정보 가져오기
      handleGoogleToken(idToken);
    } else if (googleResponse?.type === 'error') {
      console.error('❌ Google 로그인 에러:', googleResponse.error);
      Alert.alert('오류', `Google 로그인 에러: ${googleResponse.error}`);
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    try {
      console.log('🔍 Google 로그인 시작...');
      console.log('🔍 request 객체:', request);
      console.log('🔍 cfg:', extra.GOOGLE_EXPO_CLIENT_ID);
      
      if (!request) {
        console.log("❌ request 객체가 준비되지 않음");
        Alert.alert('오류', 'Google 로그인 요청이 준비되지 않았습니다.');
        return;
      }

      setIsGoogleLoading(true);
      console.log('🔍 promptAsync 호출...');
      const res = await promptAsync();
      console.log("Google response:", res?.type, (res as GoogleResponse)?.params?.id_token);
      
    } catch (error) {
      console.error('❌ Google 로그인 오류:', error);
      Alert.alert('오류', 'Google 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleToken = async (idToken: string) => {
    try {
      // 백엔드로 구글 ID 토큰 전송
      const response = await fetch(`${getApiUrl()}/auth/google/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: idToken }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('백엔드 인증 성공:', data);
        Alert.alert('성공', 'Google 로그인이 완료되었습니다!');
        router.replace('/');
      } else {
        Alert.alert('오류', data.detail || 'Google 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('백엔드 인증 오류:', error);
      Alert.alert('오류', '서버 인증 중 오류가 발생했습니다.');
    }
  };

  const handleForgotPassword = () => {
    // 비밀번호 찾기 페이지로 이동
    console.log('비밀번호 찾기 페이지로 이동');
    router.push('/forgot-password');
  };

  const handleEmailSignup = () => {
    // 회원가입 페이지로 이동
    console.log('회원가입 페이지로 이동');
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
            style={[styles.googleLoginButton, isGoogleLoading && styles.loginButtonDisabled]}
            disabled={isGoogleLoading}
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

