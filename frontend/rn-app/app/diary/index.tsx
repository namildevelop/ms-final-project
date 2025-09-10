// 일기 페이지
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import HomeOffIcon from '../../assets/homeofficon.svg';
import HomeOnIcon from '../../assets/homeonicon.svg';
import BookOnIcon from '../../assets/bookonicon.svg';
import BookOffIcon from '../../assets/bookofficon.svg';
import UserOnIcon from '../../assets/useronicon.svg';
import UserOffIcon from '../../assets/userofficon.svg';
import { styles } from './styles';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string;
}

const DiaryPage: React.FC = () => {
  const router = useRouter();
  const [showCalendar, setShowCalendar] = useState(false);
  const [diaryEntries] = useState<DiaryEntry[]>([
    {
      id: '1',
      title: '제주에서의 하루, 잊지 못할 푸른 기억',
      content: '고요한 협재의 아침 바다로 시작해, 오설록의 푸른 녹차밭에서 마음을 정화하고, 한라산의 웅장함에 감탄했던 하루였다. 제주의 자연은 정말 놀라웠고, 특히 협재 해변의 투명한 물과 하얀 모래는 마치 천국에 온 것 같았다. 오설록에서는 녹차의 향기를 마시며 마음이 차분해졌고, 한라산에서는 제주의 아름다운 풍경을 한눈에 볼 수 있었다. 이번 여행은 정말 잊을 수 없는 추억이 될 것 같다.',
      date: '2025년 9월 13일 금요일'
    }
  ]);

  // 일정 데이터(예: 여행 일정). 같은 날짜에 여러 개가 있으면 중복으로 카운트됩니다.
  // YYYY-MM-DD 포맷을 권장합니다.
  const [scheduleDates] = useState<string[]>([
    // 예시: '2025-09-13', '2025-09-14', '2025-09-14'
  ]);

  const handleWriteNewDiary = () => {
    router.push('/diary/write');
  };

  const toggleCalendar = () => {
    setShowCalendar(!showCalendar);
  };

  const goToHome = () => {
    router.push('/main');
  };

  const goToMyPage = () => {
    router.push('/mypage');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>일기</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleWriteNewDiary}>
            <Text style={styles.writeButton}>새 일기쓰기</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleCalendar} style={styles.calendarButton}>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 메인 콘텐츠 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {diaryEntries.map(entry => (
          <TouchableOpacity
            key={entry.id}
            style={styles.diaryEntry}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/diary/write',
                params: { title: entry.title, content: entry.content },
              })
            }
          >
            <Text style={styles.entryTitle}>{entry.title}</Text>
            <Text style={styles.entryContent} numberOfLines={1} ellipsizeMode="tail">
              {entry.content}
            </Text>
            <Text style={styles.entryDate}>{entry.date}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={goToHome}>
          <HomeOffIcon width={24} height={24} />
          <Text style={styles.navLabel}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <BookOnIcon width={24} height={24} />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>일기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={goToMyPage}>
          <UserOffIcon width={24} height={24} />
          <Text style={styles.navLabel}>마이페이지</Text>
        </TouchableOpacity>
      </View>

      {/* 캘린더 팝업 */}
      <CalendarPopup 
        visible={showCalendar} 
        onClose={toggleCalendar}
        scheduleDates={scheduleDates}
      />
    </SafeAreaView>
  );
};

// 캘린더 팝업 컴포넌트
interface CalendarPopupProps {
  visible: boolean;
  onClose: () => void;
  scheduleDates: string[];
}

const CalendarPopup: React.FC<CalendarPopupProps> = ({ visible, onClose, scheduleDates }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

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
    setSelectedDate(date);
  };

  // 해당 날짜에 포함된 일정 개수 계산 (동일 날짜가 여러 개면 2개까지 점 표시)
  const countSchedulesOnDate = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    return scheduleDates.filter(d => d === key).length;
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.calendarPopup}>
          {/* 팝업 헤더 */}
          <View style={styles.popupHeader}>
            <Text style={styles.popupTitle}>날짜 선택</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 월 네비게이션 */}
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={() => changeMonth('prev')}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthYear}>
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </Text>
            <TouchableOpacity onPress={() => changeMonth('next')}>
              <Text style={styles.navArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* 요일 헤더 */}
          <View style={styles.weekHeader}>
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <Text key={day} style={styles.weekDay}>{day}</Text>
            ))}
          </View>

          {/* 달력 그리드 */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const cnt = countSchedulesOnDate(date);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !isCurrentMonth(date) && styles.otherMonthDay
                  ]}
                  onPress={() => selectDate(date)}
                >
                  {isToday(date) && selectedDate.getTime() !== date.getTime() && <View style={styles.todayFilled} />}
                  {selectedDate.getTime() === date.getTime() && <View style={styles.selectedCircle} />}
                  <Text style={[
                    styles.dayText,
                    !isCurrentMonth(date) && styles.otherMonthDayText,
                    selectedDate.getTime() === date.getTime() && { color: '#ffffff', fontWeight: '700' },
                  ]}>
                    {date.getDate()}
                  </Text>
                  {cnt >= 1 && (
                    <View style={styles.scheduleDotsRow}>
                      <View style={[styles.scheduleDot, cnt >= 2 && { marginRight: 4 }]} />
                      {cnt >= 2 && <View style={styles.scheduleDot} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 선택된 날짜 표시 */}
          <View style={styles.selectedDateInfo}>
            <Text style={styles.selectedDateText}>
              선택된 날짜: {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// styles moved to styles.ts

export default DiaryPage;
