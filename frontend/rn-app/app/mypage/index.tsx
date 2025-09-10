import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { styles } from './styles';
import { useRouter } from 'expo-router';
import HomeOffIcon from '../../assets/homeofficon.svg';
import HomeOnIcon from '../../assets/homeonicon.svg';
import BookOnIcon from '../../assets/bookonicon.svg';
import BookOffIcon from '../../assets/bookofficon.svg';
import UserOnIcon from '../../assets/useronicon.svg';
import UserOffIcon from '../../assets/userofficon.svg';

const MyPage: React.FC = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>마이페이지</Text>
      </View>
      
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.menuText}>설정</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/edit-profile')}
        >
          <Text style={styles.menuText}>프로필 설정</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/change-password')}
        >
          <Text style={styles.menuText}>비밀번호 변경</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => {
            // 로그아웃 로직 (예: 로그인 페이지로 이동)
            router.push('/login');
          }}
        >
          <Text style={styles.menuText}>로그아웃</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/main')}
        >
          <HomeOffIcon width={24} height={24} />
          <Text style={styles.navLabel}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/diary')}
        >
          <BookOffIcon width={24} height={24} />
          <Text style={styles.navLabel}>일기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <UserOnIcon width={24} height={24} />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>마이페이지</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// styles moved to styles.ts

export default MyPage;
