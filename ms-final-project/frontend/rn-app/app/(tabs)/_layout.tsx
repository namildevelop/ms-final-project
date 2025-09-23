import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 90, 
          paddingTop: 10,
          paddingBottom: 30,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 24, marginBottom: -3 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '일기',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 24, marginBottom: -3 }}>📖</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ color, focused }) => (
            <Text style={{ color, fontSize: 24, marginBottom: -3 }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}
