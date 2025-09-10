// 메인 페이지 (홈 - 달력, 여행 계획 목록)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { styles } from './styles';
import { useRouter } from 'expo-router';
// header & tab icons
import ARIcon from '../../assets/aricon.svg';
import NoticeOnIcon from '../../assets/noticeonicon.svg';
import NoticeOffIcon from '../../assets/noticeofficon.svg';
import HomeOnIcon from '../../assets/homeonicon.svg';
import HomeOffIcon from '../../assets/homeofficon.svg';
import BookOnIcon from '../../assets/bookonicon.svg';
import BookOffIcon from '../../assets/bookofficon.svg';
import UserOnIcon from '../../assets/useronicon.svg';
import UserOffIcon from '../../assets/userofficon.svg';
import TanslateIcon from '../../assets/tanslateicon.svg';

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
  // 알림 유무 (API 연동 전까지 임시 상태)
  const [hasNotification, setHasNotification] = useState(false);

  // 예시 데이터: 진행중/대기중/종료 각각 1개씩
  useEffect(() => {
    const today = new Date();
    const format = (d: Date) => {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}.${mm}.${dd}`;
    };

    const startOngoing = new Date(today);
    startOngoing.setDate(today.getDate() - 2);
    const endOngoing = new Date(today);
    endOngoing.setDate(today.getDate() + 2);

    const startUpcoming = new Date(today);
    startUpcoming.setDate(today.getDate() + 14);
    const endUpcoming = new Date(startUpcoming);
    endUpcoming.setDate(startUpcoming.getDate() + 2);

    const startEnded = new Date(today);
    startEnded.setDate(today.getDate() - 20);
    const endEnded = new Date(today);
    endEnded.setDate(today.getDate() - 15);

    setTripPlans([
      {
        id: 'ongoing-1',
        destination: '지역 (국가)',
        startDate: format(startOngoing),
        endDate: format(endOngoing),
        daysLeft: 0,
        participants: 4,
        leaderNickname: '닉네임'
      },
      {
        id: 'upcoming-1',
        destination: '지역 (국가)',
        startDate: format(startUpcoming),
        endDate: format(endUpcoming),
        daysLeft: 14,
        participants: 4,
        leaderNickname: '닉네임'
      },
      {
        id: 'ended-1',
        destination: '지역 (국가)',
        startDate: format(startEnded),
        endDate: format(endEnded),
        daysLeft: 0,
        participants: 4,
        leaderNickname: '닉네임'
      }
    ]);
  }, []);

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

  // 여행 상태 계산
  const getTripStatus = (startDateStr: string, endDateStr: string) => {
    const today = new Date();
    // 안전한 파싱: 'YYYY.MM.DD' → Date
    const [sy, sm, sd] = startDateStr.split('.').map(n => parseInt(n, 10));
    const [ey, em, ed] = endDateStr.split('.').map(n => parseInt(n, 10));
    const start = new Date(sy, (sm || 1) - 1, sd || 1);
    const end = new Date(ey, (em || 1) - 1, ed || 1);

    // 날짜만 비교하도록 시간 제거
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);
    const base = new Date(today);
    base.setHours(0,0,0,0);

    if (base < start) {
      const diffDays = Math.ceil((start.getTime() - base.getTime()) / (1000 * 60 * 60 * 24));
      return { label: `D-${diffDays}`, type: 'upcoming' as const };
    }
    if (base > end) {
      return { label: '종료', type: 'ended' as const };
    }
    const diffDays = Math.floor((base.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return { label: `${diffDays}일차`, type: 'ongoing' as const };
  };

  // 해당 날짜에 포함되는 여행 개수(겹치면 2개 이상)
  const countTripsOnDate = (date: Date) => {
    const base = new Date(date);
    base.setHours(0,0,0,0);
    return tripPlans.reduce((acc, trip) => {
      const [sy, sm, sd] = trip.startDate.split('.').map(n => parseInt(n, 10));
      const [ey, em, ed] = trip.endDate.split('.').map(n => parseInt(n, 10));
      const start = new Date(sy, (sm || 1) - 1, sd || 1);
      const end = new Date(ey, (em || 1) - 1, ed || 1);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      return acc + (base >= start && base <= end ? 1 : 0);
    }, 0);
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
          <View style={styles.headerRightIcons}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/translation')}>
              <TanslateIcon width={24} height={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <ARIcon width={24} height={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/notifications')}>
              {hasNotification ? (
                <NoticeOnIcon width={24} height={24} />
              ) : (
                <NoticeOffIcon width={24} height={24} />
              )}
            </TouchableOpacity>
          </View>
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
            {calendarDays.map((date, index) => {
              const cnt = countTripsOnDate(date);
              const isSelected = selectedDate.getTime() === date.getTime();
              const today = isToday(date);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !isCurrentMonth(date) && styles.otherMonthDay,
                  ]}
                  onPress={() => selectDate(date)}
                >
                  {today && !isSelected && <View style={styles.todayFilled} />}
                  {isSelected && <View style={styles.selectedCircle} />}
                  <Text style={[ 
                    styles.dayText,
                    !isCurrentMonth(date) && styles.otherMonthDayText,
                    isSelected && { color: '#ffffff', fontWeight: '700' },
                    cnt >= 1 && { marginBottom: 10 }
                  ]}>
                    {date.getDate()}
                  </Text>
                  {cnt >= 1 && (
                    <View style={{ position: 'absolute', bottom: 6, flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.tripDot, cnt >= 2 && { marginRight: 4 }]} />
                      {cnt >= 2 && <View style={styles.tripDot} />}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 여행 계획 섹션 */}
        <View style={styles.tripSection}>
          {tripPlans.filter(t => getTripStatus(t.startDate, t.endDate).type === 'ongoing').length > 0 && (
            <>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 8 }}>진행중인 여행</Text>
          {tripPlans.filter(t => getTripStatus(t.startDate, t.endDate).type === 'ongoing').map(trip => {
            const status = getTripStatus(trip.startDate, trip.endDate);
            return (
              <TouchableOpacity key={trip.id} style={[styles.tripCard, { borderColor: '#93c5fd', backgroundColor: '#f0f7ff' }]} onPress={() => goToTripDetail(trip.id)}>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripDestination}>{trip.destination}</Text>
                  <Text style={styles.tripDates}>{trip.startDate} ~ {trip.endDate}</Text>
                  <View style={styles.tripParticipants}>
                    <Text style={styles.participantsText}>{trip.participants}명 참여</Text>
                    <View style={styles.participantIcons}>
                      {Array.from({ length: Math.min(trip.participants, 5) }, (_, i) => (
                        <View key={i} style={[styles.participantIcon, i > 0 && styles.participantIconOverlap]} />
                      ))}
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, styles.statusBadgeOngoing]}>
                  <Text style={styles.statusBadgeText}>{status.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
            </>
          )}

          {/* 대기중인 여행 */}
          {tripPlans.filter(t => getTripStatus(t.startDate, t.endDate).type === 'upcoming').length > 0 && (
            <>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 8 }}>대기중인 여행</Text>
          {tripPlans.filter(t => getTripStatus(t.startDate, t.endDate).type === 'upcoming').map(trip => {
            const status = getTripStatus(trip.startDate, trip.endDate);
            return (
              <TouchableOpacity key={trip.id} style={styles.tripCard} onPress={() => goToTripDetail(trip.id)}>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripDestination}>{trip.destination}</Text>
                  <Text style={styles.tripDates}>{trip.startDate} ~ {trip.endDate}</Text>
                  <View style={styles.tripParticipants}>
                    <Text style={styles.participantsText}>{trip.participants}명 참여</Text>
                    <View style={styles.participantIcons}>
                      {Array.from({ length: Math.min(trip.participants, 5) }, (_, i) => (
                        <View key={i} style={[styles.participantIcon, i > 0 && styles.participantIconOverlap]} />
                      ))}
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, styles.statusBadgeUpcoming]}>
                  <Text style={styles.statusBadgeText}>{status.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
            </>
          )}

          {/* 종료된 여행 */}
          {tripPlans.filter(t => getTripStatus(t.startDate, t.endDate).type === 'ended').length > 0 && (
            <>
          <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, marginTop: 8 }}>종료된 여행</Text>
          {tripPlans.filter(t => getTripStatus(t.startDate, t.endDate).type === 'ended').map(trip => {
            const status = getTripStatus(trip.startDate, trip.endDate);
            return (
              <View key={trip.id} style={[styles.tripCard, { backgroundColor: '#f9fafb' }]}>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripDestination}>{trip.destination}</Text>
                  <Text style={styles.tripDates}>{trip.startDate} ~ {trip.endDate}</Text>
                  <View style={styles.tripParticipants}>
                    <Text style={styles.participantsText}>{trip.participants}명 참여</Text>
                    <View style={styles.participantIcons}>
                      {Array.from({ length: Math.min(trip.participants, 5) }, (_, i) => (
                        <View key={i} style={[styles.participantIcon, i > 0 && styles.participantIconOverlap]} />
                      ))}
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, styles.statusBadgeEnded]}>
                  <Text style={styles.statusBadgeText}>{status.label}</Text>
                </View>
              </View>
            );
          })}
            </>
          )}
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={styles.createTripButtonContainer}>
        <TouchableOpacity style={styles.createTripButton} onPress={goToCreateTrip}>
          <Text style={styles.createTripButtonText}>여행 계획 만들기</Text>
          <Text style={{ color: '#e6f0ff', fontSize: 12, marginTop: 4 }}>AI를 이용해 여행계획을 만들어보세요.</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem}>
          <HomeOnIcon width={24} height={24} />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/diary')}
        >
          <BookOffIcon width={24} height={24} />
          <Text style={styles.navLabel}>일기</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/mypage')}
        >
          <UserOffIcon width={24} height={24} />
          <Text style={styles.navLabel}>마이페이지</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// styles moved to styles.ts

export default MainPage;
