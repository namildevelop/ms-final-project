import { Stack } from 'expo-router';
import { useEffect } from 'react';

export default function RootLayout() {
  useEffect(() => {
    console.log('🟢 RootLayout 마운트됨');
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="translation" 
        options={{ 
          headerShown: false,
          presentation: 'card'
        }} 
      />
    </Stack>
  );
}
