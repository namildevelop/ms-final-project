import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { styles } from './new-password-styles';
import { getApiUrl, API_ENDPOINTS } from '../../lib/api';

const NewPassword: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const token = params.token as string;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string) => {
    // 8-16자, 대소문자, 숫자, 특수문자 포함
    const minLength = password.length >= 8;
    const maxLength = password.length <= 16;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: minLength && maxLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: {
        length: !minLength || !maxLength,
        upperCase: !hasUpperCase,
        lowerCase: !hasLowerCase,
        numbers: !hasNumbers,
        specialChar: !hasSpecialChar,
      }
    };
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordError('');
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setConfirmPasswordError('');
  };

  const handleSubmit = async () => {
    // 유효성 검사
    let hasError = false;

    if (!password.trim()) {
      setPasswordError('비밀번호를 입력해주세요.');
      hasError = true;
    } else {
      const validation = validatePassword(password);
      if (!validation.isValid) {
        setPasswordError('비밀번호는 8-16자이며 대소문자, 숫자, 특수문자를 포함해야 합니다.');
        hasError = true;
      }
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError('비밀번호 확인을 입력해주세요.');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      // 백엔드 API 호출 - 비밀번호 재설정
      const response = await fetch(`${getApiUrl()}${API_ENDPOINTS.passwordReset}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          new_password: password,
          new_password_confirm: confirmPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('비밀번호 재설정 성공:', data);
        // 성공 시 완료 화면으로 이동
        router.replace('/forgot-password/success');
      } else {
        const errorMsg = data.detail || '비밀번호 재설정에 실패했습니다.';
        Alert.alert('오류', errorMsg);
      }
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      Alert.alert('오류', '네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const validation = password ? validatePassword(password) : null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* 제목 */}
          <Text style={styles.title}>새 비밀번호</Text>
          
          {/* 입력 폼 */}
          <View style={styles.form}>
            {/* 비밀번호 입력 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>비밀번호를 입력하세요.</Text>
              <TextInput
                style={[styles.inputField, passwordError && styles.inputFieldError]}
                placeholder="새 비밀번호를 입력하세요"
                placeholderTextColor="#999"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {passwordError ? (
                <Text style={styles.errorMessage}>{passwordError}</Text>
              ) : null}
            </View>

            {/* 비밀번호 확인 입력 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>비밀번호를 한번 더 입력하세요.</Text>
              <TextInput
                style={[styles.inputField, confirmPasswordError && styles.inputFieldError]}
                placeholder="비밀번호를 다시 입력하세요"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {confirmPasswordError ? (
                <Text style={styles.errorMessage}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* 비밀번호 요구사항 */}
            {validation && (
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>메시지</Text>
                <Text style={[styles.requirement, validation.errors.length && styles.requirementError]}>
                  대소문자, 숫자, 특수문자 포함 (8~16자)
                </Text>
                <Text style={[styles.requirement, validation.errors.numbers && styles.requirementError]}>
                  숫자
                </Text>
                <Text style={[styles.requirement, validation.errors.specialChar && styles.requirementError]}>
                  특수문자
                </Text>
              </View>
            )}
          </View>

          {/* 변경하기 버튼 */}
          <TouchableOpacity 
            style={[styles.changeButton, isLoading && styles.changeButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.changeButtonText}>변경하기</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NewPassword;

