import React, { useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './styles';

interface NotificationItem {
  id: string;
  type: 'invite' | 'day_before' | 'hour_before';
  title: string;
  message: string;
  actionable?: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    type: 'invite',
    title: '여행 초대 알림',
    message: '{닉네임}님께서 여행에 초대했습니다.',
    actionable: true,
  },
  {
    id: 'n2',
    type: 'day_before',
    title: '여행 하루 전 입니다.',
    message: '{닉네임}님 준비물은 다 챙기셨나요?',
  },
  {
    id: 'n3',
    type: 'hour_before',
    title: '출발 1시간 전 입니다.',
    message: "{닉네임}님 신분증, 여권 등 꼭 필요한 소지품은 빠뜨리지 않으셨나요?",
  },
];

const NotificationsScreen: React.FC = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
        {notifications.map(n => (
          <View key={n.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{n.title}</Text>
              {n.type === 'invite' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionButton, styles.primary]} onPress={() => removeNotification(n.id)}>
                    <Text style={styles.primaryText}>참가하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.secondary]} onPress={() => removeNotification(n.id)}>
                    <Text style={styles.secondaryText}>거절</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <Text style={styles.cardMessage}>{n.message}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

// styles moved to styles.ts

export default NotificationsScreen;


