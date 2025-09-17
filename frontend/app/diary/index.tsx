// /diary/index.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator, RefreshControl, Image, Alert } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
// import { SwipeRow } from 'react-native-swipe-list-view';
import HomeOffIcon from '../../assets/homeofficon.svg';
import BookOnIcon from '../../assets/bookonicon.svg';
import UserOffIcon from '../../assets/userofficon.svg';
import { styles } from '../../src/styles/styles';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date_iso: string;       // e.g., "2025-09-13"
  date_human: string;     // e.g., "2025년 9월 13일 금요일"
  thumbnail_url?: string; // optional
}

import { API_BASE } from '../../src/lib/apiBase';


const DiaryPage: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [diaries, setDiaries] = useState<DiaryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDiaries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/diaries`);
      const data = await res.json();
      setDiaries(data.items ?? []);
    } catch (e) {
      console.warn('Failed to fetch diaries', e);
    } finally {
      setLoading(false);
    }
  };

  // 첫 로드 + 화면 포커스 시 새로고침
  useFocusEffect(
    useCallback(() => {
      fetchDiaries();
    }, [])
  );

  // 작성 뒤 돌아오며 ?refresh=1 같은 파라미터가 오면 재조회
  useEffect(() => {
    if (params.refresh) fetchDiaries();
  }, [params.refresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDiaries();
    setRefreshing(false);
  };

  const handleWriteNewDiary = () => {
    router.push('/diary/write');
  };

  const goToHome = () => router.push('/');
  const goToMyPage = () => router.push('/diary');

  // 일기 삭제 함수
  const deleteDiary = async (diaryId: string, diaryTitle: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/diaries/${diaryId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // 목록에서 즉시 제거
        setDiaries(prev => prev.filter(item => item.id !== diaryId));
        console.log('일기 삭제 성공:', diaryTitle);
      } else {
        throw new Error('삭제 실패');
      }
    } catch (error) {
      console.error('일기 삭제 중 오류:', error);
      Alert.alert('삭제 실패', '일기 삭제 중 문제가 발생했습니다.');
    }
  };

  // 삭제 확인 다이얼로그
  const confirmDelete = (diaryId: string, diaryTitle: string) => {
    Alert.alert(
      '일기 삭제',
      `"${diaryTitle}" 일기를 삭제하시겠습니까?\n\n삭제된 일기는 복구할 수 없습니다.`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteDiary(diaryId, diaryTitle),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>일기</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleWriteNewDiary}>
            <Text style={styles.writeButton}>새 일기쓰기</Text>
          </TouchableOpacity>
          <View style={styles.calendarButton}><Text style={styles.calendarIcon}>📅</Text></View>
        </View>
      </View>

      {/* 목록 */}
      {loading ? (
        <View style={{flex:1, alignItems:'center', justifyContent:'center'}}><ActivityIndicator /></View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {diaries.map(entry => (
            <View key={entry.id} style={styles.diaryEntry}>
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/diary/write',
                    params: { // 기존 일기 편집/재생성용 프리필
                      id: entry.id,
                      title: entry.title,
                      content: entry.content,
                      date_iso: entry.date_iso,
                      thumbnail_url: entry.thumbnail_url || ''
                    }
                  })
                }
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {/* 썸네일 이미지 */}
                  {entry.thumbnail_url && (
                    <Image
                      source={{ uri: entry.thumbnail_url }}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        marginRight: 12,
                        backgroundColor: '#f0f0f0'
                      }}
                      resizeMode="cover"
                    />
                  )}
                  
                  {/* 텍스트 정보 */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryTitle} numberOfLines={1}>{entry.title}</Text>
                    <Text style={styles.entryContent} numberOfLines={1} ellipsizeMode="tail">
                      {entry.content}
                    </Text>
                    <Text style={styles.entryDate}>{entry.date_human}</Text>
                  </View>
                  
                  {/* 삭제 버튼 */}
                  <TouchableOpacity
                    onPress={() => confirmDelete(entry.id, entry.title)}
                    style={{
                      padding: 8,
                      borderRadius: 4,
                      backgroundColor: '#ff4444'
                    }}
                  >
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>삭제</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navItem} onPress={goToHome}>
          <HomeOffIcon width={24} height={24} />
          <Text style={styles.navLabel}>홈</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <BookOnIcon width={24} height={24} />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>일기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={goToMyPage}>
          <UserOffIcon width={24} height={24} />
          <Text style={styles.navLabel}>마이페이지</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default DiaryPage;
