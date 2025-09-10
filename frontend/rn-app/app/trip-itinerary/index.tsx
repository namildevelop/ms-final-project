// 여행 일정 페이지 (슬라이드 메뉴 포함)
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Modal, TextInput, Animated } from 'react-native';
import { router } from 'expo-router';
import ARIcon from '../../assets/aricon.svg';
import SendOnIcon from '../../assets/sendonicon.svg';

const { width } = Dimensions.get('window');

export default function TripItinerary() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'chat'>('schedule');
  const [selectedDate, setSelectedDate] = useState('9월 14일 (토)');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isGptActive, setIsGptActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0]; // 오른쪽에서 슬라이드
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailItem, setDetailItem] = useState<{ location: string; time: string } | null>(null);
  const [messageInputText, setMessageInputText] = useState('');
  type ChatMessage = { id: number; text: string; sender: 'me' | 'other' | 'gpt'; isGptQuestion?: boolean };
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, text: '상대방 메시지 상대방 메시지', sender: 'other' },
    { id: 2, text: '본인 메시지, 본인 메시지, 본인 메시지', sender: 'me' },
    { id: 3, text: '좋습니다 🙂 제주도 2박 3일 여행 코스를 추천해드릴게요.\n혼자 여행인지, 연인이랑 여행인지, 혹은 아이 동반 여행인지에 따라 조금 달라질 수 있는데, 일단 가장 무난하고 인기 있는 일정을 기준으로 짜드릴게요.', sender: 'gpt' },
  ]);
  
  // 시간 문자열(예: "14:00 도착예정")을 "HH:MM ~ HH:MM" 형식으로 변환
  // 종료 시간은 기본 30분 후로 계산
  const formatTimeRange = (timeText: string) => {
    const match = timeText.match(/(\d{1,2}:\d{2})/);
    if (!match) return timeText;
    const [hh, mm] = match[1].split(':').map(Number);
    const start = new Date(2000, 0, 1, hh, mm, 0);
    const end = new Date(start.getTime() + 30 * 60000);
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
    return `${startStr} ~ ${endStr}`;
  };
  
  // 여행 기간에 맞는 날짜들 생성 (2025.9.14 ~ 2025.9.15)
  const tripDates = [
    { 
      date: '9월 14일 (토)', 
      day: 'Day 1',
      schedule: [
        {
          location: '제주공항(하드코딩한 예시 코드입니다)',
          time: '14:00 도착예정'
        },
        {
          location: '렌터카(하드코딩한 예시 코드입니다)',
          time: '14:30 도착예정'
        },
        {
          location: '그랜드 제주 조선 호텔(하드코딩한 예시 코드입니다)',
          time: '16:00 도착예정'
        }
      ]
    },
    { 
      date: '9월 15일 (일)', 
      day: 'Day 2',
      schedule: [
        {
          location: '해녀 식당(하드코딩한 예시 코드입니다)',
          time: '12:00 점심예정'
        },
        {
          location: '성산일출봉(하드코딩한 예시 코드입니다)',
          time: '15:00 관광예정'
        },
        {
          location: '제주 올레길(하드코딩한 예시 코드입니다)',
          time: '17:00 산책예정'
        }
      ]
    },
  ];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
  };

  const getCurrentDay = () => {
    const selectedDateObj = tripDates.find(d => d.date === selectedDate);
    return selectedDateObj ? selectedDateObj.day : 'Day 1';
  };

  const getCurrentSchedule = () => {
    const selectedDateObj = tripDates.find(d => d.date === selectedDate);
    return selectedDateObj ? selectedDateObj.schedule : tripDates[0].schedule;
  };

  // 메뉴 열기/닫기
  const toggleMenu = () => {
    if (isMenuOpen) {
      // 메뉴 닫기
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsMenuOpen(false));
    } else {
      // 메뉴 열기
      setIsMenuOpen(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  // 메뉴 닫기
  const closeMenu = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setIsMenuOpen(false));
  };

  const renderScheduleTab = () => (
    <View style={styles.scheduleContent}>
      {/* 날짜 선택 영역 */}
      <View style={styles.dateSection}>
        <View style={styles.dateSelector}>
          <TouchableOpacity 
            style={styles.dateDropdown}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{selectedDate}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          <Text style={styles.dayText}>{getCurrentDay()}</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.editRouteText}>여행 동선 편집하기</Text>
        </TouchableOpacity>
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapPlaceholderText}>지도 준비중</Text>
      </View>

      {/* 일정 목록 */}
      <View style={styles.scheduleList}>
        {getCurrentSchedule().map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.scheduleItem}
            activeOpacity={0.8}
            onPress={() => { setDetailItem(item); setDetailVisible(true); }}
          >
            <Text style={styles.indexNumber}>{index + 1}</Text>
            <View style={styles.scheduleInfo}>
              <Text style={styles.locationText}>{item.location}</Text>
              <Text style={styles.timeText}>{formatTimeRange(item.time)}</Text>
              <Text style={styles.descText} numberOfLines={2}>
                GPT의 장소에 대한 체험 설명, GPT의 장소에 대한 체험 설명, GPT의 장소에 대한 체험 설명,
                GPT의 장소에 대한 체험 설명.
              </Text>
            </View>
            <TouchableOpacity style={styles.naviButton}>
              <Text style={styles.naviButtonText}>네비 연결</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* 날짜 선택 모달 */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDatePicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>날짜 선택</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            {tripDates.map((tripDate, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateOption,
                  selectedDate === tripDate.date && styles.selectedDateOption
                ]}
                onPress={() => handleDateSelect(tripDate.date)}
              >
                <Text style={[
                  styles.dateOptionText,
                  selectedDate === tripDate.date && styles.selectedDateOptionText
                ]}>
                  {tripDate.date}
                </Text>
                <Text style={[
                  styles.dateOptionDay,
                  selectedDate === tripDate.date && styles.selectedDateOptionDay
                ]}>
                  {tripDate.day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      {/* 일정 상세 모달 */}
      <Modal
        visible={detailVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailVisible(false)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailContainer}>
            <View style={styles.detailHeaderRow}>
              <TouchableOpacity onPress={() => setDetailVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.detailHeaderText} numberOfLines={1}>
                일정  {selectedDate}, {detailItem?.time || ''}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailImagePlaceholder}>
                <Text style={styles.detailImageText}>이미지 준비중</Text>
              </View>

              <View style={styles.titleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailTitle}>{detailItem?.location || '장소명'}</Text>
                  <Text style={styles.detailSubtitle}>제주특별자치도 서귀포시 성산읍 성산리 78</Text>
                </View>
                <TouchableOpacity style={styles.smallNaviBtn}>
                  <Text style={styles.smallNaviText}>네비연결</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.paragraph}>
                GPT의 장소에 대한 체험 설명, GPT의 장소에 대한 체험 설명, GPT의 장소에 대한 체험 설명,
              </Text>

              <Text style={styles.paragraph}>
                <Text>성산 일출봉은 </Text>
                <Text style={styles.bold}>제주도 서귀포시 성산읍</Text>
                <Text>에 위치한 </Text>
                <Text style={styles.bold}>해발 약 182m의 수성 화산체</Text>
                <Text>로, 분화구가 마치 사발처럼 생긴 독특한 지형이 인상적입니다. 약 </Text>
                <Text style={styles.bold}>5,000년 전 바닷속에서 분출된 용암과 물의 급격한 만남</Text>
                <Text>으로 형성된 ‘테프라 콘(tuff cone)’입니다.</Text>
              </Text>

              <Text style={styles.tags}>#키워드1, #키워드2</Text>

              <TouchableOpacity style={styles.photoSpotBtn}>
                <Text style={styles.photoSpotText}>포토스팟 보기</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );

  const renderChatTab = () => (
    <View style={styles.chatContent}>
      {/* 채팅 메시지 영역 */}
      <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
        {messages.map((m) => {
          if (m.sender === 'me') {
            return (
              <View key={m.id} style={styles.myMessageContainer}>
                <View style={styles.messageRowMine}>
                  {m.isGptQuestion && (
                    <Text style={[styles.gptQuestionLabel, styles.leftLabel]}>GPT 질문</Text>
                  )}
                  <View style={styles.myMessageBubble}>
                    <Text style={styles.myMessageText}>{m.text}</Text>
                  </View>
                </View>
              </View>
            );
          }
          if (m.sender === 'other') {
            return (
              <View key={m.id} style={styles.otherMessageContainer}>
                <View style={styles.profileSection}>
                  <View style={styles.profileImage}>
                    <Text style={styles.profileText}>프</Text>
                  </View>
                  <Text style={styles.nicknameText}>닉네임</Text>
                </View>
                <View style={styles.messageRowOther}>
                  <View style={styles.otherMessageBubble}>
                    <Text style={styles.otherMessageText}>{m.text}</Text>
                  </View>
                  {m.isGptQuestion && (
                    <Text style={[styles.gptQuestionLabel, styles.rightLabel]}>GPT 질문</Text>
                  )}
                </View>
              </View>
            );
          }
          return (
            <View key={m.id}>
              <View style={styles.gptDivider}>
                <View style={styles.gptDividerLine} />
                <Text style={styles.gptDividerText}>GPT 답변</Text>
                <View style={styles.gptDividerLine} />
              </View>
              <View style={styles.gptResponseContainer}>
                <View style={styles.gptResponseBox}>
                  <Text style={styles.gptResponseText}>{m.text}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* 하단 입력 영역 */}
      <View style={styles.inputContainer}>
        <TouchableOpacity 
          style={[
            styles.gptButton, 
            isGptActive && styles.gptButtonActive
          ]}
          onPress={() => setIsGptActive(!isGptActive)}
        >
          <Text style={[
            styles.gptButtonText,
            isGptActive && styles.gptButtonTextActive
          ]}>
            GPT
          </Text>
        </TouchableOpacity>
        
        <View style={[
          styles.messageInputContainer,
          isGptActive && styles.messageInputContainerActive
        ]}>
          <TextInput
            style={styles.messageInput}
            placeholder={isGptActive ? "GPT에게 일정과 관련된 요청을 하세요." : "메시지..."}
            placeholderTextColor="#999"
            multiline
            value={messageInputText}
            onChangeText={setMessageInputText}
          />
        </View>
        
        <TouchableOpacity 
          style={[styles.sendButton, isGptActive && styles.sendButtonActive]} 
          onPress={() => {
            const text = messageInputText.trim();
            if (!text) return;
            setMessages(prev => [
              ...prev,
              { id: Date.now(), text, sender: 'me', isGptQuestion: isGptActive },
            ]);
            setMessageInputText('');
          }}
        >
          <SendOnIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.regionText}>제주도 <Text style={styles.countryText}>(대한민국)</Text></Text>
            <Text style={styles.dateRangeText}>2025.7.14 - 2025.7.15</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <ARIcon width={24} height={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={toggleMenu}>
            <Text style={styles.actionButtonText}>☰</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
          onPress={() => setActiveTab('schedule')}
        >
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>
            일정
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          onPress={() => setActiveTab('chat')}
        >
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
            채팅
          </Text>
        </TouchableOpacity>
      </View>

      {/* 탭 내용 */}
      {activeTab === 'schedule' ? renderScheduleTab() : renderChatTab()}

      {/* 슬라이드 메뉴 */}
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
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>친구 초대하기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/packing-checklist')}
          >
            <Text style={styles.menuText}>준비물 체크하기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>지역/기간 수정하기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/edit-itinerary')}
          >
            <Text style={styles.menuText}>여행 동선 편집하기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>여행 삭제하기</Text>
          </TouchableOpacity>
        </View>
        
        {/* 이번 여행에서 나가기 - 왼쪽 하단에 배치 */}
        <View style={styles.leaveTripContainer}>
          <TouchableOpacity style={styles.leaveTripButton}>
            <Text style={styles.leaveTripText}>이번 여행에서 나가기</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    alignItems: 'flex-start',
  },
  regionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  countryText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: 'normal',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 18,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    // pill 배경은 텍스트에만 적용
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '700',
    backgroundColor: '#e6f0ff',
    paddingVertical: 6,
    paddingHorizontal: 60,
    borderRadius: 18,
  },
  scheduleContent: {
    flex: 1,
    padding: 20,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#666',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  editRouteText: {
    fontSize: 14,
    color: '#007AFF',
  },
  mapContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: '#6c757d',
  },
  scheduleList: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  indexNumber: {
    width: 20,
    textAlign: 'left',
    marginRight: 12,
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  scheduleInfo: {
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  descText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  naviButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  naviButtonText: {
    color: '#007AFF',
    fontSize: 13,
    fontWeight: '600',
  },
  chatContent: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  dateOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDateOption: {
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedDateOptionText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  dateOptionDay: {
    fontSize: 14,
    color: '#666',
  },
  selectedDateOptionDay: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  chatMessages: {
    flex: 1,
    padding: 14,
  },
  myMessageContainer: {
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  myMessageBubble: {
    backgroundColor: '#3f3f46',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    maxWidth: '80%',
  },
  myMessageText: {
    color: '#fff',
    fontSize: 14,
  },
  otherMessageContainer: {
    alignSelf: 'stretch',
    marginBottom: 10,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  profileImage: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  profileText: {
    fontSize: 14,
    color: '#333',
  },
  nicknameText: {
    fontSize: 14,
    color: '#666',
  },
  otherMessageBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    maxWidth: '80%',
  },
  otherMessageText: {
    fontSize: 14,
    color: '#111827',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageRowMine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  messageRowOther: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-start',
  },
  // 상세 모달 스타일
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  detailContainer: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
  },
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  detailHeaderText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  detailImagePlaceholder: {
    height: 220,
    backgroundColor: '#eef2f7',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailImageText: {
    color: '#6b7280',
    fontSize: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  detailSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  smallNaviBtn: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallNaviText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  paragraph: {
    paddingHorizontal: 16,
    paddingTop: 16,
    color: '#374151',
    lineHeight: 22,
    fontSize: 14,
  },
  bold: {
    fontWeight: 'bold',
    color: '#111827',
  },
  tags: {
    paddingHorizontal: 16,
    paddingTop: 12,
    color: '#6b7280',
    fontSize: 13,
  },
  photoSpotBtn: {
    backgroundColor: '#2563eb',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 14,
  },
  photoSpotText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  gptResponseContainer: {
    alignSelf: 'center',
    marginTop: 20,
  },
  gptResponseBox: {
    backgroundColor: '#e6f0ff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    maxWidth: '92%',
  },
  gptResponseText: {
    fontSize: 14,
    color: '#1f2937',
  },
  gptDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  gptDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  gptDividerText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  gptButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 15,
    marginRight: 8,
  },
  gptButtonActive: {
    backgroundColor: '#e6f0ff',
    borderColor: '#bcd3ff',
  },
  gptButtonText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },
  gptButtonTextActive: {
    color: '#007AFF',
  },
  messageInputContainer: {
    flex: 1,
    backgroundColor: '#f3f9ff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#bcd3ff',
  },
  messageInputContainerActive: {
    backgroundColor: '#e6f0ff',
    borderColor: '#7fb1ff',
  },
  messageInput: {
    fontSize: 13,
    color: '#333',
    padding: 0,
  },
  sendButton: {
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bcd3ff',
  },
  sendButtonActive: {
    backgroundColor: '#cfe2ff',
    borderColor: '#7fb1ff',
  },
  gptQuestionLabelContainer: {
    alignSelf: 'flex-end',
    marginBottom: 4,
    marginRight: 4,
  },
  gptQuestionLabel: {
    fontSize: 11,
    color: '#6b7280',
  },
  leftLabel: {
    marginRight: 6,
  },
  rightLabel: {
    marginLeft: 6,
  },
  // 슬라이드 메뉴 스타일
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
    right: 0,
    width: 300,
    height: '100%',
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
    paddingVertical: 20,
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
    bottom: 40,
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
