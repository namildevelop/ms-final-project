import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function TranslationLayout() {
  useEffect(() => {
    console.log('🟢 TranslationLayout 마운트됨');
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: '통역/번역하기'
        }} 
      />
      <Stack.Screen 
        name="conversation" 
        options={{ 
          headerShown: false,
          title: '대화 통역'
        }} 
      />
      <Stack.Screen 
        name="image" 
        options={{ 
          headerShown: false,
          title: '이미지 번역'
        }} 
      />
    </Stack>
  );
}
