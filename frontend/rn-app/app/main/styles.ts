import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 24,
  },
  calendarSection: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navArrow: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    color: '#9ca3af',
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
    paddingBottom: 10,
  },
  todayFilled: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1f8cff',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  otherMonthDay: {
    opacity: 0.5,
  },
  selectedCircle: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1f8cff',
    top: '50%',
    left: '50%',
    marginTop: -14,
    marginLeft: -14,
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  dayText: {
    color: '#1a202c',
    fontSize: 14,
    fontWeight: '500',
  },
  otherMonthDayText: {
    color: '#cbd5e0',
  },
  calendarDotsRow: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#000000',
  },
  tripSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 8,
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
  tripCardOngoing: {
    borderColor: '#93c5fd',
    backgroundColor: '#f0f7ff',
  },
  tripCardEnded: {
    backgroundColor: '#f9fafb',
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
    alignItems: 'center',
  },
  participantIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#cbd5e0',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  participantIconOverlap: {
    marginLeft: -8,
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
  // 상태 배지 (진행중/대기중/D-DAY/종료)
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  statusBadgeOngoing: {
    backgroundColor: '#2563eb',
  },
  statusBadgeUpcoming: {
    backgroundColor: '#ef4444',
  },
  statusBadgeEnded: {
    backgroundColor: '#cbd5e0',
  },
  statusBadgeText: {
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
  // 하단 고정 버튼
  createTripButtonContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 80,
    alignItems: 'center',
  },
  createTripButton: {
    backgroundColor: '#1f8cff',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    width: '78%',
  },
  createTripButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  createTripButtonSubText: {
    color: '#e6f0ff',
    fontSize: 12,
    marginTop: 4,
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
  activeNavIcon: {
    color: '#3182ce',
  },
  navLabel: {
    fontSize: 12,
    color: '#4a5568',
  },
  activeNavLabel: {
    color: '#3182ce',
  },
});



