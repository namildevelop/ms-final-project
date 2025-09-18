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
        <Stack.Screen name="login/index" />
        <Stack.Screen name="signup/index" />
        <Stack.Screen name="signup-verify/index" />
        <Stack.Screen name="additional-info/index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="create-trip/index" />
        <Stack.Screen name="trip-preferences/index" />
        <Stack.Screen name="ai-planning/index" />
        <Stack.Screen name="invite-friends/index" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="profile-edit/index" />
        <Stack.Screen name="trip-itinerary/[tripId]" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
