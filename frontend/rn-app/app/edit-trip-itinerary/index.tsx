import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';

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
  type: 'ITEM'; // To differentiate list item types
}

interface DayHeader {
  id: string; // Unique ID for the header, e.g., "day-1"
  day: number;
  type: 'DAY';
}

type ListItem = TripItineraryItem | DayHeader;

interface TripDetails {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  itinerary_items: TripItineraryItem[];
}

export default function EditTripItineraryPage() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { getTripDetails, deleteItineraryItem, updateItineraryOrder } = useAuth();

  const [tripData, setTripData] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listData, setListData] = useState<ListItem[]>([]);

  const fetchTripData = useCallback(async () => {
    if (typeof tripId !== 'string') return;
    setIsLoading(true);
    try {
      const data = await getTripDetails(tripId);
      if (data && data.itinerary_items) {
        // Map the fetched items to add the 'type' property, creating new objects.
        const itemsWithType: TripItineraryItem[] = data.itinerary_items.map((item: Omit<TripItineraryItem, 'type'>) => ({
          ...item,
          type: 'ITEM',
        }));
        setTripData({ ...data, itinerary_items: itemsWithType });
      } else {
        setTripData(data);
      }
    } catch (error) {
      console.error('Error fetching trip data:', error);
      Alert.alert('오류', '여행 정보를 불러오는데 실패했습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    }
    setIsLoading(false);
  }, [tripId, getTripDetails, router]);

  useEffect(() => {
    fetchTripData();
  }, [fetchTripData]);

  // This effect transforms the flat itinerary_items from tripData into a 
  // list with day headers, suitable for the DraggableFlatList.
  useEffect(() => {
    if (tripData && tripData.itinerary_items) {
      const allItems = tripData.itinerary_items;
      const uniqueDays = [...new Set(allItems.map((item) => item.day))].sort((a, b) => a - b);
      
      const newListData: ListItem[] = [];
      uniqueDays.forEach(day => {
        newListData.push({ type: 'DAY', day, id: `day-${day}` });
        const itemsForDay = allItems
          .filter(item => item.day === day)
          .sort((a, b) => a.order_in_day - b.order_in_day);
        newListData.push(...itemsForDay);
      });
      setListData(newListData);
    }
  }, [tripData]);

  const handleDeleteItem = (itemToDelete: TripItineraryItem) => {
    if (typeof tripId !== 'string') return;
    Alert.alert(
      '일정 삭제',
      `'${itemToDelete.place_name}' 일정을 정말로 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteItineraryItem(tripId, itemToDelete.id);
            if (result) {
              fetchTripData(); // Refetch data to ensure consistency
            } else {
              Alert.alert('오류', '일정 삭제에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const onDragEnd = async ({ data }: { data: ListItem[] }) => {
    setListData(data);

    let currentDay = -1;
    let orderInDay = 1;
    const newItineraryItems: TripItineraryItem[] = [];

    data.forEach(item => {
      if (item.type === 'DAY') {
        currentDay = item.day;
        orderInDay = 1;
      } else if (item.type === 'ITEM') {
        const updatedItem = { ...item, day: currentDay, order_in_day: orderInDay };
        newItineraryItems.push(updatedItem);
        orderInDay++;
      }
    });

    if (tripData && typeof tripId === 'string') {
      setTripData({ ...tripData, itinerary_items: newItineraryItems });

      const itemsToUpdate = newItineraryItems.map(item => ({
        id: item.id,
        day: item.day,
        order_in_day: item.order_in_day,
      }));

      const success = await updateItineraryOrder(tripId, itemsToUpdate);
      if (success) {
        Alert.alert("성공", "일정 순서가 저장되었습니다.");
      } else {
        Alert.alert("오류", "일정 순서 저장에 실패했습니다.");
        // Optionally, refetch data to revert optimistic update
        fetchTripData();
      }
    }
  };

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<ListItem>) => {
    // Render a non-draggable header for day separators
    if (item.type === 'DAY') {
      return (
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{`Day ${item.day}`}</Text>
        </View>
      );
    }

    const itineraryItem = item as TripItineraryItem;
    const renderRightActions = () => (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteItem(itineraryItem)}
      >
        <Text style={styles.deleteText}>삭제</Text>
      </TouchableOpacity>
    );

    return (
      <ScaleDecorator>
        <Swipeable renderRightActions={renderRightActions}>
          <View style={[styles.scheduleItem, isActive && styles.draggingItem]}>
            <View style={styles.scheduleInfo}>
              <Text style={styles.locationText}>{itineraryItem.place_name}</Text>
              <Text style={styles.timeText}>{itineraryItem.start_time} - {itineraryItem.end_time}</Text>
              <Text style={styles.descriptionText}>{itineraryItem.description}</Text>
            </View>
            {/* Drag handle is now on the right side */}
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              style={styles.dragHandle}
            >
              <Text style={{ fontSize: 22, color: '#888' }}>≡</Text>
            </TouchableOpacity>
          </View>
        </Swipeable>
      </ScaleDecorator>
    );
  }, [handleDeleteItem]);

  if (isLoading || !tripData) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  const { title, start_date, end_date } = tripData;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.regionText}>{title}</Text>
            <Text style={styles.dateRangeText}>{start_date} - {end_date}</Text>
          </View>
           <View style={{ width: 24 }} />{/* Placeholder for balance */}
        </View>

        {/* The single list for all days */}
        <DraggableFlatList
          data={listData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          onDragEnd={onDragEnd}
          ListEmptyComponent={<View style={styles.centered}><Text>이 여행의 일정이 없습니다.</Text></View>}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: { fontSize: 24, color: '#333' },
  headerTitle: { alignItems: 'center' },
  regionText: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  dateRangeText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  dayHeader: {
    padding: 15,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingLeft: 20, // Indent items slightly
    paddingRight: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  draggingItem: { backgroundColor: '#E0E7FF' },
  dragHandle: { 
    padding: 10, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleInfo: { flex: 1 },
  locationText: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  timeText: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  descriptionText: { fontSize: 14, color: '#4B5563' },
  deleteButton: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: '100%',
  },
  deleteText: {
    color: '#FFF',
    fontWeight: '600',
  },
});