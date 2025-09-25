import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, SafeAreaView } from 'react-native';
import { useAuth, Diary } from '../../src/context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';

const DiaryScreen = () => {
  const router = useRouter();
  const { getDiaries } = useAuth();
  const [diaries, setDiaries] = useState<Diary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDiaries = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedDiaries = await getDiaries();
      setDiaries(fetchedDiaries);
    } catch (error) {
      console.error("Failed to fetch diaries:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getDiaries]);

  useFocusEffect(
    useCallback(() => {
      fetchDiaries();
    }, [fetchDiaries])
  );

  const renderItem = ({ item }: { item: Diary }) => (
    <TouchableOpacity style={styles.diaryItem} onPress={() => router.push(`/diary/${item.id}`)}>
      <Image source={{ uri: item.photo_path || item.ai_image_url || 'https://via.placeholder.com/150' }} style={styles.thumbnail} />
      <View style={styles.diaryInfo}>
        <Text style={styles.diaryTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.diarySnippet} numberOfLines={1} ellipsizeMode="tail">{item.content}</Text>
        <Text style={styles.diaryDate}>{new Date(item.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>일기</Text>
        <TouchableOpacity onPress={() => router.push('/diary/write')} style={styles.writeButton}>
          <Text style={styles.writeButtonText}>새 일기 쓰기</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={diaries}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<View style={styles.centered}><Text>작성된 일기가 없습니다.</Text></View>}
      />
    </SafeAreaView>
  );
};

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
  },
  writeButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#1f8cff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  writeButtonText: {
    color: '#1f8cff',
    fontWeight: 'bold',
  },
  diaryItem: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginVertical: 0,
    marginHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  diaryInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  diaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  diarySnippet: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 4,
  },
  diaryDate: {
    fontSize: 14,
    color: '#4a5568',
  },
});

export default DiaryScreen;
