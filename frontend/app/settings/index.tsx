// 설정 페이지 (알림 설정)
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';

const SettingsPage: React.FC = () => {
  const router = useRouter();
  
  // 알림 설정 상태
  const [dayBeforeNotification, setDayBeforeNotification] = useState(true); // 여행 하루 전 알림 (기본: 켜짐)
  const [hourBeforeNotification, setHourBeforeNotification] = useState(false); // 출발 1시간 전 알림 (기본: 꺼짐)

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>설정</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 알림 설정 */}
      <View style={styles.settingsContainer}>
        {/* 여행 하루 전 알림 */}
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>여행 하루 전 알림 받기</Text>
            <Text style={styles.settingDescription}>
              출발 하루 전 저녁 6시에 알림을 보냅니다.
            </Text>
          </View>
          <Switch
            value={dayBeforeNotification}
            onValueChange={setDayBeforeNotification}
            trackColor={{ false: '#e2e8f0', true: '#3182ce' }}
            thumbColor="#ffffff"
          />
        </View>

        {/* 출발 1시간 전 알림 */}
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>출발 1시간 전 알림 받기</Text>
            <Text style={styles.settingDescription}>
              신분증, 여권 등 꼭 필요한 물건에 대한 알림을 보냅니다.
            </Text>
            <Text style={styles.warningText}>
              '마이페이지 > 프로필 설정'에서 주소가 등록되어야 설정 가능합니다.
            </Text>
          </View>
          <Switch
            value={hourBeforeNotification}
            onValueChange={setHourBeforeNotification}
            trackColor={{ false: '#e2e8f0', true: '#3182ce' }}
            thumbColor="#ffffff"
            disabled={true} // 주소 등록 전까지 비활성화
          />
        </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#4a5568',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
  },
  placeholder: {
    width: 40,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingInfo: {
    flex: 1,
    marginRight: 20,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
    marginBottom: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#e53e3e',
    lineHeight: 16,
  },
});

export default SettingsPage;
