import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

interface TripPlan {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  daysLeft: number;
  participants: number;
  leaderNickname: string;
}

const MainPage: React.FC = () => {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tripPlans, setTripPlans] = useState<TripPlan[]>([]);

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

  // 여행 계획 상세 페이지로 이동
  const goToTripDetail = (tripId: string) => {
    router.push(`/trip-detail/${tripId}`);
  };

  // 여행 계획 만들기 페이지로 이동
  const goToCreateTrip = () => {
    router.push('/create-trip');
  };

  // 여행 계획이 있는 날짜인지 확인
  const hasTripOnDate = (date: Date) => {
    return tripPlans.some(trip => {
      const start = new Date(trip.startDate);
      const end = new Date(trip.endDate);
      return date >= start && date <= end;
    });
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
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>
            <Text style={styles.titleAir}>Air</Text> Travel
          </Text>
          <TouchableOpacity style={styles.cameraButton}>
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>
        </View>

        {/* 달력 섹션 */}
        <View style={styles.calendarSection}>
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
            {calendarDays.map((date, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  !isCurrentMonth(date) && styles.otherMonthDay,
                  isToday(date) && styles.today,
                  selectedDate.getTime() === date.getTime() && styles.selectedDay
                ]}
                onPress={() => selectDate(date)}
              >
                <Text style={[
                  styles.dayText,
                  !isCurrentMonth(date) && styles.otherMonthDayText,
                  isToday(date) && styles.todayText
                ]}>
                  {date.getDate()}
                </Text>
                {hasTripOnDate(date) && <View style={styles.tripDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 여행 계획 섹션 */}
        <View style={styles.tripSection}>
          {tripPlans.length > 0 ? (
            tripPlans.map(trip => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripCard}
                onPress={() => goToTripDetail(trip.id)}
              >
                <View style={styles.tripInfo}>
                  <Text style={styles.tripDestination}>{trip.destination}</Text>
                  <Text style={styles.tripDates}>
                    {trip.startDate} - {trip.endDate}
                  </Text>
                  <View style={styles.tripParticipants}>
                    <Text style={styles.participantsText}>
                      [{trip.leaderNickname}]외 {trip.participants - 1}명
                    </Text>
                    <View style={styles.participantIcons}>
                      {Array.from({ length: trip.participants }, (_, i) => (
                        <View key={i} style={styles.participantIcon} />
                      ))}
                    </View>
                  </View>
                </View>
                <View style={styles.tripCountdown}>
                  <Text style={styles.countdownText}>D-{trip.daysLeft}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <TouchableOpacity style={styles.createTripCard} onPress={goToCreateTrip}>
              <Text style={styles.createTripIcon}>+</Text>
              <Text style={styles.createTripTitle}>여행 계획 만들기</Text>
              <Text style={styles.createTripSubtitle}>
                쉽게 AI에게 여행 계획을 만들어달라고 해보세요.
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={styles.navLabel}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📖</Text>
          <Text style={styles.navLabel}>일기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>👤</Text>
          <Text style={styles.navLabel}>마이페이지</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
  },
  titleAir: {
    color: '#3182ce',
  },
  cameraButton: {
    padding: 8,
  },
  cameraIcon: {
    fontSize: 24,
  },
  calendarSection: {
    backgroundColor: '#3182ce',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navArrow: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  today: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: 36,
    height: 36,
  },
  selectedDay: {
    backgroundColor: '#e2e8f0',
    borderRadius: 20,
    width: 36,
    height: 36,
  },
  dayText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  otherMonthDayText: {
    color: '#cbd5e0',
  },
  todayText: {
    color: '#3182ce',
    fontWeight: 'bold',
  },
  tripDot: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  tripSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  tripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tripInfo: {
    flex: 1,
  },
  tripDestination: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 8,
  },
  tripDates: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 8,
  },
  tripParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 14,
    color: '#718096',
    marginRight: 10,
  },
  participantIcons: {
    flexDirection: 'row',
  },
  participantIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#cbd5e0',
    marginRight: 4,
  },
  tripCountdown: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  countdownText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  createTripCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  createTripIcon: {
    fontSize: 48,
    color: '#718096',
    marginBottom: 15,
  },
  createTripTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 10,
  },
  createTripSubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#4a5568',
  },
});

export default MainPage;
