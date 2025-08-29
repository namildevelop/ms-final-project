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
import { styles } from './_styles';
import { useAuth } from '../../src/context/AuthContext';

const Signup: React.FC = () => {
  const router = useRouter();
  const { signup } = useAuth();
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 체크박스 상태
  const [ageCheck, setAgeCheck] = useState(false);
  const [termsCheck, setTermsCheck] = useState(false);
  const [privacyCheck, setPrivacyCheck] = useState(false);

  const validateNickname = (nickname: string) => {
    if (!nickname) {
      setNicknameError('닉네임을 입력해주세요.');
      return false;
    } else if (nickname.length < 2) {
      setNicknameError('닉네임은 2자 이상이어야 합니다.');
      return false;
    } else {
      setNicknameError('');
      return true;
    }
  };

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
    const isNicknameValid = validateNickname(nickname);
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

    if (!isNicknameValid || !isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const success = await signup(email, password, nickname);
      if (success) {
        router.push({
          pathname: '/signup-verify',
          params: { email }
        });
      } else {
        Alert.alert('회원가입 실패', '이미 사용 중인 이메일이거나 서버 오류가 발생했습니다.');
      }
    } catch (error) {
      Alert.alert('회원가입 오류', '알 수 없는 오류가 발생했습니다.');
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
        
        {/* 닉네임 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>닉네임 (필수)</Text>
          <TextInput
            style={styles.inputField}
            placeholder="닉네임을 입력하세요."
            placeholderTextColor="#999"
            value={nickname}
            onChangeText={(text) => {
              setNickname(text);
              if (nicknameError) validateNickname(text);
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {nicknameError ? <Text style={styles.errorMessage}>{nicknameError}</Text> : null}
        </View>
        
        {/* 이메일 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>이메일 (필수)</Text>
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
          <Text style={styles.inputLabel}>비밀번호 (필수)</Text>
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
            autoComplete="off"
            textContentType="oneTimeCode"
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
            autoComplete="off"
            textContentType="oneTimeCode"
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
