import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb'
  },
  backButton: { padding: 4 },
  backIcon: { fontSize: 18, color: '#1f2937' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1f2937' },
  scroll: { flex: 1 },

  card: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', padding: 14
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardMessage: { fontSize: 12, color: '#6b7280' },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionButton: { borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1 },
  primary: { borderColor: '#2563eb', backgroundColor: '#2563eb' },
  primaryText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  secondary: { borderColor: '#cbd5e1', backgroundColor: '#fff' },
  secondaryText: { color: '#1f2937', fontSize: 12, fontWeight: '600' },
});





