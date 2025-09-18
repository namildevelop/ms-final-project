import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';

const PRIMARY_SKY = '#1DA1F2';

const CreateTripPage: React.FC = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [tripTitle, setTripTitle] = useState('');
  const [memberCount, setMemberCount] = useState<string>('1');
  const [companionRelation, setCompanionRelation] = useState<string>('');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showRelationModal, setShowRelationModal] = useState(false);
  const memberInputRef = useRef<TextInput | null>(null);

  // 현재 월의 첫 번째 날과 마지막 날 계산
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  // 달력에 표시할 날짜들 생성
  const calendarDays = [];
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    calendarDays.push(new Date(d));
  }

  // 월 변경 핸들러
  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // 날짜 선택 핸들러
  const selectDate = (date: Date) => {
    if (!selectedStartDate) {
      // 첫 번째 날짜 선택
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (!selectedEndDate) {
      // 두 번째 날짜 선택
      if (date < selectedStartDate) {
        // 시작일이 종료일보다 늦은 경우 순서 변경
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
      }
    } else {
      // 새로운 날짜 범위 시작
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    }
  };

  // 선택된 날짜 범위인지 확인
  const isInSelectedRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };

  // 선택된 시작일인지 확인
  const isSelectedStartDate = (date: Date) => {
    return selectedStartDate && date.getTime() === selectedStartDate.getTime();
  };

  // 선택된 종료일인지 확인
  const isSelectedEndDate = (date: Date) => {
    return selectedEndDate && date.getTime() === selectedEndDate.getTime();
  };

  // 오늘 날짜인지 확인
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // 현재 월인지 확인
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  };

  // 여행 기간 계산
  const getTripDuration = () => {
    if (!selectedStartDate || !selectedEndDate) return '';
    
    const diffTime = Math.abs(selectedEndDate.getTime() - selectedStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const nights = diffDays;
    const days = diffDays + 1;
    
    return `${nights}박 ${days}일`;
  };

  // 다음 단계로 이동
  const goToNextStep = () => {
    if (!tripTitle.trim()) {
      Alert.alert('알림', '여행 제목을 입력해주세요.');
      return;
    }
    if (!selectedStartDate || !selectedEndDate) {
      Alert.alert('알림', '여행 기간을 선택해주세요.');
      return;
    }
    if (!selectedCountry || !selectedRegion) {
      Alert.alert('알림', '여행 지역을 선택해주세요.');
      return;
    }
    
    // 여행 성향 설정 페이지로 이동
    console.log('선택된 정보:', {
      title: tripTitle,
      startDate: selectedStartDate,
      endDate: selectedEndDate,
      country: selectedCountry,
      region: selectedRegion,
      duration: getTripDuration(),
      members: memberCount,
      relation: companionRelation,
    });
    
    router.replace({
      pathname: '/trip-preferences',
      params: {
        title: tripTitle,
        startDate: selectedStartDate.toISOString().split('T')[0], // YYYY-MM-DD 형식으로 변환
        endDate: selectedEndDate.toISOString().split('T')[0],     // YYYY-MM-DD 형식으로 변환
        country: selectedCountry,
        region: selectedRegion,
        members: memberCount,
        relation: companionRelation,
      }
    });
  };

  // 국가 선택
  const selectCountry = (country: string) => {
    setSelectedCountry(country);
    setSelectedRegion(''); // 지역 초기화
    setShowCountryModal(false);
  };

  // 지역 선택
  const selectRegion = (region: string) => {
    setSelectedRegion(region);
    setShowRegionModal(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>여행 계획 만들기</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 여행 제목 입력 */}
        <View style={styles.section}>
          <Text style={styles.inputLabel}>여행 제목 (필수)</Text>
          <View style={styles.inputFieldWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="여행 제목을 입력하세요."
              placeholderTextColor="#9ca3af"
              value={tripTitle}
              onChangeText={setTripTitle}
            />
          </View>
        </View>
        {/* 여행 기간 입력 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>여행 기간 입력 (필수)</Text>
          
          {/* 달력 */}
          <View style={styles.calendarSection}>
            {/* 월 네비게이션 */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity onPress={() => changeMonth('prev')}>
                <Text style={styles.navArrow}>←</Text>
              </TouchableOpacity>
              <Text style={styles.monthYear}>
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </Text>
              <TouchableOpacity onPress={() => changeMonth('next')}>
                <Text style={styles.navArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* 요일 헤더 */}
            <View style={styles.weekHeader}>
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

            {/* 달력 그리드 (홈 화면 스타일) */}
            <View style={styles.calendarGrid}>
              {calendarDays.map((date, index) => {
                const isStart = isSelectedStartDate(date);
                const isEnd = isSelectedEndDate(date);
                const isRangeMid = isInSelectedRange(date) && !isStart && !isEnd;
                return (
                  <View key={index} style={styles.dayCell}>
                    <TouchableOpacity
                      style={[
                        styles.dayButton,
                        isToday(date) && styles.todayButton,
                        (isStart || isEnd) && styles.selectedDayButton,
                        isRangeMid && styles.inRangeButton,
                      ]}
                      onPress={() => selectDate(date)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !isCurrentMonth(date) && styles.otherMonthDayText,
                          isToday(date) && styles.todayText,
                          (isStart || isEnd) && styles.selectedDayText,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

          </View>
        </View>

        {/* 여행 기간 표시 */}
        {selectedStartDate && selectedEndDate && (
          <View style={styles.durationDisplay}>
            <Text style={styles.durationText}>
              여행기간 {getTripDuration()}
            </Text>
          </View>
        )}

        {/* 여행 지역 섹션 */
        }
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>여행 지역 (필수)</Text>
          
          <View style={styles.regionContainer}>
            {/* 국가 선택 */}
            <TouchableOpacity 
              style={styles.regionDropdown}
              onPress={() => setShowCountryModal(true)}
            >
              <Text style={[
                styles.dropdownText,
                selectedCountry ? styles.selectedDropdownText : styles.placeholderText
              ]}>
                {selectedCountry || '국가'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            {/* 지역 선택 */}
            <TouchableOpacity 
              style={[
                styles.regionDropdown,
                !selectedCountry && styles.disabledDropdown
              ]}
              onPress={() => selectedCountry && setShowRegionModal(true)}
              disabled={!selectedCountry}
            >
              <Text style={[
                styles.dropdownText,
                selectedRegion ? styles.selectedDropdownText : styles.placeholderText,
                !selectedCountry && styles.disabledText
              ]}>
                {selectedRegion || '지역'}
              </Text>
              <Text style={[
                styles.dropdownArrow,
                !selectedCountry && styles.disabledArrow
              ]}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 인원 및 동반자 관계 */}
        <View style={styles.section}>
          <View style={styles.regionContainer}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>인원 (필수)</Text>
              <TouchableOpacity
                activeOpacity={1}
                style={styles.regionDropdown}
                onPress={() => memberInputRef.current?.focus()}
              >
                <TextInput
                  ref={memberInputRef}
                  style={[styles.dropdownText, { flex: 1 }]}
                  value={memberCount}
                  onChangeText={(t) => {
                    setMemberCount(t.replace(/[^0-9]/g, ''));
                  }}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor="#999999"
                />
                <Text style={styles.dropdownArrow}>명</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>동반자와의 관계 (선택)</Text>
              <TouchableOpacity
                style={styles.regionDropdown}
                onPress={() => setShowRelationModal(true)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    companionRelation ? styles.selectedDropdownText : styles.placeholderText,
                  ]}
                >
                  {companionRelation || '선택하세요.'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={goToNextStep}
        >
          <Text style={styles.nextButtonText}>다음 (여행 성향 설정)</Text>
        </TouchableOpacity>
      </View>

      {/* 국가 선택 모달 */}
      {showCountryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>국가 선택</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalOptions}>
              {['대한민국'].map(country => (
                <TouchableOpacity
                  key={country}
                  style={styles.optionItem}
                  onPress={() => selectCountry(country)}
                >
                  <Text style={styles.optionText}>{country}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 지역 선택 모달 */}
      {showRegionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>지역 선택</Text>
              <TouchableOpacity onPress={() => setShowRegionModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalOptions}>
              {['서울', '부산', '제주도'].map(region => (
                <TouchableOpacity
                  key={region}
                  style={styles.optionItem}
                  onPress={() => selectRegion(region)}
                >
                  <Text style={styles.optionText}>{region}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 동반자 관계 모달 */}
      {showRelationModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>동반자와의 관계</Text>
              <TouchableOpacity onPress={() => setShowRelationModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalOptions}>
              {['가족', '친구', '연인', '회사동료'].map(rel => (
                <TouchableOpacity
                  key={rel}
                  style={styles.optionItem}
                  onPress={() => {
                    setCompanionRelation(rel);
                    setShowRelationModal(false);
                  }}
                >
                  <Text style={styles.optionText}>{rel}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
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
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 10,
  },
  inputFieldWrapper: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  textInput: {
    fontSize: 16,
    color: '#1f2937',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 20,
  },
  calendarSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#a5a5a5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  navArrow: {
    fontSize: 24,
    color: '#8e8e93',
    fontWeight: 'bold',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: '#8e8e93',
    fontSize: 13,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayText: {
    fontSize: 16,
    color: '#1c1c1e',
  },
  todayButton: {
    backgroundColor: PRIMARY_SKY,
  },
  todayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  selectedDayButton: {
    backgroundColor: '#111111',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  inRangeButton: {
    backgroundColor: '#f0f0f0',
  },
  otherMonthDayText: {
    color: '#cbd5e0',
  },
  durationDisplay: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  durationText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '400',
  },
  regionContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  formField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  regionDropdown: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  disabledDropdown: {
    backgroundColor: '#f7fafc',
    borderColor: '#e2e8f0',
  },
  disabledText: {
    color: '#cbd5e0',
  },
  disabledArrow: {
    color: '#cbd5e0',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333333',
  },
  selectedDropdownText: {
    color: '#1a202c',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#999999',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666666',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nextButton: {
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    fontSize: 20,
    color: '#666666',
    padding: 5,
  },
  modalOptions: {
    padding: 0,
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
});

export default CreateTripPage;
