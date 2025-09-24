import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

interface SearchResultUser {
  id: number;
  email: string;
  nickname: string;
}

const InviteFriendsPage: React.FC = () => {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { token, searchUsers, inviteUser } = useAuth(); // Assuming these will be added to AuthContext

  const [searchEmail, setSearchEmail] = useState('');
  const [results, setResults] = useState<SearchResultUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState<number | null>(null);
  const ws = useRef<WebSocket | null>(null);

  // WebSocket Connection
  useEffect(() => {
    if (typeof tripId !== 'string' || !token) return;

    const apiUrl = process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      Alert.alert("오류", "API URL을 찾을 수 없습니다. 앱 설정을 확인해주세요.");
      router.replace('/main');
      return;
    }

    const wsUrl = `${apiUrl.replace('http', 'ws')}/v1/trips/${tripId}/ws?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log('Invite Friends WebSocket Connected');
    ws.current.onclose = () => console.log('Invite Friends WebSocket Disconnected');
    ws.current.onerror = (e: Event) => console.error('WebSocket Error:', (e as any).message || e);

    ws.current.onmessage = (event) => {
      console.log('Message received on invite page:', event.data);
      // Handle incoming messages if needed, e.g., real-time updates of invited members
    };

    return () => {
      ws.current?.close();
    };
  }, [tripId, token]);

  const handleSearch = async () => {
    if (searchEmail.trim() === '') {
      Alert.alert('오류', '검색할 이메일을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    // This function needs to be implemented in AuthContext
    const users = await searchUsers(searchEmail);
    setResults(users || []);
    setIsLoading(false);
  };

  const handleInvite = async (userToInvite: SearchResultUser) => {
    if (typeof tripId !== 'string') return;
    
    setIsInviting(userToInvite.id);
    // This function needs to be implemented in AuthContext
    const success = await inviteUser(tripId, userToInvite.id);
    setIsInviting(null);

    if (success) {
      Alert.alert('성공', `${userToInvite.nickname}님을 여행에 초대했습니다.`);
    } else {
      Alert.alert('오류', '초대에 실패했습니다. 이미 초대되었거나 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>친구 초대하기</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            placeholder="초대할 친구의 이메일을 입력하세요"
            value={searchEmail}
            onChangeText={setSearchEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>검색</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 20 }} size="large" />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.resultItem}>
                <View style={styles.resultLeft}>
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarEmoji}>👤</Text>
                  </View>
                  <View>
                    <Text style={styles.nickname}>{item.nickname}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.inviteButton} 
                  onPress={() => handleInvite(item)}
                  disabled={isInviting === item.id}
                >
                  {isInviting === item.id ? (
                    <ActivityIndicator color="#3B82F6" />
                  ) : (
                    <Text style={styles.inviteButtonText}>초대하기</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>검색 결과가 없습니다.</Text>}
          />
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
    textAlign: 'left',
    marginLeft: 8,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginRight: 10,
    height: 50,
  },
  searchButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#000000',
  },
  searchButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarPlaceholder: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 18 },
  nickname: {
    fontSize: 16,
    fontWeight: '500',
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  inviteButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    minWidth: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  inviteButtonText: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#999',
  },
});

export default InviteFriendsPage;