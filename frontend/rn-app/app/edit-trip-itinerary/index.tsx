import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, SafeAreaView, ActivityIndicator, Alert, ListRenderItemInfo
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { SwipeListView } from 'react-native-swipe-list-view';

// --- Interfaces ---
interface TripItineraryItem {
  id: number;
  trip_id: number;
  day: number;
  order_in_day: number;
  place_name: string;
  description?: string;
  start_time?: string;
  end_time?: string;
}

interface TripDetails {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  itinerary_items: TripItineraryItem[];
}

const { width } = Dimensions.get('window');

export default function EditTripItineraryPage() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { getTripDetails, deleteItineraryItem } = useAuth();

  const [tripData, setTripData] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);

  const fetchTripData = useCallback(async (preserveSelectedDay = false) => {
    if (typeof tripId !== 'string') return;
    setIsLoading(true);
    try {
      const data = await getTripDetails(tripId);
      if (data && data.itinerary_items) {
        setTripData(data);
        const newUniqueDays = [...new Set(data.itinerary_items.map((item: TripItineraryItem) => item.day))];
        if (preserveSelectedDay && newUniqueDays.includes(selectedDay)) {
          // Day is preserved
        } else if (data.itinerary_items.length > 0) {
          const earliestDay = Math.min(...data.itinerary_items.map((item: TripItineraryItem) => item.day));
          setSelectedDay(earliestDay);
        }
      } else {
        setTripData(data);
      }
    } catch (error) {
      console.error("Error fetching trip data:", error);
      Alert.alert("오류", "여행 정보를 불러오는데 실패했습니다.", [{ text: "확인", onPress: () => router.back() }]);
    }
    setIsLoading(false);
  }, [tripId, getTripDetails, router, selectedDay]);

  useEffect(() => {
    fetchTripData(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteItem = (itemToDelete: TripItineraryItem) => {
    if (typeof tripId !== 'string') return;
    Alert.alert(
      "일정 삭제",
      `'${itemToDelete.place_name}' 일정을 정말로 삭제하시겠습니까?`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const result = await deleteItineraryItem(tripId, itemToDelete.id);
            if (result) {
              fetchTripData(true); // Re-fetch data but preserve the day
            } else {
              Alert.alert("오류", "일정 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  if (isLoading || !tripData) {
    return <SafeAreaView style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#007AFF" /></SafeAreaView>;
  }

  const { title, start_date, end_date, itinerary_items = [] } = tripData;
  const uniqueDays = [...new Set(itinerary_items.map(item => item.day))].sort((a, b) => a - b);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.backButton}>←</Text></TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.regionText}>{title}</Text>
          <Text style={styles.dateRangeText}>{start_date} - {end_date}</Text>
        </View>
        <View style={styles.headerActions}>
          {/* Add any other actions specific to editing here */}
        </View>
      </View>

      <View style={styles.scheduleContent}>
        <View style={styles.dateSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {uniqueDays.map(day => (
              <TouchableOpacity 
                key={day}
                style={[styles.dayButton, selectedDay === day && styles.activeDayButton]}
                onPress={() => setSelectedDay(day)}
              >
                <Text style={[styles.dayButtonText, selectedDay === day && styles.activeDayButtonText]}>{`Day ${day}`}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <SwipeListView
          data={itinerary_items.filter((item: TripItineraryItem) => item.day === selectedDay).sort((a: TripItineraryItem, b: TripItineraryItem) => a.order_in_day - b.order_in_day)}
          keyExtractor={(item: TripItineraryItem) => item.id.toString()}
          renderItem={(data: ListRenderItemInfo<TripItineraryItem>) => (
            <View style={styles.scheduleItem}>
              <View style={styles.scheduleInfo}>
                <Text style={styles.locationText}>{data.item.order_in_day}. {data.item.place_name}</Text>
                <Text style={styles.timeText}>{data.item.start_time} - {data.item.end_time}</Text>
                <Text style={styles.descriptionText}>{data.item.description}</Text>
              </View>
            </View>
          )}
          renderHiddenItem={(data: ListRenderItemInfo<TripItineraryItem>) => (
            <View style={styles.rowBack}>
              <TouchableOpacity
                style={[styles.backRightBtn, styles.backRightBtnRight]}
                onPress={() => handleDeleteItem(data.item)}
              >
                <Text style={styles.backTextWhite}>삭제</Text>
              </TouchableOpacity>
            </View>
          )}
          rightOpenValue={-75}
          disableRightSwipe
          ListEmptyComponent={<View style={styles.centered}><Text>이 날짜의 일정이 없습니다.</Text></View>}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { fontSize: 24, color: '#333' },
  headerTitle: { alignItems: 'center' },
  regionText: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  dateRangeText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 15 },
  scheduleContent: { flex: 1 },
  dateSection: { paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dayButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E5E7EB', marginRight: 10 },
  activeDayButton: { backgroundColor: '#3B82F6' },
  dayButtonText: { color: '#374151', fontWeight: '500' },
  activeDayButtonText: { color: '#FFFFFF' },
  scheduleItem: { backgroundColor: '#FFFFFF', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  scheduleInfo: { flex: 1 },
  locationText: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  timeText: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  descriptionText: { fontSize: 14, color: '#4B5563' },
  rowBack: { alignItems: 'center', backgroundColor: '#EF4444', flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  backRightBtn: { alignItems: 'center', bottom: 0, justifyContent: 'center', position: 'absolute', top: 0, width: 75 },
  backRightBtnRight: { backgroundColor: '#EF4444', right: 0 },
  backTextWhite: { color: '#FFF', fontWeight: '600' },
});
