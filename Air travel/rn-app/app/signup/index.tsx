import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './styles';
import { getApiUrl, API_ENDPOINTS } from '../../lib/api';

const Signup: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 체크박스 상태
  const [ageCheck, setAgeCheck] = useState(false);
  const [termsCheck, setTermsCheck] = useState(false);
  const [privacyCheck, setPrivacyCheck] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('이메일을 입력해주세요.');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('올바른 이메일 형식을 입력해주세요.');
      return false;
    } else {
      setEmailError('');
      return true;
    }
  };

  const validatePassword = (password: string, confirmPassword: string) => {
    if (!password) {
      setPasswordError('비밀번호를 입력해주세요.');
      return false;
    } else if (password.length < 6) {
      setPasswordError('비밀번호는 6자 이상이어야 합니다.');
      return false;
    } else if (password !== confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return false;
    } else {
      setPasswordError('');
      return true;
    }
  };

  const handleSignup = async () => {
    // 유효성 검사
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password, confirmPassword);
    
    if (!ageCheck) {
      Alert.alert('알림', '만 14세 이상임을 확인해주세요.');
      return;
    }
    
    if (!termsCheck) {
      Alert.alert('알림', '이용약관에 동의해주세요.');
      return;
    }
    
    if (!privacyCheck) {
      Alert.alert('알림', '개인정보 수집 및 이용에 동의해주세요.');
      return;
    }

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      // 백엔드 API 호출 - 회원가입
      const response = await fetch(`${getApiUrl()}${API_ENDPOINTS.signup}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          password_confirm: confirmPassword,
          name: email.split('@')[0], // 임시 이름 (이메일에서 추출)
          student_id: null, // 필수 필드 추가
          birthdate: null,
          nickname: null,
          phone: null,
          address: null,
          gender: null,
          mbti: null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('회원가입 성공!', data);
        Alert.alert('성공', '회원가입이 완료되었습니다. 이메일 인증이 필요합니다.');
        // 이메일 인증 화면으로 이동
        router.push({
          pathname: '/signup-verify',
          params: { email }
        });
      } else {
        Alert.alert('오류', data.detail || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      Alert.alert('오류', '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    console.log('뒤로가기');
    router.back();
  };

  const handleViewTerms = () => {
    Alert.alert('이용약관', '이용약관 내용이 여기에 표시됩니다.');
  };

  const handleViewPrivacy = () => {
    Alert.alert('개인정보 수집 및 이용', '개인정보 수집 및 이용 내용이 여기에 표시됩니다.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목 */}
        <Text style={styles.title}>가입하기</Text>
        
        {/* 이메일 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>이메일</Text>
          <TextInput
            style={styles.inputField}
            placeholder="이메일을 입력하세요."
            placeholderTextColor="#999"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (emailError) validateEmail(text);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {emailError ? <Text style={styles.errorMessage}>{emailError}</Text> : null}
        </View>
        
        {/* 비밀번호 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>비밀번호</Text>
          <TextInput
            style={styles.inputField}
            placeholder="비밀번호를 입력하세요."
            placeholderTextColor="#999"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) validatePassword(text, confirmPassword);
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.inputField}
            placeholder="비밀번호를 한번 더 입력하세요."
            placeholderTextColor="#999"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (passwordError) validatePassword(password, text);
            }}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {passwordError ? <Text style={styles.errorMessage}>{passwordError}</Text> : null}
        </View>
        
        {/* 약관 동의 */}
        <View style={styles.checkboxContainer}>
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setAgeCheck(!ageCheck)}
          >
            <View style={[styles.checkbox, ageCheck && styles.checkboxChecked]}>
              {ageCheck && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>만 14세 이상입니다.</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setTermsCheck(!termsCheck)}
          >
            <View style={[styles.checkbox, termsCheck && styles.checkboxChecked]}>
              {termsCheck && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>이용약관</Text>
            <TouchableOpacity onPress={handleViewTerms}>
              <Text style={styles.linkText}>보기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setPrivacyCheck(!privacyCheck)}
          >
            <View style={[styles.checkbox, privacyCheck && styles.checkboxChecked]}>
              {privacyCheck && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>개인정보 수집 및 이용동의</Text>
            <TouchableOpacity onPress={handleViewPrivacy}>
              <Text style={styles.linkText}>보기</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* 버튼 영역 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
          onPress={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.signupButtonText}>가입하기</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Text style={styles.backButtonText}>뒤로가기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Signup;
