import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './styles';
import { getApiUrl, API_ENDPOINTS } from '../../lib/api';

const ForgotPassword: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    // 숫자만 입력받고 10-11자리 체크
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    return cleanPhone.length >= 10 && cleanPhone.length <= 11;
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    setEmailError('');
  };

  const handlePhoneChange = (text: string) => {
    // 숫자만 입력받기
    const cleanText = text.replace(/[^0-9]/g, '');
    setPhone(cleanText);
    setPhoneError('');
  };

  const handleSubmit = async () => {
    // 유효성 검사
    let hasError = false;

    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요.');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('올바른 이메일 형식을 입력해주세요.');
      hasError = true;
    }

    if (!phone.trim()) {
      setPhoneError('휴대폰 번호를 입력해주세요.');
      hasError = true;
    } else if (!validatePhone(phone)) {
      setPhoneError('올바른 휴대폰 번호를 입력해주세요. (10-11자리)');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      // 백엔드 API 호출 - 비밀번호 재설정 요청
      const response = await fetch(`${getApiUrl()}${API_ENDPOINTS.passwordRequest}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('비밀번호 재설정 요청 성공:', data);
        // 성공 시 이메일 전송 완료 화면으로 이동
        router.push({
          pathname: '/forgot-password/email-sent',
          params: { email: email.trim() }
        });
      } else {
        // 에러 메시지 표시
        const errorMsg = data.detail || '비밀번호 재설정 요청에 실패했습니다.';
        if (errorMsg.includes('등록되지 않은 이메일')) {
          setEmailError('등록되지 않은 이메일입니다.');
        } else {
          Alert.alert('오류', errorMsg);
        }
      }
    } catch (error) {
      console.error('비밀번호 재설정 요청 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>새 비밀번호 생성</Text>
          </View>

          {/* 제목 */}
          <Text style={styles.title}>새 비밀번호 생성</Text>
          
          {/* 안내 문구 */}
          <Text style={styles.description}>
            가입시 사용한 이메일 주소를 입력하면 새 비밀번호를 생성할 수 있습니다.
          </Text>

          {/* 입력 폼 */}
          <View style={styles.form}>
            {/* 이메일 입력 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>이메일 (필수)</Text>
              <TextInput
                style={[styles.inputField, emailError && styles.inputFieldError]}
                placeholder="이메일을 입력하세요."
                placeholderTextColor="#999"
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emailError ? (
                <Text style={styles.errorMessage}>{emailError}</Text>
              ) : null}
            </View>

            {/* 휴대폰 번호 입력 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>휴대폰번호</Text>
              <TextInput
                style={[styles.inputField, phoneError && styles.inputFieldError]}
                placeholder="없이 휴대폰 번호 입력"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={11}
              />
              {phoneError ? (
                <Text style={styles.errorMessage}>{phoneError}</Text>
              ) : null}
            </View>
          </View>

          {/* 제출 버튼 */}
          <TouchableOpacity 
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>이메일로 받기</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;

