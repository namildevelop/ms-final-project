import React from 'react';
import { Tabs } from 'expo-router';
import HomeOn from '../../assets/homeonicon.svg';
import HomeOff from '../../assets/homeofficon.svg';
import BookOn from '../../assets/bookonicon.svg';
import BookOff from '../../assets/bookofficon.svg';
import UserOn from '../../assets/useronicon.svg';
import UserOff from '../../assets/userofficon.svg';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#111111',
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
          tabBarIcon: ({ focused }) => (
            focused ? <HomeOn width={24} height={24} /> : <HomeOff width={24} height={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '일기',
          tabBarIcon: ({ focused }) => (
            focused ? <BookOn width={24} height={24} /> : <BookOff width={24} height={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이페이지',
          tabBarIcon: ({ focused }) => (
            focused ? <UserOn width={24} height={24} /> : <UserOff width={24} height={24} />
          ),
        }}
      />
    </Tabs>
  );
}