// 새 일기 작성 페이지
import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export default function DiaryWriteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [day, setDay] = useState<number>(today.getDate());
  const [openDropdown, setOpenDropdown] = useState<'year' | 'month' | 'day' | null>(null);

  const [title, setTitle] = useState<string>(typeof params.title === 'string' ? params.title : '');
  const [content, setContent] = useState<string>(typeof params.content === 'string' ? params.content : '');

  const [pickedImage, setPickedImage] = useState<string | null>(null);
  const [aiImageGenerated, setAiImageGenerated] = useState<boolean>(false);

  // 2020~2025 범위 (사용자 요청: 2025-2020)
  const yearOptions = useMemo(() => range(2020, 2025).reverse(), []);
  const monthOptions = useMemo(() => range(1, 12), []);
  const dayOptions = useMemo(() => range(1, 31), []);

  // 선택된 날짜의 요일 라벨
  const weekdayLabel = useMemo(() => {
    const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const selectedDate = new Date(year, month - 1, day);
    return weekdayNames[selectedDate.getDay()];
  }, [year, month, day]);

  const openAlbum = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPickedImage(result.assets[0].uri);
      setAiImageGenerated(false);
    }
  };

  const removeImage = () => {
    setPickedImage(null);
    setAiImageGenerated(false);
  };

  const generateAiImage = () => {
    // 실제 AI 연동 전까지는 더미 상태만 전환
    setPickedImage(null);
    setAiImageGenerated(true);
  };

  const resetToAddButtons = () => {
    setPickedImage(null);
    setAiImageGenerated(false);
  };

  const SaveButton = () => (
    <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
      <Text style={styles.saveButtonText}>저장</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일기 작성</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 날짜 드롭다운 */}
        <View style={styles.dropdownRow}>
          {/* 연 */}
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}
            >
              <Text style={styles.dropdownText}>{year}년</Text>
              <Text style={styles.caret}>▾</Text>
            </TouchableOpacity>
            {openDropdown === 'year' && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={{ maxHeight: 160 }}>
                  {yearOptions.map(y => (
                    <TouchableOpacity key={y} onPress={() => { setYear(y); setOpenDropdown(null); }}>
                      <Text style={[styles.dropdownItem, year === y && styles.dropdownItemActive]}>{y}년</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 월 */}
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}
            >
              <Text style={styles.dropdownText}>{month}월</Text>
              <Text style={styles.caret}>▾</Text>
            </TouchableOpacity>
            {openDropdown === 'month' && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={{ maxHeight: 160 }}>
                  {monthOptions.map(m => (
                    <TouchableOpacity key={m} onPress={() => { setMonth(m); setOpenDropdown(null); }}>
                      <Text style={[styles.dropdownItem, month === m && styles.dropdownItemActive]}>{m}월</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 일 */}
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setOpenDropdown(openDropdown === 'day' ? null : 'day')}
            >
              <Text style={styles.dropdownText}>{day}일</Text>
              <Text style={styles.caret}>▾</Text>
            </TouchableOpacity>
            {openDropdown === 'day' && (
              <View style={styles.dropdownMenu}>
                <ScrollView style={{ maxHeight: 160 }}>
                  {dayOptions.map(d => (
                    <TouchableOpacity key={d} onPress={() => { setDay(d); setOpenDropdown(null); }}>
                      <Text style={[styles.dropdownItem, day === d && styles.dropdownItemActive]}>{d}일</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 선택된 날짜의 요일 */}
          <View style={styles.weekdayBox}>
            <Text style={styles.weekdayText}>{weekdayLabel}</Text>
          </View>
        </View>

        {/* 제목/내용 입력 구역 */}
        <View style={styles.inputBox}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="제목 쓰기"
            placeholderTextColor="#9ca3af"
            style={styles.titleInput}
          />
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="일기 내용 쓰기"
            placeholderTextColor="#9ca3af"
            style={styles.contentInput}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* 이미지 프리뷰 레이아웃 */}
        {pickedImage && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: pickedImage }} style={styles.image} resizeMode="cover" />
            <TouchableOpacity style={styles.removeBadge} onPress={removeImage}>
              <Text style={styles.removeBadgeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 버튼 영역 */}
        <View style={styles.buttonRow}>
          {!pickedImage && !aiImageGenerated && (
            <>
              <TouchableOpacity style={styles.secondaryButton} onPress={openAlbum}>
                <Text style={styles.secondaryButtonText}>사진 추가</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={generateAiImage}>
                <Text style={styles.secondaryButtonText}>일기 이미지 생성</Text>
              </TouchableOpacity>
            </>
          )}

          {pickedImage && (
            <TouchableOpacity style={[styles.secondaryButton, styles.centerWideButton]} onPress={resetToAddButtons}>
              <Text style={styles.secondaryButtonText}>다시 생성하기</Text>
            </TouchableOpacity>
          )}

          {!pickedImage && aiImageGenerated && (
            <>
              <TouchableOpacity style={styles.secondaryButton} onPress={resetToAddButtons}>
                <Text style={styles.secondaryButtonText}>다시 생성하기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryDangerButton} onPress={resetToAddButtons}>
                <Text style={styles.secondaryDangerText}>삭제하기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* 안내 문구 */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>· '일기 이미지'는 아래 작성된 일기 내용을 바탕으로 이미지를 생성합니다.</Text>
          <Text style={styles.noticeText}>· 사진을 추가하면 이미지 생성은 할 수 없습니다.</Text>
        </View>
      </ScrollView>

      <SaveButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  backIcon: { fontSize: 20, color: '#111827' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  scroll: { flex: 1 },

  dropdownRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 16, alignItems: 'center' },
  dropdown: { width: 90, position: 'relative' },
  dropdownHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f3f4f6', borderRadius: 10, padding: 10 },
  dropdownText: { color: '#111827', fontSize: 14, fontWeight: '500' },
  caret: { color: '#6b7280', fontSize: 12 },
  dropdownMenu: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, zIndex: 10 },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: 12, color: '#6b7280', fontSize: 14 },
  dropdownItemActive: { color: '#2563eb', fontWeight: '700' },
  weekdayBox: { marginLeft: 6 },
  weekdayText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },

  inputBox: {
    marginTop: 14, marginHorizontal: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    minHeight: 360, padding: 16, backgroundColor: '#fafafa'
  },
  titleInput: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  contentInput: { color: '#111827', fontSize: 14, lineHeight: 20, minHeight: 280 },

  imageWrapper: { marginTop: 16, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: 220, backgroundColor: '#e5e7eb' },
  removeBadge: {
    position: 'absolute', right: 8, top: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center'
  },
  removeBadgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  buttonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  centerWideButton: { flex: 1 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: '#2563eb', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  secondaryDangerButton: { flex: 1, borderWidth: 1, borderColor: '#ef4444', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondaryDangerText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },

  noticeBox: { marginTop: 10, paddingHorizontal: 16 },
  noticeText: { color: '#6b7280', fontSize: 12, marginTop: 2 },

  saveButton: {
    position: 'absolute', left: 16, right: 16, bottom: 24,
    backgroundColor: '#2563eb', borderRadius: 10, alignItems: 'center', paddingVertical: 14,
  },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});


