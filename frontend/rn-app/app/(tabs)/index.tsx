import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import TranslateIcon from '../../assets/tanslateicon.svg';
import ArIcon from '../../assets/aricon.svg';
import NoticeOffIcon from '../../assets/noticeofficon.svg';
import { useAuth } from '../../src/context/AuthContext';

interface Trip {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  member_count: number;
}

const PRIMARY_SKY = '#1DA1F2';

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { getTrips } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchTrips = async () => {
        setIsLoading(true);
        const fetchedTrips = await getTrips();
        setTrips(fetchedTrips || []);
        setIsLoading(false);
      };
      fetchTrips();
    }, [getTrips])
  );

  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = [];
    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

    // Add blank days for the first week
    for (let i = 0; i < startingDayOfWeek; i++) {
      daysInMonth.push(null);
    }

    // Add all days of the current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      daysInMonth.push(new Date(year, month, i));
    }

    return daysInMonth;
  }, [currentDate]);

  const categorizedTrips = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming: Trip[] = [];
    const ongoing: Trip[] = [];
    const finished: Trip[] = [];

    trips.forEach(trip => {
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) {
        finished.push(trip);
      } else if (startDate > today) {
        upcoming.push(trip);
      } else {
        ongoing.push(trip);
      }
    });

    upcoming.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    ongoing.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    finished.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());

    return { upcoming, ongoing, finished };
  }, [trips]);

  const getTripDateDisplay = (trip: Trip, status: 'ongoing' | 'upcoming' | 'finished') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(trip.start_date);
    startDate.setHours(0, 0, 0, 0);

    if (status === 'ongoing') {
      const diffTime = Math.abs(today.getTime() - startDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return `${diffDays}일차`;
    }
    if (status === 'upcoming') {
      const diffTime = startDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `D-${diffDays}`;
    }
    return '종료';
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(1); // Avoid issues with month-end dates
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const hasTripOnDate = (date: Date) => {
    if (!date) return false;
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return trips.some(trip => {
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return checkDate >= start && checkDate <= end;
    });
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const renderTripCard = (trip: Trip, status: 'ongoing' | 'upcoming' | 'finished') => {
    const isFinished = status === 'finished';
    const dateText = getTripDateDisplay(trip, status);

    const countdownStyle = 
        status === 'ongoing' ? styles.ongoingCountdown :
        status === 'upcoming' ? styles.upcomingCountdown :
        styles.finishedCountdown;

    const countdownTextStyle = 
        status === 'ongoing' ? styles.ongoingCountdownText :
        status === 'upcoming' ? styles.upcomingCountdownText :
        styles.finishedCountdownText;

    const formatTripDate = (start: string, end: string) => {
        const startDate = start.replace(/-/g, '.');
        const endDate = end.replace(/-/g, '.');
        return `${startDate} ~ ${endDate}`;
    };

    return (
      <TouchableOpacity
        key={trip.id}
        style={[styles.tripCard, isFinished && styles.finishedTripCard, status==='ongoing' && styles.ongoingTripCard]}
        onPress={() => !isFinished && router.push(`/trip-itinerary/${trip.id}`)}
        disabled={isFinished}
      >
        <View style={styles.tripInfo}>
          <Text style={[styles.tripDestination, isFinished && styles.finishedText]}>{trip.title}</Text>
          <Text style={[styles.tripDates, isFinished && styles.finishedText]}>
            {formatTripDate(trip.start_date, trip.end_date)}
          </Text>
          <View style={styles.memberRow}>
            <Text style={[styles.memberCount, isFinished && styles.finishedText]}>
              {trip.member_count}명 참여
            </Text>
            <View style={styles.avatarStack}>
              {[0,1,2,3,4].map((i) => (
                <View key={i} style={[styles.avatarCircle, { left: i * 16 }]} />
              ))}
            </View>
          </View>
        </View>
        <View style={countdownStyle}>
          <Text style={countdownTextStyle}>{dateText}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.homeTitle}>홈</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity accessibilityLabel="번역" style={styles.iconButton} onPress={() => router.push('/translation')}>
              <TranslateIcon width={22} height={22} />
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel="AR" style={styles.iconButton} onPress={() => router.push('/translation/image')}>
              <ArIcon width={22} height={22} />
            </TouchableOpacity>
            <TouchableOpacity accessibilityLabel="알림" style={styles.iconButton} onPress={() => router.push('/notifications')}>
              <NoticeOffIcon width={22} height={22} />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Calendar Section */}
        <View style={styles.calendarContainer}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.monthArrow}>
              <Text style={styles.monthArrowText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthYearText}>
              {`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
            </Text>
            <TouchableOpacity onPress={() => changeMonth('next')} style={styles.monthArrow}>
              <Text style={styles.monthArrowText}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekHeader}>
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarData.map((date, index) => (
              <View key={index} style={styles.dayCell}>
                {date && (
                  <TouchableOpacity 
                    style={[
                      styles.dayButton,
                      isToday(date) && styles.todayButton,
                      selectedDate.getTime() === date.getTime() && styles.selectedDayButton
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[
                      styles.dayText,
                      isToday(date) && styles.todayText,
                      selectedDate.getTime() === date.getTime() && styles.selectedDayText
                    ]}>
                      {date.getDate()}
                    </Text>
                    {hasTripOnDate(date) && <View style={styles.tripDot} />}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tripSection}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <>
              {categorizedTrips.ongoing.length > 0 && (
                <View style={styles.tripCategory}>
                  <Text style={styles.sectionTitle}>진행중인 여행</Text>
                  {categorizedTrips.ongoing.map(trip => renderTripCard(trip, 'ongoing'))}
                </View>
              )}

              {categorizedTrips.upcoming.length > 0 && (
                <View style={styles.tripCategory}>
                  <Text style={styles.sectionTitle}>대기중인 여행</Text>
                  {categorizedTrips.upcoming.map(trip => renderTripCard(trip, 'upcoming'))}
                </View>
              )}

              {categorizedTrips.finished.length > 0 && (
                <View style={styles.tripCategory}>
                  <Text style={styles.sectionTitle}>종료된 여행</Text>
                  {categorizedTrips.finished.map(trip => renderTripCard(trip, 'finished'))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={styles.stickyCreateButton}
        onPress={() => router.push('/create-trip')}
      >
        <Text style={styles.stickyCreateButtonTitle}>여행 계획 만들기</Text>
        <Text style={styles.stickyCreateButtonCaption}>AI를 이용해 여행계획을 만들어보세요.</Text>
      </TouchableOpacity>
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
  homeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#a5a5a5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  monthArrow: {
    padding: 8,
  },
  monthArrowText: {
    fontSize: 22,
    color: '#8e8e93',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#8e8e93',
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
  tripDot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#000000',
  },
  tripSection: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Ensure scroll content is above sticky button
  },
  tripCategory: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1a202c',
    marginBottom: 15,
    marginTop: 10,
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
  finishedTripCard: {
    backgroundColor: '#f7fafc',
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
  memberCount: {
    fontSize: 14,
    color: '#4a5568',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarStack: {
    width: 90,
    height: 24,
    position: 'relative',
  },
  avatarCircle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  finishedText: {
    color: '#a0aec0',
  },
  ongoingCountdown: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
  },
  ongoingCountdownText: {
    color: '#2b6cb0',
    fontSize: 24,
    fontWeight: '600',
  },
  upcomingCountdown: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
  },
  upcomingCountdownText: {
    color: '#e11d48',
    fontSize: 24,
    fontWeight: '600',
  },
  finishedCountdown: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
  },
  finishedCountdownText: {
    color: '#718096',
    fontSize: 24,
    fontWeight: '600',
  },
  stickyCreateButton: {
    position: 'absolute',
    bottom: 20,
    left: '15%',
    right: '15%',
    backgroundColor: PRIMARY_SKY,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  stickyCreateButtonTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  stickyCreateButtonCaption: {
    color: '#eaf6ff',
    fontSize: 12,
    marginTop: 4,
  },
  ongoingTripCard: {
    borderColor: '#87cefa',
  },
});

export default HomeScreen;
