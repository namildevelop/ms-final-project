import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, Keyboard, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { styles } from './styles';
import { getApiUrl, API_ENDPOINTS } from '../../lib/api';

const SignupVerify: React.FC = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [codeInput, setCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const isValid = useMemo(() => codeInput.length === 6, [codeInput]); // 6자리로 변경

  // 컴포넌트 마운트 시 인증 코드 요청
  useEffect(() => {
    if (email) {
      requestVerificationCode();
    }
  }, [email]);

  const requestVerificationCode = async () => {
    try {
      const response = await fetch(getApiUrl(API_ENDPOINTS.EMAIL_REQUEST_VERIFY), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('인증 코드 전송 성공:', data);
        if (data.verify_code_dev) {
          Alert.alert('개발용 코드', `인증 코드: ${data.verify_code_dev}`);
        }
      } else {
        console.error('인증 코드 전송 실패:', data);
      }
    } catch (error) {
      console.error('인증 코드 요청 오류:', error);
    }
  };

  const handleComplete = async () => {
    if (!isValid) {
      setErrorMsg('6자리 코드를 입력해주세요.');
      return;
    }
    
    setErrorMsg('');
    setIsLoading(true);

    try {
      // 백엔드 API 호출 - 인증 코드 검증
      const response = await fetch(getApiUrl(API_ENDPOINTS.EMAIL_VERIFY), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: codeInput
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('이메일 인증 성공!', data);
        Alert.alert('인증 완료', '이메일 인증이 완료되었습니다!', [
          {
            text: '확인',
            onPress: () => {
              router.push('/additional-info');
            },
          },
        ]);
      } else {
        setErrorMsg(data.detail || '인증 코드가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('인증 오류:', error);
      setErrorMsg('인증 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await requestVerificationCode();
      Alert.alert('안내', '인증 메일이 재전송되었습니다.');
    } catch (error) {
      Alert.alert('오류', '인증 메일 재전송에 실패했습니다.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>가입하기</Text>

          <View style={styles.subtitleWrap}>
            <Text style={styles.subtitle}>이메일을 인증하세요.</Text>
            <Text style={styles.emailCaption}>
              {email}로{`\n`}인증 메일이 전송됐습니다.
            </Text>
          </View>

          <View style={styles.centerBlock}>
            <Text style={styles.helperText}>이메일을 확인하신 후 아래에 6자리 코드를 입력하세요.</Text>
            <TextInput
              value={codeInput}
              onChangeText={(t) => setCodeInput(t.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="6자리"
              placeholderTextColor="#999"
              style={styles.input}
            />
            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
          </View>

          <View style={styles.resendWrap}>
            <Text style={styles.resendCaption}>인증메일을 받지 못하셨나요?</Text>
            <TouchableOpacity onPress={handleResend} disabled={isResending}>
              <Text style={styles.resendLink}>
                {isResending ? '전송 중...' : '메일 다시받기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <TouchableOpacity 
            onPress={handleComplete} 
            style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.primaryBtnText}>이메일 인증완료</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default SignupVerify;
