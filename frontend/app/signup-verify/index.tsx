import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, Keyboard, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { styles } from './_styles';
import { useAuth } from '../../src/context/AuthContext';

const SignupVerify: React.FC = () => {
  const router = useRouter();
  const auth = useAuth();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [codeInput, setCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const isValid = useMemo(() => codeInput.length === 6, [codeInput]);

  const handleComplete = async () => {
    if (!email) {
        setErrorMsg('이메일 정보가 없습니다. 다시 시도해주세요.');
        return;
    }
    if (!isValid) {
      setErrorMsg('6자리 코드를 입력해주세요.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);

    try {
        const user = await auth.verifySignupCode(email, codeInput);
        if (user) {
            Alert.alert('인증 완료', '회원가입이 완료되었습니다!', [
              {
                text: '확인',
                onPress: () => {
                  if (user.profile_completed) {
                    router.replace('/(tabs)');
                  } else {
                    router.replace('/additional-info');
                  }
                },
              },
            ]);
        } else {
            setErrorMsg('인증에 실패했습니다. 코드를 확인하고 다시 시도해주세요.');
        }
    } catch (error: any) {
        const message = error.response?.data?.detail || '알 수 없는 오류가 발생했습니다.';
        setErrorMsg(message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (isResending || cooldown > 0 || !email) return;

    setIsResending(true);
    Keyboard.dismiss();

    try {
      await auth.resendVerificationCode(email);
      Alert.alert('재전송 완료', '새로운 인증 코드가 이메일로 발송되었습니다.');
      setCooldown(60);
    } catch (error: any) {
      const message = error.response?.data?.detail || '오류가 발생했습니다.';
      Alert.alert('재전송 실패', message);
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
              {email}로{"\n"}인증 메일이 전송됐습니다.
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
            <TouchableOpacity onPress={handleResend} disabled={isResending || cooldown > 0}>
              <Text style={styles.resendLink}>
                {isResending
                  ? '전송 중...'
                  : cooldown > 0
                  ? `메일 다시받기 (${cooldown}초)`
                  : '메일 다시받기'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <TouchableOpacity onPress={handleComplete} style={styles.primaryBtn} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>이메일 인증완료</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default SignupVerify;
