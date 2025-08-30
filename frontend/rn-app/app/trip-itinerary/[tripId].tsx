import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Modal, TextInput, SafeAreaView, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Alert, Animated, ListRenderItemInfo
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { SwipeListView } from 'react-native-swipe-list-view';

// --- Interfaces ---
interface TripItineraryItem {
  id: number;
  trip_id: number;
  day: number;
  order_in_day: number;
  place_name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
}

interface ChatMessage {
  id: string | number;
  message: string;
  is_from_gpt: boolean;
  sender?: { id: string | number; nickname: string; };
}

interface TripDetails {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  itinerary_items: TripItineraryItem[];
  chats?: ChatMessage[];
}

const { width } = Dimensions.get('window');

export default function TripItineraryPage() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { user, token, getTripDetails, deleteItineraryItem } = useAuth();

  const [tripData, setTripData] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'chat'>('schedule');
  const [selectedDay, setSelectedDay] = useState(1);

  // Chat state (preserved)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isGptActive, setIsGptActive] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const chatFlatListRef = useRef<FlatList>(null);

  // Menu state (preserved)
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0];

  const fetchTripData = useCallback(async () => {
    if (typeof tripId !== 'string') return;
    setIsLoading(true);
    try {
      const data = await getTripDetails(tripId);
      if (data && data.itinerary_items) {
        setTripData(data);
        setChatMessages(data.chats || []);
        if (data.itinerary_items.length > 0) {
          const earliestDay = Math.min(...data.itinerary_items.map((item: TripItineraryItem) => item.day));
          setSelectedDay(earliestDay);
        }
      } else {
        setTripData(data);
        setChatMessages(data.chats || []);
      }
    } catch (error) {
      console.error("Error fetching trip data:", error);
      Alert.alert("오류", "여행 정보를 불러오는데 실패했습니다.", [{ text: "확인", onPress: () => router.back() }]);
    }
    setIsLoading(false);
  }, [tripId, getTripDetails, router]);

  useEffect(() => {
    fetchTripData();
  }, [fetchTripData]);

  useEffect(() => {
    if (typeof tripId !== 'string' || !token) return;
    const wsUrl = `ws://localhost:8000/v1/trips/${tripId}/ws?token=${token}`;
    ws.current = new WebSocket(wsUrl);
    ws.current.onopen = () => console.log('WebSocket Connected');
    ws.current.onclose = () => console.log('WebSocket Disconnected');
    ws.current.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      if (messageData.type === 'chat_message') {
        setChatMessages((prev) => [...prev, messageData.payload]);
      } else if (messageData.type === 'plan_update') {
        Alert.alert("일정 업데이트", "GPT에 의해 여행 일정이 업데이트되었습니다.");
        fetchTripData();
      }
    };
    return () => ws.current?.close();
  }, [tripId, token, fetchTripData]);

  const handleDeleteItem = (itemToDelete: TripItineraryItem) => {
    if (typeof tripId !== 'string') return;
    Alert.alert(
      "일정 삭제",
      `'${itemToDelete.place_name}' 일정을 정말로 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const result = await deleteItineraryItem(tripId, itemToDelete.id);
            if (result) {
              fetchTripData();
            } else {
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: false }).start(() => setIsMenuOpen(false));
    } else {
      setIsMenuOpen(true);
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
    }
  };
  const closeMenu = () => {
    Animated.timing(slideAnim, { toValue: 300, duration: 300, useNativeDriver: false }).start(() => setIsMenuOpen(false));
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !ws.current || !user) return;

    const messageType = isGptActive ? 'gpt_prompt' : 'chat_message';
    const payload = { [isGptActive ? 'user_prompt' : 'message']: chatInput };

    const tempId = Date.now() + Math.random();
    const newMessage: ChatMessage = {
      id: tempId,
      message: chatInput,
      is_from_gpt: false,
      sender: {
        id: user.id,
        nickname: user.nickname,
      },
    };
    setChatMessages((prevMessages) => [...prevMessages, newMessage]);

    ws.current.send(JSON.stringify({ type: messageType, payload }));
    setChatInput('');
  };

  if (isLoading || !tripData) {
    return <SafeAreaView style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#007AFF" /></SafeAreaView>;
  }

  const { title, start_date, end_date, itinerary_items = [] } = tripData;
  const uniqueDays = [...new Set(itinerary_items.map(item => item.day))].sort((a, b) => a - b);

  const renderScheduleTab = () => (
    <View style={styles.scheduleContent}>
      <View style={styles.dateSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {uniqueDays.map(day => (
            <TouchableOpacity 
              key={day}
              style={[styles.dayButton, selectedDay === day && styles.activeDayButton]}
              onPress={() => setSelectedDay(day)}
            >
              <Text style={[styles.dayButtonText, selectedDay === day && styles.activeDayButtonText]}>{`Day ${day}`}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <SwipeListView
        data={itinerary_items.filter((item: TripItineraryItem) => item.day === selectedDay).sort((a: TripItineraryItem, b: TripItineraryItem) => a.order_in_day - b.order_in_day)}
        keyExtractor={(item: TripItineraryItem) => item.id.toString()}
        renderItem={(data: ListRenderItemInfo<TripItineraryItem>) => (
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleInfo}>
              <Text style={styles.locationText}>{data.item.order_in_day}. {data.item.place_name}</Text>
              <Text style={styles.timeText}>{data.item.start_time} - {data.item.end_time}</Text>
              <Text style={styles.descriptionText}>{data.item.description}</Text>
            </View>
          </View>
        )}
        renderHiddenItem={(data: ListRenderItemInfo<TripItineraryItem>) => (
          <View style={styles.rowBack}>
            <TouchableOpacity
              style={[styles.backRightBtn, styles.backRightBtnRight]}
              onPress={() => handleDeleteItem(data.item)}
            >
              <Text style={styles.backTextWhite}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
        rightOpenValue={-75}
        disableRightSwipe
        ListEmptyComponent={<View style={styles.centered}><Text>이 날짜의 일정이 없습니다.</Text></View>}
      />
    </View>
  );

  const renderChatTab = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={100}>
      <FlatList
        ref={chatFlatListRef}
        data={chatMessages}
        keyExtractor={(item: ChatMessage) => item.id.toString()}
        renderItem={({ item }: { item: ChatMessage }) => {
          const isMyMessage = item.sender?.id === user?.id;
          if (item.is_from_gpt) {
            return (
              <View style={styles.otherMessageContainer}>
                <View style={styles.profileSection}>
                  <View style={styles.profileImage}><Text style={styles.profileText}>G</Text></View>
                  <Text style={styles.nicknameText}>GPT</Text>
                </View>
                <View style={styles.gptMessageBubble}>
                  <Text style={styles.otherMessageText}>{item.message}</Text>
                </View>
              </View>
            );
          }
          return (
            <View style={isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer}>
              {!isMyMessage && (
                <View style={styles.profileSection}>
                  <View style={styles.profileImage}><Text style={styles.profileText}>{item.sender?.nickname?.[0]}</Text></View>
                  <Text style={styles.nicknameText}>{item.sender?.nickname}</Text>
                </View>
              )}
              <View style={isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble}>
                <Text style={isMyMessage ? styles.myMessageText : styles.otherMessageText}>{item.message}</Text>
              </View>
            </View>
          );
        }}
        style={styles.chatMessages}
        onContentSizeChange={() => chatFlatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => chatFlatListRef.current?.scrollToEnd({ animated: false })}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity style={[styles.gptButton, isGptActive && styles.gptButtonActive]} onPress={() => setIsGptActive(!isGptActive)}>
          <Text style={[styles.gptButtonText, isGptActive && styles.gptButtonTextActive]}>GPT</Text>
        </TouchableOpacity>
        <View style={[styles.messageInputContainer, isGptActive && styles.messageInputContainerActive]}>
          <TextInput
            style={styles.messageInput}
            placeholder={isGptActive ? "GPT에게 요청해보세요." : "메시지 입력"}
            placeholderTextColor="#999"
            value={chatInput}
            onChangeText={setChatInput}
            multiline
          />
        </View>
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
          <Text style={styles.sendButtonText}>✈️</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backButton}>←</Text></TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.regionText}>{title}</Text>
          <Text style={styles.dateRangeText}>{start_date} - {end_date}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}><Text style={styles.actionButtonText}>📷</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={toggleMenu}><Text style={styles.actionButtonText}>☰</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'schedule' && styles.activeTab]} onPress={() => setActiveTab('schedule')}>
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>일정</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.activeTab]} onPress={() => setActiveTab('chat')}>
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>채팅</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'schedule' ? renderScheduleTab() : renderChatTab()}

      {isMenuOpen && <TouchableOpacity style={styles.overlay} onPress={closeMenu} activeOpacity={1} />}
      <Animated.View style={[styles.slideMenu, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.menuHeader}>
          <TouchableOpacity onPress={closeMenu}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
        </View>
        <View style={styles.menuContent}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); router.push({ pathname: '/invite-friends', params: { tripId } }); }}>
            <Text style={styles.menuText}>친구 초대하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>준비물 체크하기</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>지역/기간 수정하기</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>여행 동선 편집하기</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>여행 삭제하기</Text></TouchableOpacity>
        </View>
        <View style={styles.leaveTripContainer}>
          <TouchableOpacity style={styles.leaveTripButton}><Text style={styles.leaveTripText}>이번 여행에서 나가기</Text></TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { fontSize: 24, color: '#333' },
  headerTitle: { alignItems: 'center' },
  regionText: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  dateRangeText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 15 },
  actionButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { fontSize: 18 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 16, color: '#6B7280' },
  activeTabText: { color: '#3B82F6', fontWeight: '600' },
  scheduleContent: { flex: 1 },
  dateSection: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dayButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E5E7EB', marginRight: 10 },
  activeDayButton: { backgroundColor: '#3B82F6' },
  dayButtonText: { color: '#374151', fontWeight: '500' },
  activeDayButtonText: { color: '#FFFFFF' },
  scheduleItem: { backgroundColor: '#FFFFFF', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  scheduleInfo: { flex: 1 },
  locationText: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  timeText: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  descriptionText: { fontSize: 14, color: '#4B5563' },
  rowBack: { alignItems: 'center', backgroundColor: '#EF4444', flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backRightBtn: { alignItems: 'center', bottom: 0, justifyContent: 'center', position: 'absolute', top: 0, width: 75 },
  backRightBtnRight: { backgroundColor: '#EF4444', right: 0 },
  backTextWhite: { color: '#FFF', fontWeight: '600' },
  chatMessages: { flex: 1, padding: 10 },
  myMessageContainer: { alignSelf: 'flex-end', marginBottom: 10, alignItems: 'flex-end' },
  otherMessageContainer: { alignSelf: 'flex-start', marginBottom: 10, alignItems: 'flex-start' },
  myMessageBubble: { backgroundColor: '#007AFF', borderRadius: 15, paddingVertical: 10, paddingHorizontal: 15, maxWidth: '80%' },
  otherMessageBubble: { backgroundColor: '#f0f0f0', borderRadius: 15, paddingVertical: 10, paddingHorizontal: 15, maxWidth: '80%' },
  myMessageText: { color: '#fff', fontSize: 14 },
  otherMessageText: { fontSize: 14, color: '#333' },
  gptMessageBubble: { backgroundColor: '#e0f7fa', borderRadius: 15, paddingVertical: 10, paddingHorizontal: 15, maxWidth: '80%' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 15, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  gptButton: { backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, height: 40, justifyContent: 'center' },
  gptButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  gptButtonText: { color: '#666', fontSize: 14, fontWeight: '500' },
  gptButtonTextActive: { color: '#fff' },
  messageInputContainer: { flex: 1, backgroundColor: '#f0f0f0', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, minHeight: 40, justifyContent: 'center' },
  messageInputContainerActive: { backgroundColor: '#e0f7fa', borderWidth: 1, borderColor: '#007AFF' },
  messageInput: { fontSize: 14, color: '#333', padding: 0 },
  sendButton: { backgroundColor: '#007AFF', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, height: 40, justifyContent: 'center' },
  sendButtonText: { fontSize: 18, color: '#fff' },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  profileImage: { width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  profileText: { fontSize: 14, color: '#333' },
  nicknameText: { fontSize: 14, color: '#666' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000 },
  slideMenu: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 300, backgroundColor: '#ffffff', zIndex: 1001, shadowColor: '#000', shadowOffset: { width: -2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  menuHeader: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  closeButton: { fontSize: 24, color: '#666' },
  menuContent: { paddingTop: 20 },
  menuItem: { paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuText: { fontSize: 16, color: '#1a202c' },
  leaveTripContainer: { position: 'absolute', bottom: 50, left: 20, right: 20 },
  leaveTripButton: { paddingVertical: 15, paddingHorizontal: 20, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  leaveTripText: { fontSize: 16, color: '#e53e3e', textAlign: 'center' },
});
