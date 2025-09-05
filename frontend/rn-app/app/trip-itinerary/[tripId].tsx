import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Modal, TextInput, SafeAreaView, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Alert, Animated, ListRenderItemInfo
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GOOGLE_MAPS_API_KEY } from '@env';
import { styles } from './[tripId].styles'; 

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
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface ChatMessage {
  id: string | number;
  message: string;
  is_from_gpt: boolean;
  sent_to_gpt?: boolean;
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

interface Coordinate {
  latitude: number;
  longitude: number;
}

export default function TripItineraryPage() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { user, token, getTripDetails, deleteItineraryItem } = useAuth();

  const [tripData, setTripData] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'chat'>('schedule');
  const [selectedDay, setSelectedDay] = useState(1);
  
  // Map state
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const mapRef = useRef<MapView>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isGptActive, setIsGptActive] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const chatFlatListRef = useRef<FlatList>(null);

  // Menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0];

  const fetchTripData = useCallback(async () => {
    if (typeof tripId !== 'string') return;
    setIsLoading(true);
    try {
      const data = await getTripDetails(tripId);
      if (data) {
        setTripData(data);
        setChatMessages(data.chats || []);
        // Set initial selected day only once when component loads
        if (data.itinerary_items.length > 0 && tripData === null) {
          const earliestDay = Math.min(...data.itinerary_items.map((item: TripItineraryItem) => item.day));
          setSelectedDay(earliestDay);
        }
      } else {
        setTripData(null);
        setChatMessages([]);
      }
    } catch (error) {
      console.error("Error fetching trip data:", error);
      Alert.alert("오류", "여행 정보를 불러오는데 실패했습니다.", [{ text: "확인", onPress: () => router.back() }]);
    } finally {
      setIsLoading(false);
    }
  }, [tripId, getTripDetails, router]); // tripData removed from dependencies to prevent re-fetching

  useFocusEffect(useCallback(() => { fetchTripData(); }, [fetchTripData]));

  // Update coordinates based on the itinerary from the backend
  useEffect(() => {
    if (!tripData) return;

    const dailyItems = tripData.itinerary_items
      .filter(item => item.day === selectedDay && item.latitude && item.longitude)
      .sort((a, b) => a.order_in_day - b.order_in_day);

    const coords = dailyItems.map(item => ({
      latitude: item.latitude!,
      longitude: item.longitude!,
    }));

    setCoordinates(coords);
  }, [selectedDay, tripData]);

  // Fit map to coordinates when they change or when the tab becomes active
  useEffect(() => {
    if (activeTab === 'schedule' && coordinates.length > 0 && mapRef.current) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [coordinates, activeTab]);

  // WebSocket connection
  useEffect(() => {
    if (typeof tripId !== 'string' || !token) return;
    const wsUrl = `ws://192.168.0.9:8000/v1/trips/${tripId}/ws?token=${token}`;
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
      sent_to_gpt: isGptActive,
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
  const dailyItinerary = itinerary_items.filter(item => item.day === selectedDay).sort((a, b) => a.order_in_day - b.order_in_day);

  const renderScheduleTab = () => {
    const formatTime = (timeStr?: string) => timeStr ? timeStr.substring(0, 5) : '';

    return (
      <View style={styles.scheduleContent}>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: 37.5665,
              longitude: 126.9780,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            {dailyItinerary.map((item) => (
              item.latitude && item.longitude && (
                <Marker
                  key={item.id}
                  coordinate={{
                    latitude: item.latitude,
                    longitude: item.longitude,
                  }}
                  anchor={{ x: 0.5, y: 1 }} // 마커의 하단 중앙에 앵커
                >
                  <View style={styles.markerContainer}>
                    <Text style={styles.markerText}>{item.order_in_day}</Text>
                  </View>
                  <View style={styles.markerPin} />
                </Marker>
              )
            ))}
            {coordinates.length > 1 && (
              <Polyline
                key={`polyline-${selectedDay}`}
                coordinates={coordinates}
                strokeColor="#db4040"
                strokeWidth={3}
              />
            )}
          </MapView>
        </View>
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

        <FlatList
          data={dailyItinerary}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleInfo}>
                <Text style={styles.locationText}>{item.order_in_day}. {item.place_name}</Text>
                <Text style={styles.timeText}>{formatTime(item.start_time)} - {formatTime(item.end_time)}</Text>
                <Text style={styles.descriptionText}>{item.description}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={<View style={styles.centered}><Text>이 날짜의 일정이 없습니다.</Text></View>}
        />
      </View>
    );
  }

  const renderChatTab = () => {
    const renderItem = ({ item }: { item: ChatMessage }) => {
      const isMyMessage = item.sender?.id === user?.id;
    
      if (item.is_from_gpt) {
        return (
          <View style={styles.gptMessageContainer}>
            <View style={styles.gptMessageBubble}>
              <Text style={styles.gptMessageText}>{item.message}</Text>
            </View>
          </View>
        );
      }
    
      const sentToGptTextView = item.sent_to_gpt ? (
        <Text style={[styles.sentToGptText, isMyMessage ? { marginRight: 5 } : { marginLeft: 5 }]}>
          Sent to GPT
        </Text>
      ) : null;
    
      if (isMyMessage) {
        return (
          <View style={styles.myMessageContainer}>
            {sentToGptTextView}
            <View style={styles.myMessageBubble}>
              <Text style={styles.myMessageText}>{item.message}</Text>
            </View>
          </View>
        );
      } else {
        return (
          <View style={styles.otherMessageContainer}>
            <View style={styles.profileSection}>
              <View style={styles.profileImage}><Text style={styles.profileText}>{item.sender?.nickname?.[0]}</Text></View>
              <Text style={styles.nicknameText}>{item.sender?.nickname}</Text>
            </View>
            {sentToGptTextView}
            <View style={styles.otherMessageBubble}>
              <Text style={styles.otherMessageText}>{item.message}</Text>
            </View>
          </View>
        );
      }
    };

    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={170}>
        <FlatList
          ref={chatFlatListRef}
          data={chatMessages}
          keyExtractor={(item: ChatMessage) => item.id.toString()}
          renderItem={renderItem}
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
  }


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

      <View style={{ flex: 1 }}>
        <View style={{ display: activeTab === 'schedule' ? 'flex' : 'none', flex: 1 }}>
          {renderScheduleTab()}
        </View>
        <View style={{ display: activeTab === 'chat' ? 'flex' : 'none', flex: 1 }}>
          {renderChatTab()}
        </View>
      </View>

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
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); router.push({ pathname: '/edit-trip-itinerary', params: { tripId } }); }}>
            <Text style={styles.menuText}>여행 동선 편집하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>여행 삭제하기</Text></TouchableOpacity>
        </View>
        <View style={styles.leaveTripContainer}>
          <TouchableOpacity style={styles.leaveTripButton}><Text style={styles.leaveTripText}>이번 여행에서 나가기</Text></TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

