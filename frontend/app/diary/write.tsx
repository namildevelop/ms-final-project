// /diary/write.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { API_BASE } from '../../src/lib/apiBase';
const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

export default function DiaryWriteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 날짜 초기값: 파라미터에 date_iso가 있으면 그 날짜, 없으면 오늘
  const today = useMemo(() => {
    if (typeof params.date_iso === 'string') {
      const d = new Date(params.date_iso);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [params.date_iso]);

  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth() + 1);
  const [day, setDay] = useState<number>(today.getDate());
  const [openDropdown, setOpenDropdown] = useState<'year' | 'month' | 'day' | null>(null);

  const [title, setTitle] = useState<string>(typeof params.title === 'string' ? params.title : '');
  const [content, setContent] = useState<string>(typeof params.content === 'string' ? params.content : '');

  // 이미지 상태: 로컬사진 or AI이미지URL 중 하나만 사용
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  
  // 기존 일기의 AI 이미지 복원
  useEffect(() => {
    if (typeof params.thumbnail_url === 'string' && params.thumbnail_url.trim()) {
      setAiImageUrl(params.thumbnail_url);
      console.log('기존 AI 이미지 복원:', params.thumbnail_url);
      console.log('aiImageUrl 상태 설정됨:', params.thumbnail_url);
    }
  }, [params.thumbnail_url]);
  
  // aiImageUrl 상태 변화 디버그
  useEffect(() => {
    console.log('aiImageUrl 상태 변경:', aiImageUrl);
  }, [aiImageUrl]);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // 2020~2025 (역순)
  const yearOptions = useMemo(() => range(2020, 2025).reverse(), []);
  const monthOptions = useMemo(() => range(1, 12), []);
  const dayOptions = useMemo(() => range(1, 31), []);

  const weekdayLabel = useMemo(() => {
    const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const selectedDate = new Date(year, month - 1, day);
    return weekdayNames[selectedDate.getDay()];
  }, [year, month, day]);

  const dateISO = useMemo(() => {
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }, [year, month, day]);

  const openAlbum = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '사진 접근 권한을 허용해주세요.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setLocalPhotoUri(result.assets[0].uri);
      setAiImageUrl(null); // 배타 처리
    }
  };

  const removeImage = () => {
    setLocalPhotoUri(null);
    setAiImageUrl(null);
  };

  const generateAiImage = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('내용 필요', '제목 또는 내용을 입력한 뒤 이미지를 생성해주세요.');
      return;
    }
    try {
      setGenerating(true);
      setLocalPhotoUri(null); // 배타 처리
      // 서버에 제목/내용 전달 → 이미지 URL 수신
      const res = await fetch(`${API_BASE}/api/diaries/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      console.log('이미지 생성 응답:', data); // 디버그 로그
      setAiImageUrl(data.image_url); // 서버가 반환하는 URL
      console.log('aiImageUrl 상태 설정:', data.image_url); // 디버그 로그
    } catch (e) {
      Alert.alert('생성 실패', '이미지 생성 중 문제가 발생했어요.');
      setAiImageUrl(null);
    } finally {
      setGenerating(false);
    }
  };

  const onSave = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert('필수 항목', '제목과 내용을 입력해주세요.');
      return;
    }
    
    // 디버그 로그 추가
    console.log('저장 시 상태 확인:');
    console.log('- localPhotoUri:', localPhotoUri);
    console.log('- aiImageUrl:', aiImageUrl);
    console.log('- title:', title);
    console.log('- content:', content);
    
    try {
      setSaving(true);

      // 로컬사진이 있으면 multipart/form-data
      if (localPhotoUri) {
        const fd = new FormData();
        fd.append('title', title);
        fd.append('content', content);
        fd.append('date_iso', dateISO);
        // @ts-ignore: RN FormData File
        fd.append('photo', {
          uri: localPhotoUri,
          name: 'photo.jpg',
          type: 'image/jpeg',
        });

        const res = await fetch(`${API_BASE}/api/diaries`, {
          method: 'POST',
          body: fd,
          headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) throw new Error('save failed');
      }
      // AI 이미지가 있으면 URL만 전달
      else if (aiImageUrl) {
        console.log('AI 이미지 저장 시도:', aiImageUrl); // 디버그 로그
        const res = await fetch(`${API_BASE}/api/diaries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title, content, date_iso: dateISO, ai_image_url: aiImageUrl,
          }),
        });
        if (!res.ok) throw new Error('save failed');
        console.log('AI 이미지 저장 성공'); // 디버그 로그
      }
      // 텍스트만 저장
      else {
        console.log('텍스트만 저장 시도'); // 디버그 로그
        const res = await fetch(`${API_BASE}/api/diaries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, content, date_iso: dateISO }),
        });
        if (!res.ok) throw new Error('save failed');
        console.log('텍스트만 저장 성공'); // 디버그 로그
      }

      // 저장 성공 → 목록으로 돌아가며 새로고침 트리거
      router.replace('/diary?refresh=1');
    } catch (e) {
      Alert.alert('저장 실패', '일기 저장 중 문제가 발생했어요.');
    } finally {
      setSaving(false);
    }
  };

  const SaveButton = () => (
    <TouchableOpacity style={stylesLocal.saveButton} onPress={onSave} disabled={saving}>
      {saving ? <ActivityIndicator color="#fff" /> : <Text style={stylesLocal.saveButtonText}>저장</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={stylesLocal.container}>
      {/* 헤더 */}
      <View style={stylesLocal.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={stylesLocal.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={stylesLocal.headerTitle}>일기 작성</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={stylesLocal.scroll} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* 날짜 선택 */}
        <View style={stylesLocal.dropdownRow}>
          {/* 연 */}
          <View style={stylesLocal.dropdown}>
            <TouchableOpacity style={stylesLocal.dropdownHeader} onPress={() => setOpenDropdown(openDropdown === 'year' ? null : 'year')}>
              <Text style={stylesLocal.dropdownText}>{year}년</Text><Text style={stylesLocal.caret}>▾</Text>
            </TouchableOpacity>
            {openDropdown === 'year' && (
              <View style={stylesLocal.dropdownMenu}>
                <ScrollView style={{ maxHeight: 160 }}>
                  {yearOptions.map(y => (
                    <TouchableOpacity key={y} onPress={() => { setYear(y); setOpenDropdown(null); }}>
                      <Text style={[stylesLocal.dropdownItem, year === y && stylesLocal.dropdownItemActive]}>{y}년</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          {/* 월 */}
          <View style={stylesLocal.dropdown}>
            <TouchableOpacity style={stylesLocal.dropdownHeader} onPress={() => setOpenDropdown(openDropdown === 'month' ? null : 'month')}>
              <Text style={stylesLocal.dropdownText}>{month}월</Text><Text style={stylesLocal.caret}>▾</Text>
            </TouchableOpacity>
            {openDropdown === 'month' && (
              <View style={stylesLocal.dropdownMenu}>
                <ScrollView style={{ maxHeight: 160 }}>
                  {monthOptions.map(m => (
                    <TouchableOpacity key={m} onPress={() => { setMonth(m); setOpenDropdown(null); }}>
                      <Text style={[stylesLocal.dropdownItem, month === m && stylesLocal.dropdownItemActive]}>{m}월</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
          {/* 일 */}
          <View style={stylesLocal.dropdown}>
            <TouchableOpacity style={stylesLocal.dropdownHeader} onPress={() => setOpenDropdown(openDropdown === 'day' ? null : 'day')}>
              <Text style={stylesLocal.dropdownText}>{day}일</Text><Text style={stylesLocal.caret}>▾</Text>
            </TouchableOpacity>
            {openDropdown === 'day' && (
              <View style={stylesLocal.dropdownMenu}>
                <ScrollView style={{ maxHeight: 160 }}>
                  {dayOptions.map(d => (
                    <TouchableOpacity key={d} onPress={() => { setDay(d); setOpenDropdown(null); }}>
                      <Text style={[stylesLocal.dropdownItem, day === d && stylesLocal.dropdownItemActive]}>{d}일</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={stylesLocal.weekdayBox}>
            <Text style={stylesLocal.weekdayText}>{weekdayLabel}</Text>
          </View>
        </View>

        {/* 제목/내용 */}
        <View style={stylesLocal.inputBox}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="제목 쓰기"
            placeholderTextColor="#9ca3af"
            style={stylesLocal.titleInput}
          />
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="일기 내용 쓰기"
            placeholderTextColor="#9ca3af"
            style={stylesLocal.contentInput}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* 이미지 미리보기 */}
        {localPhotoUri && (
          <View style={stylesLocal.imageWrapper}>
            <Image source={{ uri: localPhotoUri }} style={stylesLocal.image} resizeMode="cover" />
            <TouchableOpacity style={stylesLocal.removeBadge} onPress={removeImage}>
              <Text style={stylesLocal.removeBadgeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        {aiImageUrl && (
          <View style={stylesLocal.imageWrapper}>
            <Image 
              source={{ 
                uri: aiImageUrl,
                cache: 'force-cache'  // 캐시된 이미지 강제 사용
              }} 
              style={stylesLocal.image} 
              resizeMode="cover"
              onLoad={() => console.log('AI 이미지 로드 성공:', aiImageUrl)}
              onError={(error) => {
                console.log('AI 이미지 로드 실패:', error, aiImageUrl);
                // URL 만료 시 이미지 제거
                setAiImageUrl(null);
              }}
            />
            <TouchableOpacity style={stylesLocal.removeBadge} onPress={removeImage}>
              <Text style={stylesLocal.removeBadgeText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 버튼 영역: 배타 로직 */}
        <View style={stylesLocal.buttonRow}>
          {!localPhotoUri && !aiImageUrl && (
            <>
              <TouchableOpacity style={stylesLocal.secondaryButton} onPress={openAlbum}>
                <Text style={stylesLocal.secondaryButtonText}>사진 추가</Text>
              </TouchableOpacity>
              <TouchableOpacity style={stylesLocal.secondaryButton} onPress={generateAiImage} disabled={generating}>
                {generating ? <ActivityIndicator /> : <Text style={stylesLocal.secondaryButtonText}>일기 이미지 생성</Text>}
              </TouchableOpacity>
            </>
          )}

          {(localPhotoUri || aiImageUrl) && (
            <>
              <TouchableOpacity style={[stylesLocal.secondaryButton, {flex:1}]} onPress={removeImage}>
                <Text style={stylesLocal.secondaryButtonText}>다시 생성하기</Text>
              </TouchableOpacity>
              {aiImageUrl && (
                <TouchableOpacity style={stylesLocal.secondaryDangerButton} onPress={removeImage}>
                  <Text style={stylesLocal.secondaryDangerText}>삭제하기</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* 안내 */}
        <View style={stylesLocal.noticeBox}>
          <Text style={stylesLocal.noticeText}>· '일기 이미지'는 아래 작성된 일기 내용을 바탕으로 이미지를 생성합니다.</Text>
          <Text style={stylesLocal.noticeText}>· 사진을 추가하면 이미지 생성은 할 수 없습니다.</Text>
        </View>
      </ScrollView>

      <SaveButton />
    </SafeAreaView>
  );
}

// (기존 스타일 유지 — 네 코드 레이아웃 기반)
const stylesLocal = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, borderBottomWidth:1, borderBottomColor:'#e5e7eb' },
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

  inputBox: { marginTop: 14, marginHorizontal: 16, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, minHeight: 360, padding: 16, backgroundColor: '#fafafa' },
  titleInput: { color: '#111827', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  contentInput: { color: '#111827', fontSize: 14, lineHeight: 20, minHeight: 280 },

  imageWrapper: { marginTop: 16, marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  image: { width: '100%', height: 220, backgroundColor: '#e5e7eb' },
  removeBadge: { position: 'absolute', right: 8, top: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  removeBadgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  buttonRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 16 },
  secondaryButton: { flex: 1, borderWidth: 1, borderColor: '#2563eb', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondaryButtonText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
  secondaryDangerButton: { flex: 1, borderWidth: 1, borderColor: '#ef4444', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  secondaryDangerText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },

  noticeBox: { marginTop: 10, paddingHorizontal: 16 },
  noticeText: { color: '#6b7280', fontSize: 12, marginTop: 2 },

  saveButton: { position: 'absolute', left: 16, right: 16, bottom: 24, backgroundColor: '#2563eb', borderRadius: 10, alignItems: 'center', paddingVertical: 14 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

