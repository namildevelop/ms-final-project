import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  backIcon: {
    fontSize: 20,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    fontSize: 16,
    fontWeight: '600',
  },
  langRow: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  swapBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  swapIcon: {
    fontSize: 18,
  },
  actions: {
    marginTop: 80,
    paddingHorizontal: 24,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#111827',
  },
});

// ✅ RNPickerSelect 스타일 추가
export const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    color: '#1a202c',
    paddingRight: 30,
    backgroundColor: 'white',
    width: 120,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    color: '#1a202c',
    paddingRight: 30,
    backgroundColor: 'white',
    width: 120,
  },
});
