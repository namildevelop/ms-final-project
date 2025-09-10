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
  dropdown: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    color: '#1a202c',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#4a5568',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 260,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
  },
  modalItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalItemText: {
    fontSize: 14,
    color: '#111827',
  },
});





