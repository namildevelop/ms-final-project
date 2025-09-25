import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, Diary } from '../../src/context/AuthContext';

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export default function DiaryDetailScreen() {
  const { diaryId } = useLocalSearchParams();
  const router = useRouter();
  const { getDiaries, deleteDiary } = useAuth(); // getDiaries is used to fetch all, then filter
  const [diary, setDiary] = useState<Diary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'year' | 'month' | 'day' | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<number | null>(null);

  const yearOptions = useMemo(() => range(2020, 2025).reverse(), []);
  const monthOptions = useMemo(() => range(1, 12), []);
  const dayOptions = useMemo(() => range(1, 31), []);

  useEffect(() => {
    const fetchDiaryDetails = async () => {
      setIsLoading(true);
      try {
        // For simplicity, fetching all diaries and finding the one by ID.
        // In a real app, you might have a getDiaryById API call.
        const allDiaries = await getDiaries();
        const foundDiary = allDiaries.find(d => d.id.toString() === diaryId);
        setDiary(foundDiary || null);
        if (foundDiary && foundDiary.date) {
          const d = new Date(foundDiary.date);
          if (!isNaN(d.getTime())) {
            setYear(d.getFullYear());
            setMonth(d.getMonth() + 1);
            setDay(d.getDate());
          }
        }
      } catch (error) {
        console.error("Failed to fetch diary details:", error);
        Alert.alert("오류", "일기 상세 정보를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (diaryId) {
      fetchDiaryDetails();
    }
  }, [diaryId, getDiaries]);

  const handleDelete = async () => {
    if (!diary) return;

    Alert.alert(
      "일기 삭제",
      "정말로 이 일기를 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          onPress: async () => {
            setIsDeleting(true);
            try {
              const success = await deleteDiary(diary.id);
              if (success) {
                Alert.alert("성공", "일기가 삭제되었습니다.");
                router.back(); // Go back to the diary list
              } else {
                Alert.alert("오류", "일기 삭제에 실패했습니다.");
              }
            } catch (error) {
              console.error("Failed to delete diary:", error);
              Alert.alert("오류", "일기 삭제 중 문제가 발생했습니다.");
            } finally {
              setIsDeleting(false);
            }
          },
          style: "destructive",
        },
      ],
      { cancelable: true }
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!diary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text>일기를 찾을 수 없습니다.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>뒤로 가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더: 좌측 정렬 타이틀 + 우측 삭제 */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>일기 작성</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} disabled={isDeleting}>
          {isDeleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteButtonText}>삭제</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 날짜 입력 섹션 */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionLabel}>날짜 입력</Text>
          <View style={styles.dropdownRow}>
            <View style={styles.dropdown}>
              <TouchableOpacity style={styles.dropdownHeader} onPress={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}>
                <Text style={styles.dropdownText}>{year ?? ''}년</Text><Text style={styles.caret}>▾</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dropdown}>
              <TouchableOpacity style={styles.dropdownHeader} onPress={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}>
                <Text style={styles.dropdownText}>{month ?? ''}월</Text><Text style={styles.caret}>▾</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dropdown}>
              <TouchableOpacity style={styles.dropdownHeader} onPress={() => setOpenDropdown(openDropdown === 'day' ? null : 'day')}>
                <Text style={styles.dropdownText}>{day ?? ''}일</Text><Text style={styles.caret}>▾</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 제목/내용 표시 섹션 */}
        <View style={styles.inputBox}>
          <Text style={styles.title}>{diary.title}</Text>
          <Text style={styles.content}>{diary.content}</Text>
        </View>
        <View style={styles.sectionDivider} />

        {/* 이미지 섹션 */}
        {diary.photo_path || diary.ai_image_url ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: diary.photo_path || diary.ai_image_url }} style={styles.image} resizeMode="cover" />
          </View>
        ) : (
          <View style={[styles.imageWrapper, styles.noImageContainer]}>
            <Text style={styles.noImageText}>이미지 없음</Text>
          </View>
        )}

        {/* 버튼 / 안내 (디자인만) */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>사진 추가</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>일기 이미지 생성</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>· '일기 이미지'는 아래 작성된 일기 내용을 바탕으로 이미지를 생성합니다.</Text>
          <Text style={styles.noticeText}>· 사진과 '생성 이미지' 등은 한장만 등록 가능 합니다.</Text>
          <Text style={styles.noticeText}>· 이미지 생성은 하루 3회만 가능 합니다.</Text>
        </View>
        <View style={[styles.sectionDivider, { marginTop: 8 }]} />
      </ScrollView>

      {/* 저장 버튼 (디자인만) */}
      <TouchableOpacity style={styles.saveButton} disabled>
        <Text style={styles.saveButtonText}>저장하기</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1a202c' },
  backButton: { padding: 8 },
  backButtonText: { fontSize: 24, color: '#4a5568' },
  deleteButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontWeight: 'bold',
  },
  scrollView: { flex: 1 },
  dateSection: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  sectionLabel: { color: '#111827', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  dropdownRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dropdown: { width: 90, position: 'relative' },
  dropdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#111827' },
  dropdownText: { color: '#111827', fontSize: 14, fontWeight: '500' },
  caret: { color: '#6b7280', fontSize: 12 },
  dropdownMenu: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, zIndex: 10 },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, color: '#6b7280', fontSize: 14 },
  dropdownItemActive: { color: '#2563eb', fontWeight: '700' },
  image: { width: '100%', height: 220, backgroundColor: '#e5e7eb' },
  noImageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#666',
    fontSize: 16,
  },
  inputBox: { marginTop: 0, marginHorizontal: 0, borderWidth: 0, borderRadius: 0, minHeight: 300, padding: 16, backgroundColor: 'transparent', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  title: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  content: { color: '#111827', fontSize: 14, lineHeight: 20 },
  sectionDivider: { height: 1, backgroundColor: '#e5e7eb' },
  imageWrapper: { marginTop: 16, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  buttonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: '#2563eb', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  noticeBox: { marginTop: 10, paddingHorizontal: 16 },
  noticeText: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  saveButton: { position: 'absolute', left: 16, right: 16, bottom: 24, backgroundColor: '#000000', borderRadius: 10, alignItems: 'center', paddingVertical: 14 },
  saveButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
