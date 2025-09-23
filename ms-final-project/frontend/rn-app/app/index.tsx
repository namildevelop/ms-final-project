import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text } from 'react-native';

export default function Index() {
  const router = useRouter();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      // 임시로 메인 화면으로 바로 이동 (회원가입 우회)
      router.replace('/(tabs)');
    }, 100);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>로딩 중...</Text>
    </View>
  );
}
