import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack 
        screenOptions={{
          headerShown: false,
        }}
      >
                         <Stack.Screen name="login" />
                 <Stack.Screen name="signup" />
                 <Stack.Screen name="signup-verify" />
                 <Stack.Screen name="additional-info" />
                 <Stack.Screen name="(tabs)" />
                 <Stack.Screen name="create-trip" />
                 <Stack.Screen name="trip-preferences" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
