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

const EditRegionDatesPage: React.FC = () => {
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [tripTitle, setTripTitle] = useState('');
  const memberInputRef = useRef<TextInput | null>(null);
  const [memberCount, setMemberCount] = useState<string>('1');
  const [companionRelation, setCompanionRelation] = useState<string>('');

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
  const calendarDays = [] as Date[];
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - lastDayOfMonth.getDay()));
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    calendarDays.push(new Date(d));
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const isInSelectedRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date >= selectedStartDate && date <= selectedEndDate;
  };
  const isSelectedStartDate = (date: Date) => selectedStartDate && date.getTime() === selectedStartDate.getTime();
  const isSelectedEndDate = (date: Date) => selectedEndDate && date.getTime() === selectedEndDate.getTime();
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();

  const selectDate = (date: Date) => {
    if (!selectedStartDate) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (!selectedEndDate) {
      if (date < selectedStartDate) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(date);
      } else {
        setSelectedEndDate(date);
      }
    } else {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    }
  };

  const onSave = () => {
    Alert.alert('완료', '지역/기간 수정 화면입니다. 현재는 디자인만 제공됩니다.', [
      { text: '확인', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>지역/기간 수정하기</Text>
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
          <View style={styles.calendarSection}>
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

            <View style={styles.weekHeader}>
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <Text key={day} style={styles.weekDay}>{day}</Text>
              ))}
            </View>

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

        {/* 여행 지역 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>여행 지역 (필수)</Text>
          <View style={styles.regionContainer}>
            <TouchableOpacity style={styles.regionDropdown}>
              <Text style={[styles.dropdownText, selectedCountry ? styles.selectedDropdownText : styles.placeholderText]}>
                {selectedCountry || '국가'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.regionDropdown}>
              <Text style={[styles.dropdownText, selectedRegion ? styles.selectedDropdownText : styles.placeholderText]}>
                {selectedRegion || '지역'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 인원 및 동반자 관계 */}
        <View style={styles.section}>
          <View style={styles.regionContainer}>
            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>인원 (필수)</Text>
              <TouchableOpacity activeOpacity={1} style={styles.regionDropdown} onPress={() => memberInputRef.current?.focus()}>
                <TextInput
                  ref={memberInputRef}
                  style={[styles.dropdownText, { flex: 1 }]}
                  value={memberCount}
                  onChangeText={(t) => setMemberCount(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor="#999999"
                />
                <Text style={styles.dropdownArrow}>명</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formField}>
              <Text style={styles.fieldLabel}>동반자와의 관계 (선택)</Text>
              <TouchableOpacity style={styles.regionDropdown}>
                <Text style={[styles.dropdownText, companionRelation ? styles.selectedDropdownText : styles.placeholderText]}>
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
        <TouchableOpacity style={styles.nextButton} onPress={onSave}>
          <Text style={styles.nextButtonText}>완료</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 8,
  },
  backButton: { padding: 8 },
  backArrow: { fontSize: 24, color: '#4a5568' },
  title: { fontSize: 18, fontWeight: '600', color: '#1a202c' },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 30 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#1a202c', marginBottom: 10 },
  inputFieldWrapper: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#ffffff' },
  textInput: { fontSize: 16, color: '#1f2937' },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#1a202c', marginBottom: 20 },
  calendarSection: { backgroundColor: '#ffffff', borderRadius: 16, padding: 20, shadowColor: '#a5a5a5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  monthNavigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  navArrow: { fontSize: 24, color: '#8e8e93', fontWeight: 'bold' },
  monthYear: { fontSize: 18, fontWeight: '600', color: '#1c1c1e' },
  weekHeader: { flexDirection: 'row', marginBottom: 15 },
  weekDay: { flex: 1, textAlign: 'center', color: '#8e8e93', fontSize: 13, fontWeight: '500' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  dayText: { fontSize: 16, color: '#1c1c1e' },
  todayButton: { backgroundColor: PRIMARY_SKY },
  todayText: { color: '#ffffff', fontWeight: 'bold' },
  selectedDayButton: { backgroundColor: '#111111' },
  selectedDayText: { color: '#ffffff', fontWeight: 'bold' },
  inRangeButton: { backgroundColor: '#f0f0f0' },
  otherMonthDayText: { color: '#cbd5e0' },
  regionContainer: { flexDirection: 'row', gap: 15 },
  formField: { flex: 1 },
  fieldLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8, fontWeight: '600' },
  regionDropdown: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: 16, color: '#333333' },
  selectedDropdownText: { color: '#1a202c', fontWeight: '500' },
  placeholderText: { color: '#999999' },
  dropdownArrow: { fontSize: 12, color: '#666666' },
  buttonContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  nextButton: { backgroundColor: '#111111', padding: 16, borderRadius: 10, alignItems: 'center' },
  nextButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});

export default EditRegionDatesPage;



