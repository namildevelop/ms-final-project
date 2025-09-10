// 친구 초대 페이지 (플레이스홀더)
import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { styles } from './styles';

const InviteFriendsPage: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </View>
        <Text style={styles.title}>친구 초대</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
        <Text style={styles.placeholderText}>친구 초대 페이지</Text>
        <Text style={styles.subText}>내용이 추가될 예정입니다.</Text>
      </View>
    </SafeAreaView>
  );
};

// styles moved to styles.ts

export default InviteFriendsPage;

