import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Modal, TextInput, SafeAreaView, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Alert, Animated
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

interface ChatMessage {
  id: string | number;
  message: string;
  is_from_gpt: boolean;
  sender?: {
    id: string | number;
    nickname: string;
  };
}

interface TripDetails {
  plans?: Array<{
    content?: {
      itinerary?: Array<{
        date: string;
        day: number;
        activities: Array<{
          location: string;
          time: string;
          description: string;
        }>;
      }>;
    };
  }>;
  title: string;
  start_date: string;
  end_date: string;
  chats?: ChatMessage[];
}

const { width } = Dimensions.get('window');

export default function TripItineraryPage() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { user, token, getTripDetails } = useAuth();

  const [tripData, setTripData] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'chat'>('schedule');
  const [selectedDate, setSelectedDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isGptActive, setIsGptActive] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const chatFlatListRef = useRef<FlatList>(null);

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0];

  useEffect(() => {
    if (typeof tripId !== 'string') return;

    const fetchTripData = async () => {
      setIsLoading(true);
      const data = await getTripDetails(tripId);
      if (data) {
        setTripData(data);
        setChatMessages(data.chats || []);
        if (data.plans?.[0]?.content?.itinerary?.[0]?.date) {
          setSelectedDate(data.plans[0].content.itinerary[0].date);
        }
      } else {
        Alert.alert("오류", "여행 정보를 불러오는데 실패했습니다.");
        router.back();
      }
      setIsLoading(false);
    };

    fetchTripData();
  }, [tripId]);

  // WebSocket useEffect
  useEffect(() => {
    if (typeof tripId !== 'string' || !token) return;

    const wsUrl = `ws://localhost:8000/v1/trips/${tripId}/ws?token=${token}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log('Chat WebSocket Connected');
    ws.current.onclose = () => console.log('Chat WebSocket Disconnected');
    ws.current.onerror = (e: Event) => console.error('Chat WebSocket Error:', (e as any).message || e);

    ws.current.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      if (messageData.type === 'chat_message') {
        setChatMessages((prevMessages) => {
          const incomingMessage = messageData.payload;
          // Check if this message is an update to an optimistically added message
          const existingMessageIndex = prevMessages.findIndex(
            (msg) => msg.id === incomingMessage.id
          );

          if (existingMessageIndex > -1) {
            // If an existing message with the same ID is found, replace it
            const newMessages = [...prevMessages];
            newMessages[existingMessageIndex] = incomingMessage;
            return newMessages;
          } else {
            // Otherwise, it's a new message, so add it
            return [...prevMessages, incomingMessage];
          }
        });
      } else if (messageData.type === 'plan_update') {
        console.log("Plan update received, handling silently.");
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [tripId, token]);

  const toggleMenu = () => {
    if (isMenuOpen) {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsMenuOpen(false));
    } else {
      setIsMenuOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setIsMenuOpen(false));
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !ws.current || !user) return; // Ensure user is available

    const messageType = isGptActive ? 'gpt_prompt' : 'chat_message';
    const payload = { [isGptActive ? 'user_prompt' : 'message']: chatInput };

    // Optimistically add user's message to chat
    const tempId = Date.now() + Math.random(); // Unique temporary ID
    const newMessage: ChatMessage = {
      id: tempId, // Temporary ID
      message: chatInput,
      is_from_gpt: false,
      sender: {
        id: user.id,
        nickname: user.nickname, // Assuming user object has nickname
      },
      // Add other necessary fields like created_at if needed, or let backend fill it
    };
    setChatMessages((prevMessages) => [...prevMessages, newMessage]);

    ws.current.send(JSON.stringify({ type: messageType, payload }));
    setChatInput('');
  };

  if (isLoading || !tripData) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  const { plans, title, start_date, end_date } = tripData;
  const itinerary = plans?.[0]?.content?.itinerary || [];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const getCurrentDay = () => {
    const selectedDateObj = itinerary.find(d => d.date === selectedDate);
    return selectedDateObj ? `Day ${selectedDateObj.day}` : '';
  };

  const getCurrentSchedule = () => {
    const selectedDateObj = itinerary.find(d => d.date === selectedDate);
    return selectedDateObj ? selectedDateObj.activities : [];
  };

  const renderScheduleTab = () => (
    <View style={styles.scheduleContent}>
      <View style={styles.dateSection}>
        <View style={styles.dateSelector}>
          <TouchableOpacity style={styles.dateDropdown} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{selectedDate}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.dayText}>{getCurrentDay()}</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.editRouteText}>여행 동선 편집하기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <Text style={styles.mapPlaceholderText}>지도 준비중</Text>
      </View>

      <FlatList
        data={getCurrentSchedule()}
        keyExtractor={(item, index) => `${item.location}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.scheduleItem}>
            <View style={styles.scheduleInfo}>
              <Text style={styles.locationText}>{item.location}</Text>
              <Text style={styles.timeText}>{item.time} {item.description}</Text>
            </View>
            <TouchableOpacity style={styles.detailButton}>
              <Text style={styles.detailButtonText}>네비 연결</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={showDatePicker} transparent={true} animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>날짜 선택</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
            </View>
            {itinerary.map((tripDate, index) => (
              <TouchableOpacity key={index} style={[styles.dateOption, selectedDate === tripDate.date && styles.selectedDateOption]} onPress={() => handleDateSelect(tripDate.date)}>
                <Text style={[styles.dateOptionText, selectedDate === tripDate.date && styles.selectedDateOptionText]}>{tripDate.date}</Text>
                <Text style={[styles.dateOptionDay, selectedDate === tripDate.date && styles.selectedDateOptionDay]}>{`Day ${tripDate.day}`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const renderChatTab = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={100}>
      <FlatList
        ref={chatFlatListRef}
        data={chatMessages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
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

      {/* Side Menu */}
      {isMenuOpen && (
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={closeMenu}
          activeOpacity={1}
        />
      )}
      <Animated.View 
        style={[
          styles.slideMenu,
          {
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <View style={styles.menuHeader}>
          <TouchableOpacity onPress={closeMenu}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.menuContent}>
          <TouchableOpacity style={styles.menuItem} onPress={() => {
            closeMenu();
            router.push({ pathname: '/invite-friends', params: { tripId } });
          }}>
            <Text style={styles.menuText}>친구 초대하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>준비물 체크하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>지역/기간 수정하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>여행 동선 편집하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>여행 삭제하기</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.leaveTripContainer}>
          <TouchableOpacity style={styles.leaveTripButton}>
            <Text style={styles.leaveTripText}>이번 여행에서 나가기</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { fontSize: 24, color: '#333' },
  headerTitle: { alignItems: 'center' },
  regionText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  dateRangeText: { fontSize: 14, color: '#666', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 15 },
  actionButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { fontSize: 18 },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 16, color: '#666' },
  activeTabText: { color: '#007AFF', fontWeight: 'bold' },
  scheduleContent: { flex: 1, padding: 20 },
  dateSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateDropdown: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  dateText: { fontSize: 16, color: '#333' },
  dropdownArrow: { fontSize: 16, color: '#666' },
  dayText: { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  editRouteText: { fontSize: 14, color: '#007AFF' },
  mapContainer: { width: '100%', height: 200, backgroundColor: '#f8f9fa', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#e9ecef' },
  mapPlaceholderText: { fontSize: 16, color: '#6c757d' },
  scheduleItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20, backgroundColor: '#f8f9fa', borderRadius: 12, marginBottom: 10 },
  scheduleInfo: { flex: 1 },
  locationText: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 4 },
  timeText: { fontSize: 14, color: '#666' },
  detailButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  detailButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, width: '80%', padding: 20, alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeButton: { fontSize: 24, color: '#666' },
  dateOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 15, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  selectedDateOption: { backgroundColor: '#e0f7fa', borderRadius: 8, borderWidth: 1, borderColor: '#007AFF' },
  dateOptionText: { fontSize: 16, color: '#333' },
  selectedDateOptionText: { color: '#007AFF', fontWeight: 'bold' },
  dateOptionDay: { fontSize: 14, color: '#666' },
  selectedDateOptionDay: { color: '#007AFF', fontWeight: 'bold' },
  chatContent: { flex: 1, backgroundColor: '#fff' },
  chatMessages: { flex: 1, padding: 10 },
  myMessageContainer: { alignSelf: 'flex-end', marginBottom: 10, alignItems: 'flex-end' },
  myMessageBubble: { backgroundColor: '#007AFF', borderRadius: 15, paddingVertical: 10, paddingHorizontal: 15, maxWidth: '80%' },
  myMessageText: { color: '#fff', fontSize: 14 },
  otherMessageContainer: { alignSelf: 'flex-start', marginBottom: 10, alignItems: 'flex-start' },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  profileImage: { width: 25, height: 25, borderRadius: 12.5, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  profileText: { fontSize: 14, color: '#333' },
  nicknameText: { fontSize: 14, color: '#666' },
  otherMessageBubble: { backgroundColor: '#f0f0f0', borderRadius: 15, paddingVertical: 10, paddingHorizontal: 15, maxWidth: '80%' },
  otherMessageText: { fontSize: 14, color: '#333' },
  gptMessageBubble: {
    backgroundColor: '#e0f7fa', // A light blue/cyan color for distinction
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    maxWidth: '80%',
  },
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
  // Side Menu Styles
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  slideMenu: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 300,
    backgroundColor: '#ffffff',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  menuContent: {
    paddingTop: 20,
  },
  menuItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuText: {
    fontSize: 16,
    color: '#1a202c',
  },
  leaveTripContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  leaveTripButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  leaveTripText: {
    fontSize: 16,
    color: '#e53e3e',
    textAlign: 'center',
  },
});