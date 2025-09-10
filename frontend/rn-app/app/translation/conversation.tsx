import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const LANG_OPTIONS = ['영어', '한국어', '중국어', '일본어'];

const Dropdown: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ width: 120 }}>
      <TouchableOpacity style={styles.dropdown} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={styles.dropdownText}>{value}</Text>
        <Text style={styles.dropdownArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{label}</Text>
            {LANG_OPTIONS.map((opt) => (
              <Pressable
                key={opt}
                style={styles.modalItem}
                onPress={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                <Text style={styles.modalItemText}>{opt}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const TranslationConversation: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();

  const [fromLang, setFromLang] = useState('영어');
  const [toLang, setToLang] = useState('한국어');

  useEffect(() => {
    if (params?.from && typeof params.from === 'string') setFromLang(params.from);
    if (params?.to && typeof params.to === 'string') setToLang(params.to);
  }, [params]);

  const [sourceMessages] = useState<string[]>(['hello.', '“Ayy, bruh! Damn, it’s real good to see you!”']);
  const [translatedMessages] = useState<string[]>(['안녕하세요.', '야, 브로! 와, 진짜 반갑다!']);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* 위쪽 원본 영역 */}
        <View style={styles.section}>
          <View style={styles.bubblesArea}>
            {sourceMessages.map((m, idx) => (
              <View key={idx} style={[styles.bubble, styles.bubbleBlue]}>
                <Text style={styles.bubbleTextDark}>{m}</Text>
                <Text style={styles.speakerIcon}>🔊</Text>
              </View>
            ))}
          </View>
          <View style={styles.controlRow}>
            <Dropdown label="원본 언어" value={fromLang} onChange={setFromLang} />
            <TouchableOpacity style={styles.micBtn}>
              <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 구분선 */}
        <View style={styles.separator} />

        {/* 아래쪽 번역 영역 */}
        <View style={styles.section}>
          <View style={styles.bubblesArea}>
            {translatedMessages.map((m, idx) => (
              <View key={idx} style={[styles.bubble, styles.bubbleGray]}>
                <Text style={styles.bubbleTextDark}>{m}</Text>
                <Text style={styles.speakerIcon}>🔊</Text>
              </View>
            ))}
          </View>
          <View style={styles.controlRow}>
            <Dropdown label="대상 언어" value={toLang} onChange={setToLang} />
            <TouchableOpacity style={styles.micBtn}>
              <Text style={styles.micIcon}>🎤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { padding: 8 },
  closeIcon: { fontSize: 18 },
  section: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 16 },
  bubblesArea: { gap: 10, paddingTop: 8, paddingBottom: 8 },
  bubble: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubbleBlue: { backgroundColor: '#e5f0ff', borderWidth: 0, },
  bubbleGray: { backgroundColor: '#f3f4f6', borderWidth: 0, },
  bubbleTextDark: { color: '#111827', fontSize: 14, flex: 1, marginRight: 8 },
  speakerIcon: { fontSize: 14, color: '#111827' },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  dropdown: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { fontSize: 14, color: '#1a202c' },
  dropdownArrow: { fontSize: 14, color: '#4a5568' },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: { fontSize: 18, color: '#ffffff' },
  separator: { height: 1, backgroundColor: '#e5e7eb' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: 260, backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12 },
  modalTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#374151' },
  modalItem: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  modalItemText: { fontSize: 14, color: '#111827' },
});

export default TranslationConversation;


