import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { styles } from './styles';
import { useRouter } from 'expo-router';

const LANG_OPTIONS = ['영어', '한국어', '중국어', '일본어'];

const Dropdown: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);

  return (
    <View style={{ width: 140 }}>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
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

const TranslationScreen: React.FC = () => {
  const router = useRouter();
  const [fromLang, setFromLang] = useState('영어');
  const [toLang, setToLang] = useState('한국어');

  const swapLanguages = () => {
    setFromLang((prev) => {
      const temp = toLang;
      setToLang(prev);
      return temp;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>통역/번역하기</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* 언어 선택 */}
        <View style={styles.langRow}>
          <Dropdown label="원본 언어" value={fromLang} onChange={setFromLang} />
          <TouchableOpacity style={styles.swapBtn} onPress={swapLanguages}>
            <Text style={styles.swapIcon}>↔︎</Text>
          </TouchableOpacity>
          <Dropdown label="대상 언어" value={toLang} onChange={setToLang} />
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: '/translation/conversation',
                params: { from: fromLang, to: toLang },
              })
            }
          >
            <Text style={styles.actionText}>대화 통역</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { marginTop: 20 }]}
            activeOpacity={0.9}
            onPress={() =>
              router.push({
                pathname: '/translation/image',
                params: { from: fromLang, to: toLang },
              })
            }
          >
            <Text style={styles.actionText}>이미지 번역</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// styles moved to styles.ts

export default TranslationScreen;


