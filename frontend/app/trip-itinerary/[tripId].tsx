import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, TextInput, SafeAreaView, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Alert, Animated, Image
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth, PlaceDetails, TripItineraryItem as TripItineraryItemWithGpt } from '../../src/context/AuthContext';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { styles } from './[tripId].styles'; 
import ArIcon from '../../assets/aricon.svg';
import SendOnIcon from '../../assets/sendonicon.svg';
import SendOffIcon from '../../assets/sendofficon.svg';

// --- Interfaces ---
// The TripItineraryItem from context now includes gpt_description
type TripItineraryItem = TripItineraryItemWithGpt;

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
  const { user, token, getTripDetails, deleteItineraryItem, getPlaceDetailsByName, generateGptDescription, leaveTrip } = useAuth();

  const [tripData, setTripData] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'chat'>('schedule');
  const [selectedDay, setSelectedDay] = useState(1);
  
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const mapRef = useRef<MapView>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isGptActive, setIsGptActive] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const chatFlatListRef = useRef<FlatList>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0];
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);

  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TripItineraryItem | null>(null);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isGptDescriptionLoading, setIsGptDescriptionLoading] = useState(false);

  const fetchTripData = useCallback(async () => {
    if (typeof tripId !== 'string') return;
    setIsLoading(true);
    try {
      const data = await getTripDetails(tripId);
      if (data) {
        setTripData(data);
        setChatMessages(data.chats || []);
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
  }, [tripId, getTripDetails, router]);

  useFocusEffect(useCallback(() => { fetchTripData(); }, [fetchTripData]));

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

  useEffect(() => {
    if (activeTab === 'schedule' && coordinates.length > 0 && mapRef.current) {
      // A short delay is added to ensure the map is ready after the view is displayed.
      const timer = setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [coordinates, activeTab]);

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
    ws.current.onopen = () => console.log('WebSocket Connected');
    ws.current.onclose = () => console.log('WebSocket Disconnected');
    ws.current.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      if (messageData.type === 'chat_message') {
        if (messageData.payload.sender.id !== user?.id) {
          setChatMessages((prev) => [...prev, messageData.payload]);
        }
      } else if (messageData.type === 'plan_update') {
        Alert.alert("일정 업데이트", "GPT에 의해 여행 일정이 업데이트되었습니다.");
        fetchTripData();
      }
    };
    return () => ws.current?.close();
  }, [tripId, token, fetchTripData, user?.id]);

  const handleItineraryItemPress = async (item: TripItineraryItem) => {
    setSelectedItem(item);
    setIsDetailModalVisible(true);
    setIsModalLoading(true);
    setPlaceDetails(null);

    try {
      const query = item.place_name || item.address;
      if (query) {
        const details = await getPlaceDetailsByName(query);
        if (details) {
          setPlaceDetails(details);
        } else {
          setPlaceDetails(null); 
          Alert.alert("정보 없음", "Google에서 장소에 대한 상세 정보를 불러올 수 없습니다. 기본 정보만 표시됩니다.");
        }
      } else {
        setPlaceDetails(null);
        Alert.alert("정보 없음", "장소 이름이나 주소가 없어 상세 정보를 조회할 수 없습니다.");
      }
    } catch (error) {
      console.error("Failed to get place details:", error);
      Alert.alert("오류", "상세 정보를 가져오는 중 오류가 발생했습니다.");
    } finally {
      setIsModalLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!selectedItem || typeof tripId !== 'string') return;

    setIsGptDescriptionLoading(true);
    try {
      const updatedItem = await generateGptDescription(tripId, selectedItem.id);
      if (updatedItem && updatedItem.gpt_description) {
        setTripData(prevTripData => {
          if (!prevTripData) return null;
          const newItineraryItems = prevTripData.itinerary_items.map(item => 
            item.id === updatedItem.id ? updatedItem : item
          );
          return { ...prevTripData, itinerary_items: newItineraryItems };
        });
        setSelectedItem(updatedItem);
      } else {
        Alert.alert("오류", "AI 설명 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Failed to generate description:", error);
      Alert.alert("오류", "AI 설명 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGptDescriptionLoading(false);
    }
  };

  const handleLeaveTrip = () => {
    if (typeof tripId !== 'string') return;

    Alert.alert(
      "여행 나가기",
      "정말로 이 여행에서 나가시겠습니까? 이 작업은 되돌릴 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "나가기",
          style: "destructive",
          onPress: async () => {
            const success = await leaveTrip(tripId);
            if (success) {
              Alert.alert("성공", "여행에서 나갔습니다.", [
                { text: "확인", onPress: () => router.push('/(tabs)') }
              ]);
            } else {
              Alert.alert("오류", "여행 나가기에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

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
      sender: { id: user.id, nickname: user.nickname },
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
    const startDateObj = new Date(start_date);
    const currentDate = new Date(startDateObj);
    currentDate.setDate(startDateObj.getDate() + (selectedDay - 1));
    const dateLabel = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2,'0')}-${String(currentDate.getDate()).padStart(2,'0')} (${['일','월','화','수','목','금','토'][currentDate.getDay()]})`;

    return (
      <View style={styles.scheduleContent}>
        {/* 탭 아래, 지도 위 컨트롤 바 */}
        <View style={styles.controlBar}>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowDateModal(true)}>
            <Text style={styles.dropdownText}>{dateLabel}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.dayBadge}>{`Day ${selectedDay}`}</Text>
          <TouchableOpacity style={styles.editPlanLink} onPress={() => router.push({ pathname: '/edit-trip-itinerary', params: { tripId } })}>
            <Text style={styles.editPlanLinkText}>여행 동선 편집하기</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{ latitude: 37.5665, longitude: 126.9780, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }}
          >
            {dailyItinerary.map((item) => (
              item.latitude && item.longitude && (
                <Marker
                  key={item.id}
                  coordinate={{ latitude: item.latitude, longitude: item.longitude }}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <View style={styles.markerContainer}><Text style={styles.markerText}>{item.order_in_day}</Text></View>
                  <View style={styles.markerPin} />
                </Marker>
              )
            ))}
            {coordinates.length > 1 && (
              <Polyline key={`polyline-${selectedDay}`} coordinates={coordinates} strokeColor="#db4040" strokeWidth={3} />
            )}
          </MapView>
        </View>
        

        <FlatList
          data={dailyItinerary}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleItineraryItemPress(item)}>
              <View style={styles.scheduleItem}>
                <View style={styles.scheduleInfo}>
                  <View style={styles.itemHeaderRow}>
                    <View>
                      <Text style={styles.locationText}>{item.order_in_day}. {item.place_name}</Text>
                      <Text style={styles.timeText}>{formatTime(item.start_time)} - {formatTime(item.end_time)}</Text>
                    </View>
                    <TouchableOpacity style={styles.navButton} onPress={() => {}}>
                      <Text style={styles.navButtonText}>네비 연결</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.descriptionText}>{item.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
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
          <View style={styles.otherMessageContainer}>
            <View style={styles.profileSection}>
              <Image 
                source={require('../../assets/icons8-chatgpt-500.png')} 
                style={styles.gptProfileImage} 
              />
              <Text style={styles.nicknameText}>GPT</Text>
            </View>
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
            {isGptActive ? (
              <SendOnIcon width={18} height={18} />
            ) : (
              <SendOffIcon width={18} height={18} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  const renderDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isDetailModalVisible}
      onRequestClose={() => setIsDetailModalVisible(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setIsDetailModalVisible(false)} style={styles.modalCloseButton}>
            <Text style={styles.modalCloseButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
        {isModalLoading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color="#007AFF" /></View>
        ) : (
          <ScrollView>
            {placeDetails?.photo_url ? (
              <Image source={{ uri: placeDetails.photo_url }} style={styles.modalImage} />
            ) : (
              <View style={styles.modalImagePlaceholder} />
            )}
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedItem?.place_name}</Text>
              {selectedItem?.address ? (
                <Text style={[styles.modalSectionText, { marginBottom: 12 }]}>{selectedItem.address}</Text>
              ) : (
                <Text style={[styles.modalSectionText, { marginBottom: 12 }]}>정보 없음</Text>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>운영시간</Text>
                {placeDetails?.opening_hours ? placeDetails.opening_hours.map((line, index) => (
                  <Text key={index} style={styles.modalSectionText}>{line}</Text>
                )) : <Text style={styles.modalSectionText}>정보 없음</Text>}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>전화번호</Text>
                <Text style={styles.modalSectionText}>{placeDetails?.phone_number || '정보 없음'}</Text>
              </View>
              
              {selectedItem?.description && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>GPT 추천</Text>
                  <Text style={styles.modalSectionText}>{selectedItem.description}</Text>
                </View>
              )}

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>상세정보</Text>
                {isGptDescriptionLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : selectedItem?.gpt_description ? (
                  <Text style={styles.modalSectionText}>{selectedItem.gpt_description}</Text>
                ) : (
                  <TouchableOpacity style={styles.generateButton} onPress={handleGenerateDescription}>
                    <Text style={styles.generateButtonText}>AI에게 설명 요청</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <View style={{ height: 90 }} />
          </ScrollView>
        )}
        {!isModalLoading && (
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.outlineButton} onPress={() => {}}>
              <Text style={styles.outlineButtonText}>네비연결</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.blackButton} onPress={() => {}}>
              <Text style={styles.blackButtonText}>포토 스팟 보기</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
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
          <TouchableOpacity style={styles.actionButton}>
            <ArIcon width={20} height={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={toggleMenu}><Text style={styles.actionButtonText}>☰</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabHalf}>
          <TouchableOpacity style={[styles.tab, activeTab === 'schedule' && styles.activeTab]} onPress={() => setActiveTab('schedule')}>
            <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>일정</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tabHalf}>
          <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.activeTab]} onPress={() => setActiveTab('chat')}>
            <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>채팅</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ display: activeTab === 'schedule' ? 'flex' : 'none', flex: 1 }}>
          {renderScheduleTab()}
        </View>
        <View style={{ display: activeTab === 'chat' ? 'flex' : 'none', flex: 1 }}>
          {renderChatTab()}
        </View>
      </View>

      {renderDetailModal()}

      {/* 날짜/Day 선택 모달들 */}
      {showDateModal && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, width: '80%', maxHeight: '60%' }}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600' }}>날짜 선택</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}><Text style={{ fontSize: 18 }}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ paddingHorizontal: 8 }}>
              {uniqueDays.map(day => {
                const d = new Date(start_date);
                d.setDate(d.getDate() + (day - 1));
                const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} (${['일','월','화','수','목','금','토'][d.getDay()]})`;
                return (
                  <TouchableOpacity key={`date-${day}`} style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }} onPress={() => { setSelectedDay(day); setShowDateModal(false); }}>
                    <Text style={{ fontSize: 14 }}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Day 모달 제거: 날짜 드롭다운만 유지 */}

      {isMenuOpen && <TouchableOpacity style={styles.overlay} onPress={closeMenu} activeOpacity={1} />}
      <Animated.View style={[styles.slideMenu, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.menuHeader}>
          <TouchableOpacity onPress={closeMenu}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
        </View>
        <View style={styles.menuContent}>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); router.push({ pathname: '/invite-friends', params: { tripId } }); }}>
            <Text style={styles.menuText}>친구 초대하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); router.push({ pathname: '/packing-list/[tripId]', params: { tripId } }); }}><Text style={styles.menuText}>준비물 체크하기</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); router.push('/edit-region-dates'); }}><Text style={styles.menuText}>지역/기간 수정하기</Text></TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { closeMenu(); router.push({ pathname: '/edit-trip-itinerary', params: { tripId } }); }}>
            <Text style={styles.menuText}>여행 동선 편집하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}><Text style={styles.menuText}>여행 삭제하기</Text></TouchableOpacity>
        </View>
        <View style={styles.leaveTripContainer}>
          <TouchableOpacity style={styles.leaveTripButton} onPress={handleLeaveTrip}><Text style={styles.leaveTripText}>이번 여행에서 나가기</Text></TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
