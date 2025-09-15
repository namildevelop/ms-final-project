import React from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { styles } from './email-sent-styles';

const EmailSent: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;

  const handleChangePassword = () => {
    // 실제로는 이메일 링크를 통해 토큰을 받아서 처리
    // 개발용으로 직접 새 비밀번호 입력 화면으로 이동
    router.push({
      pathname: '/forgot-password/new-password',
      params: { token: 'dev-token' } // 개발용 토큰
    });
  };

  const handleResendEmail = () => {
    // 이메일 재전송 로직 (추후 구현)
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 이메일 아이콘 */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📧</Text>
        </View>

        {/* 제목 */}
        <Text style={styles.title}>Air Travel 새 비밀번호 변경 메일</Text>

        {/* 메시지 */}
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>새 비밀번호로 변경하세요.</Text>
          <Text style={styles.subMessageText}>
            {email}로 비밀번호 재설정 링크를 보내드렸습니다.
          </Text>
        </View>

        {/* 변경하기 버튼 */}
        <TouchableOpacity 
          style={styles.changeButton}
          onPress={handleChangePassword}
        >
          <Text style={styles.changeButtonText}>변경하기</Text>
        </TouchableOpacity>

        {/* 추가 안내 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            이메일이 오지 않았다면 스팸 폴더를 확인해보세요.
          </Text>
          <TouchableOpacity onPress={handleResendEmail}>
            <Text style={styles.resendText}>이메일 다시 보내기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EmailSent;

