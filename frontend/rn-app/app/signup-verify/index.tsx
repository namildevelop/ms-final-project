import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { styles } from './styles';

const SignupVerify: React.FC = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [codeInput, setCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isValid = useMemo(() => codeInput.length === 4, [codeInput]);

  const handleComplete = () => {
    if (!isValid) {
      setErrorMsg('4자리 코드를 입력해주세요.');
      return;
    }
    setErrorMsg('');
    Alert.alert('인증 완료', '이메일 인증이 완료되었습니다!', [
      {
        text: '확인',
        onPress: () => {
          router.push('/additional-info');
        },
      },
    ]);
  };

  const handleResend = () => {
    Alert.alert('안내', '인증 메일 재전송 기능은 백엔드 연동 후 제공됩니다.');
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
            <Text style={styles.helperText}>이메일을 확인하신 후 아래에 4자리 코드를 입력하세요.</Text>
            <TextInput
              value={codeInput}
              onChangeText={(t) => setCodeInput(t.replace(/[^0-9]/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="4자리"
              placeholderTextColor="#999"
              style={styles.input}
            />
            {!!errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
          </View>

          <View style={styles.resendWrap}>
            <Text style={styles.resendCaption}>인증메일을 받지 못하셨나요?</Text>
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>메일 다시받기</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <TouchableOpacity onPress={handleComplete} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>이메일 인증완료</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default SignupVerify;
