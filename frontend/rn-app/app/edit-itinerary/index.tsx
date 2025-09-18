// 여행 동선 편집하기 페이지
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';



interface ScheduleItem {
  id: string;
  location: string;
  startTime: string;
  endTime: string;
  date: string;
  day: string;
}

export default function EditItinerary() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([
    {
      id: '1',
      location: '해녀 식당',
      startTime: '14:00',
      endTime: '14:30',
      date: '9월 13일 (금)',
      day: 'Day 1'
    },
    {
      id: '2',
      location: '성산일출봉',
      startTime: '14:30',
      endTime: '15:30',
      date: '9월 13일 (금)',
      day: 'Day 1'
    },
    {
      id: '3',
      location: '연돈',
      startTime: '15:30',
      endTime: '17:30',
      date: '9월 14일 (토)',
      day: 'Day 2'
    },
    {
      id: '4',
      location: '호텔',
      startTime: '17:30',
      endTime: '20:00',
      date: '9월 15일 (토)',
      day: 'Day 3'
    }
  ]);

  const [showTimeModal, setShowTimeModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
  const [tempStartTime, setTempStartTime] = useState('');
  const [tempEndTime, setTempEndTime] = useState('');

  // 기존 커스텀 DnD 관련 상태와 로직 제거 (DraggableFlatList 사용)

  const openTimeModal = (schedule: ScheduleItem) => {
    setEditingSchedule(schedule);
    setTempStartTime(schedule.startTime);
    setTempEndTime(schedule.endTime);
    setShowTimeModal(true);
  };

  const saveTimeChange = () => {
    if (editingSchedule) {
      setSchedules(prev => 
        prev.map(schedule => 
          schedule.id === editingSchedule.id 
            ? { ...schedule, startTime: tempStartTime, endTime: tempEndTime }
            : schedule
        )
      );
      setShowTimeModal(false);
      setEditingSchedule(null);
    }
  };

  const timeOptions = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
  ];

  // DraggableFlatList 사용으로 그룹 계산 및 커스텀 인디케이터 제거

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>여행 동선 편집하기</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 일정 목록: 기본 ScrollView 섹션 렌더 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 날짜별 구분 라벨과 아이템들 */}
        {['9월 13일 (금)', '9월 14일 (토)', '9월 15일 (토)'].map((date) => (
          <View key={date} style={styles.dateSection}>
            <Text style={styles.dateText}>{date}</Text>
            {schedules.filter(s => s.date === date).map((item) => (
              <View key={item.id} style={styles.scheduleItem}>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.locationText}>{item.location}</Text>
                  <Text style={styles.timeText}>{item.startTime} ~ {item.endTime}</Text>
                </View>
                <View style={styles.scheduleActions}>
                  <TouchableOpacity 
                    style={styles.timeChangeButton}
                    onPress={() => openTimeModal(item)}
                  >
                    <Text style={styles.timeChangeText}>시간 변경</Text>
                  </TouchableOpacity>
                  <View style={styles.dragHandle}>
                    <Text style={styles.dragHandleText}>≡</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ))}

        {/* 일정 추가하기 버튼 */}
        <TouchableOpacity style={styles.addScheduleButton}>
          <Text style={styles.addScheduleText}>일정 추가하기</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* 리스트 외 보정용 요소 제거됨 */}

      {/* 저장하기 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={() => console.log('schedules:', schedules)}>
          <Text style={styles.saveButtonText}>저장하기</Text>
        </TouchableOpacity>
      </View>

      {/* 시간 변경 모달 */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>시간 변경</Text>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.timeSelector}>
              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>시작 시간</Text>
                <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
                  {timeOptions.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        tempStartTime === time && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempStartTime(time)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        tempStartTime === time && styles.selectedTimeOptionText
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.timeSection}>
                <Text style={styles.timeLabel}>종료 시간</Text>
                <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
                  {timeOptions.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        tempEndTime === time && styles.selectedTimeOption
                      ]}
                      onPress={() => setTempEndTime(time)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        tempEndTime === time && styles.selectedTimeOptionText
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowTimeModal(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={saveTimeChange}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
    fontSize: 24,
    color: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dateSection: {
    marginBottom: 30,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    paddingLeft: 5,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
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
  scheduleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  timeChangeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timeChangeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  dragHandle: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragHandleText: {
    fontSize: 16,
    color: '#999',
    fontWeight: 'bold',
  },
  draggingItem: {
    opacity: 0.9,
    transform: [{ scale: 1.03 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4.65,
    elevation: 8,
  },
  addScheduleButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 100,
  },
  addScheduleText: {
    fontSize: 16,
    color: '#333',
  },
  absoluteDropIndicator: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    zIndex: 2000,
  },
  inlineDropLine: {
    height: 3,
    backgroundColor: '#007AFF',
    borderRadius: 2,
    marginBottom: 8,
    marginHorizontal: 5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    padding: 5,
  },
  timeSelector: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  timeSection: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  timeList: {
    maxHeight: 200,
  },
  timeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  selectedTimeOption: {
    backgroundColor: '#007AFF',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#333',
  },
  selectedTimeOptionText: {
    color: '#ffffff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
});
