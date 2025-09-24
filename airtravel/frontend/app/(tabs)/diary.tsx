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
        <Text style={styles.diaryTitle}>{item.title}</Text>
        <Text style={styles.diaryDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 일기</Text>
        <TouchableOpacity onPress={() => router.push('/diary/write')} style={styles.writeButton}>
          <Text style={styles.writeButtonText}>일기 쓰기</Text>
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
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  writeButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  writeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  diaryItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
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
  diaryDate: {
    fontSize: 14,
    color: '#666',
  },
});

export default DiaryScreen;
