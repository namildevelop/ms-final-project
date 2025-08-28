import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function TripItinerary() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'chat'>('schedule');
  const [selectedDate, setSelectedDate] = useState('9월 14일 (토)');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isGptActive, setIsGptActive] = useState(false);
  
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
          <View key={index} style={styles.scheduleItem}>
            <View style={styles.scheduleInfo}>
              <Text style={styles.locationText}>{item.location}</Text>
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
            <TouchableOpacity style={styles.detailButton}>
              <Text style={styles.detailButtonText}>네비 연결</Text>
            </TouchableOpacity>
          </View>
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
    </View>
  );

  const renderChatTab = () => (
    <View style={styles.chatContent}>
      {/* 채팅 메시지 영역 */}
      <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
        {/* 내 메시지 (오른쪽) */}
        <View style={styles.myMessageContainer}>
          <View style={styles.myMessageBubble}>
            <Text style={styles.myMessageText}>내 메시지</Text>
          </View>
        </View>

        {/* 상대방 메시지 (왼쪽) */}
        <View style={styles.otherMessageContainer}>
          <View style={styles.profileSection}>
            <View style={styles.profileImage}>
              <Text style={styles.profileText}>프</Text>
            </View>
            <Text style={styles.nicknameText}>닉네임</Text>
          </View>
          <View style={styles.otherMessageBubble}>
            <Text style={styles.otherMessageText}>상대방 메시지</Text>
          </View>
        </View>

        {/* GPT 답변 (중앙) */}
        <View style={styles.gptResponseContainer}>
          <View style={styles.gptResponseBox}>
            <Text style={styles.gptResponseText}>gpt 답변</Text>
          </View>
        </View>
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
            placeholder={isGptActive ? "GPT에게 요청해보세요." : "메시지 입력"}
            placeholderTextColor="#999"
            multiline
          />
        </View>
        
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendButtonText}>✈️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.regionText}>제주도</Text>
          <Text style={styles.dateRangeText}>2025.7.14 - 2025.7.15</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
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
  backButton: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    alignItems: 'center',
  },
  regionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#007AFF',
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
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 10,
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
    color: '#666',
  },
  detailButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  chatContent: {
    flex: 1,
    backgroundColor: '#fff',
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
    padding: 20,
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  myMessageBubble: {
    backgroundColor: '#007AFF',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    maxWidth: '80%',
  },
  myMessageText: {
    color: '#fff',
    fontSize: 14,
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
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
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    maxWidth: '80%',
  },
  otherMessageText: {
    fontSize: 14,
    color: '#333',
  },
  gptResponseContainer: {
    alignSelf: 'center',
    marginTop: 20,
  },
  gptResponseBox: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    maxWidth: '80%',
  },
  gptResponseText: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  gptButton: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  gptButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  gptButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  gptButtonTextActive: {
    color: '#fff',
  },
  messageInputContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  messageInputContainerActive: {
    backgroundColor: '#e0f7fa',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  messageInput: {
    fontSize: 14,
    color: '#333',
    padding: 0,
  },
  sendButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendButtonText: {
    fontSize: 18,
    color: '#333',
  },
});
