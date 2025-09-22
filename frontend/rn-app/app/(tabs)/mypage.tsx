import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

const MyPage = () => {
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      '로그아웃',
      '정말로 로그아웃 하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '확인',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ],
      { cancelable: false }
    );
  };

  const menuItems = [
    { title: '프로필 수정', onPress: () => router.push('/profile-edit') },
    { title: '비밀번호 변경', onPress: () => router.push('/change-password') },
    { title: '설정', onPress: () => router.push('/settings') },
    { title: '로그아웃', onPress: handleLogout },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
      </View>
      <View style={styles.content}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
            <Text style={styles.menuItemText}>{item.title}</Text>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#a5a5a5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuItemText: {
    fontSize: 16,
    color: '#1a202c',
  },
  arrowIcon: {
    fontSize: 18,
    color: '#A0AEC0',
  },
});

export default MyPage;
