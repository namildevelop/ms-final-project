import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Linking } from 'react-native';

export default function Layout() {
  useEffect(() => {
    // 딥링크 처리 (Google OAuth 콜백)
    const handleDeepLink = (url: string) => {
      if (url.includes('airtravel://auth-callback')) {
        // URL에서 access_token과 next 파라미터 추출
        const urlObj = new URL(url);
        const accessToken = urlObj.searchParams.get('access_token');
        const next = urlObj.searchParams.get('next');
        
        console.log('딥링크 수신:', { accessToken, next });
        
        // 여기서 토큰을 저장하고 적절한 화면으로 이동
        if (accessToken) {
          // AsyncStorage에 토큰 저장 (나중에 구현)
          // AsyncStorage.setItem('access_token', accessToken);
          
          // 다음 단계에 따라 화면 이동
          if (next === 'complete_profile') {
            // 추가 정보 입력 화면으로 이동
            // router.push('/additional-info');
          } else {
            // 메인 화면으로 이동
            // router.push('/');
          }
        }
      }
    };

    // 앱이 실행 중일 때 딥링크 처리
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // 앱이 백그라운드에서 딥링크로 열렸을 때 처리
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'AIR TRAVEL' }} />
      <Stack.Screen name="login/index" options={{ title: '로그인' }} />
      <Stack.Screen name="signup/index" options={{ title: '회원가입' }} />
      <Stack.Screen name="signup-verify/index" options={{ title: '이메일 인증' }} />
      <Stack.Screen name="additional-info/index" options={{ title: '추가 정보' }} />
    </Stack>
  );
}
