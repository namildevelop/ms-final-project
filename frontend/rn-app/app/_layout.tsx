import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack 
        screenOptions={{
          headerShown: false,
        }}
      >
                         <Stack.Screen name="login" />
                 <Stack.Screen name="signup" />
                 <Stack.Screen name="signup-verify" />
                 <Stack.Screen name="additional-info" />
                 <Stack.Screen name="main" />
                 <Stack.Screen name="create-trip" />
                 <Stack.Screen name="trip-preferences" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
