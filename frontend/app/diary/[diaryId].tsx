import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, Diary } from '../../src/context/AuthContext';

export default function DiaryDetailScreen() {
  const { diaryId } = useLocalSearchParams();
  const router = useRouter();
  const { getDiaries, deleteDiary } = useAuth(); // getDiaries is used to fetch all, then filter
  const [diary, setDiary] = useState<Diary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchDiaryDetails = async () => {
      setIsLoading(true);
      try {
        // For simplicity, fetching all diaries and finding the one by ID.
        // In a real app, you might have a getDiaryById API call.
        const allDiaries = await getDiaries();
        const foundDiary = allDiaries.find(d => d.id.toString() === diaryId);
        setDiary(foundDiary || null);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>일기 상세</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton} disabled={isDeleting}>
          {isDeleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteButtonText}>삭제</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {diary.photo_path || diary.ai_image_url ? (
          <Image 
            source={{ uri: diary.photo_path || diary.ai_image_url }} 
            style={styles.image} 
            resizeMode="cover" 
          />
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>이미지 없음</Text>
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{diary.title}</Text>
          <Text style={styles.date}>{new Date(diary.date).toLocaleDateString()}</Text>
          <Text style={styles.content}>{diary.content}</Text>
        </View>
      </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#e0e0e0',
  },
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
  contentContainer: {
    padding: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  date: {
    fontSize: 14,
    color: '#888',
    marginBottom: 15,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
});
