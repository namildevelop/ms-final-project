import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  writeButton: {
    fontSize: 16,
    color: '#3182ce',
    fontWeight: '600',
    marginRight: 15,
  },
  calendarButton: {
    padding: 8,
  },
  calendarIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  diaryEntry: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 12,
    lineHeight: 24,
  },
  entryContent: {
    fontSize: 14,
    color: '#4a5568',
    lineHeight: 20,
    marginBottom: 15,
  },
  entryDate: {
    fontSize: 14,
    color: '#3182ce',
    fontWeight: '500',
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
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarPopup: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  closeButton: {
    fontSize: 20,
    color: '#718096',
    padding: 5,
  },
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  navArrow: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: 'bold',
    padding: 5,
  },
  monthYear: {
    fontSize: 16,
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
    fontSize: 12,
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
  scheduleDotsRow: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#000000',
  },
  otherMonthDay: {
    opacity: 0.3,
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
  dayText: {
    color: '#1a202c',
    fontSize: 14,
    fontWeight: '500',
  },
  otherMonthDayText: {
    color: '#cbd5e0',
  },
  todayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  selectedDateInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  selectedDateText: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
  },
});



