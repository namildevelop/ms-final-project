import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

// Assuming Notification type is defined in AuthContext, if not, define it here
interface Notification {
  id: number;
  message: string;
  type: string;
  status: string;
  created_at: string;
}

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const { getNotifications, acceptInvitation, declineInvitation } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    const fetchedNotifications = await getNotifications();
    setNotifications(fetchedNotifications);
    setIsLoading(false);
  }, [getNotifications]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleAction = async (notificationId: number, action: 'accept' | 'decline') => {
    const success = action === 'accept' 
      ? await acceptInvitation(notificationId)
      : await declineInvitation(notificationId);

    if (success) {
      Alert.alert('성공', `초대를 ${action === 'accept' ? '수락' : '거절'}했습니다.`);
      fetchNotifications(); // Refresh the list
    } else {
      Alert.alert('오류', '작업을 완료하지 못했습니다.');
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <View style={styles.notificationItem}>
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
      {item.type === 'TRIP_INVITATION' && item.status === 'pending' && (
        <View style={styles.actionContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleAction(item.id, 'accept')}
          >
            <Text style={styles.buttonText}>수락</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.declineButton]}
            onPress={() => handleAction(item.id, 'decline')}
          >
            <Text style={styles.buttonText}>거절</Text>
          </TouchableOpacity>
        </View>
      )}
      {item.type === 'TRIP_INVITATION' && item.status !== 'pending' && (
        <Text style={styles.statusText}>
          {item.status === 'accepted' ? '수락됨' : '거절됨'}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>알림</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={<Text style={styles.emptyText}>새로운 알림이 없습니다.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: { padding: 8 },
  backArrow: { fontSize: 24, color: '#4a5568' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a202c' },
  placeholder: { width: 40 },
  listContainer: { padding: 20 },
  notificationItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  message: { fontSize: 16, color: '#1a202c', marginBottom: 8 },
  date: { fontSize: 12, color: '#718096', marginBottom: 10 },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  acceptButton: { backgroundColor: '#007AFF' },
  declineButton: { backgroundColor: '#ff3b30' },
  buttonText: { color: '#ffffff', fontWeight: 'bold' },
  statusText: {
    textAlign: 'right',
    marginTop: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#a0aec0',
  },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
});

export default NotificationsPage;
