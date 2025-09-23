import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Modal, TextInput, FlatList, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth, Place } from '../../src/context/AuthContext';
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
  id: string; // e.g., "day-1"
  day: number;
  type: 'DAY';
  dateString: string;
}

type ListItem = TripItineraryItem | DayHeader;

interface TripDetails {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  itinerary_items: TripItineraryItem[];
}

interface AddItineraryModalProps {
  visible: boolean;
  onClose: () => void;
  tripId: string | string[] | undefined;
  tripData: TripDetails | null;
  onItineraryAdded: () => void;
}

// --- Main Page Component ---
export default function EditTripItineraryPage() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { getTripDetails, deleteItineraryItem, updateItineraryOrder } = useAuth();

  const [tripData, setTripData] = useState<TripDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listData, setListData] = useState<ListItem[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchTripData = useCallback(async () => {
    if (typeof tripId !== 'string') return;
    if(!isModalVisible) setIsLoading(true);
    try {
      const data = await getTripDetails(tripId);
      if (data && data.itinerary_items) {
        const itemsWithType: TripItineraryItem[] = data.itinerary_items.map((item: Omit<TripItineraryItem, 'type'>) => ({ ...item, type: 'ITEM' }));
        setTripData({ ...data, itinerary_items: itemsWithType });
      } else {
        setTripData(data);
      }
    } catch (error) {
      console.error('Error fetching trip data:', error);
      Alert.alert('오류', '여행 정보를 불러오는데 실패했습니다.', [{ text: '확인', onPress: () => router.back() }]);
    } finally {
      if(!isModalVisible) setIsLoading(false);
    }
  }, [tripId, getTripDetails, router, isModalVisible]);

  useEffect(() => {
    fetchTripData();
  }, [fetchTripData]);

  useEffect(() => {
    if (tripData && tripData.itinerary_items) {
      const allItems = tripData.itinerary_items;
      const uniqueDays = [...new Set(allItems.map((item) => item.day))].sort((a, b) => a - b);
      const startDate = new Date(tripData.start_date);
      const newListData: ListItem[] = [];
      uniqueDays.forEach(day => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day - 1);
        const dateString = `${currentDate.getMonth() + 1}월 ${currentDate.getDate()}일`;
        newListData.push({ type: 'DAY', day, id: `day-${day}`, dateString });
        const itemsForDay = allItems.filter(item => item.day === day).sort((a, b) => a.order_in_day - b.order_in_day);
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
      const itemsToUpdate = newItineraryItems.map(item => ({ id: item.id, day: item.day, order_in_day: item.order_in_day }));
      const success = await updateItineraryOrder(tripId, itemsToUpdate);
      if (!success) {
        Alert.alert("오류", "일정 순서 저장에 실패했습니다.");
        fetchTripData();
      }
    }
  };

  const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<ListItem>) => {
    if (item.type === 'DAY') {
      return (
        <View style={styles.dayHeader}>
          <Text style={styles.dayHeaderText}>{item.dateString}</Text>
        </View>
      );
    }
    const itineraryItem = item as TripItineraryItem;
    const formatTime = (timeStr?: string) => timeStr ? timeStr.substring(0, 5) : '';
    return (
      <ScaleDecorator>
        <Swipeable renderRightActions={() => (
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(itineraryItem)}>
            <Text style={styles.deleteText}>삭제</Text>
          </TouchableOpacity>
        )}>
          <View style={[styles.scheduleItem, isActive && styles.draggingItem]}>
            <View style={styles.scheduleInfo}>
              <Text style={styles.locationText}>{itineraryItem.place_name}</Text>
              <Text style={styles.timeText}>{formatTime(itineraryItem.start_time)} - {formatTime(itineraryItem.end_time)}</Text>
            </View>
            <TouchableOpacity onLongPress={drag} disabled={isActive} style={styles.dragHandle}>
              <Text style={{ fontSize: 22, color: '#888' }}>≡</Text>
            </TouchableOpacity>
          </View>
        </Swipeable>
      </ScaleDecorator>
    );
  }, [handleDeleteItem]);

  if (isLoading || !tripData) {
    return <SafeAreaView style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#007AFF" /></SafeAreaView>;
  }

  const { title, start_date, end_date } = tripData;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.regionText}>{title}</Text>
            <Text style={styles.dateRangeText}>{start_date} - {end_date}</Text>
          </View>
           <View style={{ width: 24 }} />
        </View>

        <View style={{ flex: 1 }}>
          <DraggableFlatList
            data={listData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            onDragEnd={onDragEnd}
            ListEmptyComponent={<View style={styles.centered}><Text>이 여행의 일정이 없습니다.</Text></View>}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        </View>

        <View style={styles.addButtonContainer}>
          <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
            <Text style={styles.addButtonText}>일정 추가</Text>
          </TouchableOpacity>
        </View>

        <AddItineraryModal 
          visible={isModalVisible} 
          onClose={() => setIsModalVisible(false)} 
          tripId={tripId}
          tripData={tripData}
          onItineraryAdded={fetchTripData}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// --- Modal Component ---
const AddItineraryModal = ({ visible, onClose, tripId, tripData, onItineraryAdded }: AddItineraryModalProps) => {
  const { searchPlaces, createItineraryItem } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      Alert.alert("검색 오류", "검색할 장소를 입력해주세요.");
      return;
    }
    Keyboard.dismiss();
    setIsSearching(true);
    const results = await searchPlaces(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddItem = async (place: Place) => {
    if (!tripData || typeof tripId !== 'string') {
      Alert.alert("오류", "일정을 추가할 여행 정보를 찾을 수 없습니다.");
      return;
    }

    let nextDay = 1;
    let nextOrderInDay = 1;

    if (tripData.itinerary_items && tripData.itinerary_items.length > 0) {
      const lastItem = [...tripData.itinerary_items].sort((a, b) => {
        if (a.day !== b.day) return a.day - b.day;
        return a.order_in_day - b.order_in_day;
      }).pop();

      if(lastItem) {
        nextDay = lastItem.day;
        nextOrderInDay = lastItem.order_in_day + 1;
      }
    }

    const newItem = {
      day: nextDay,
      order_in_day: nextOrderInDay,
      place_name: place.name,
      address: place.formatted_address,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
    };

    const success = await createItineraryItem(tripId, newItem);
    if (success) {
      Alert.alert("성공", "일정이 추가되었습니다.");
      onItineraryAdded(); // Callback to refresh data on the parent
      onClose(); // Close modal
    } else {
      Alert.alert("오류", "일정 추가에 실패했습니다.");
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>일정 추가</Text>
                <View style={{ width: 24 }} />
              </View>
              <View style={styles.modalContent}>
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="장소를 검색하세요."
                    placeholderTextColor="#999"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                  />
                  <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>검색</Text>
                  </TouchableOpacity>
                </View>
                {isSearching ? (
                  <ActivityIndicator size="large" color="#007AFF" style={{marginTop: 20}}/>
                ) : (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.place_id}
                    renderItem={({ item }) => (
                      <View style={styles.resultItem}>
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultName}>{item.name}</Text>
                          <Text style={styles.resultAddress}>{item.formatted_address}</Text>
                        </View>
                        <TouchableOpacity style={styles.modalAddButton} onPress={() => handleAddItem(item)}>
                          <Text style={styles.modalAddButtonText}>추가</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    ListEmptyComponent={<View><Text style={styles.emptyText}>검색 결과가 없습니다.</Text></View>}
                  />
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  backButton: { fontSize: 24, color: '#333' },
  headerTitle: { alignItems: 'center' },
  regionText: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  dateRangeText: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  dayHeader: {
    paddingTop: 20, paddingBottom: 10, paddingHorizontal: 15, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  dayHeaderText: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  scheduleItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingLeft: 20, paddingRight: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  draggingItem: { backgroundColor: '#E0E7FF' },
  dragHandle: { padding: 10, alignItems: 'center', justifyContent: 'center' },
  scheduleInfo: { flex: 1 },
  locationText: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  timeText: { fontSize: 14, color: '#6B7280', marginBottom: 6 },
  deleteButton: {
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', width: 75, height: '100%',
  },
  deleteText: { color: '#FFF', fontWeight: '600' },
  addButtonContainer: {
    position: 'absolute', bottom: 30, left: 20, right: 20, alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#3B82F6', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '95%',
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: { fontSize: 20, color: '#333' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalContent: { flex: 1, paddingTop: 10 },
  searchContainer: { flexDirection: 'row', marginBottom: 20 },
  searchInput: {
    flex: 1, height: 50, borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#FFFFFF', fontSize: 16,
  },
  searchButton: {
    marginLeft: 10, height: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: '#3B82F6', borderRadius: 8, paddingHorizontal: 20,
  },
  searchButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  resultItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  resultInfo: { flex: 1, marginRight: 10 },
  resultName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  resultAddress: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  modalAddButton: {
    backgroundColor: '#10B981', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12,
  },
  modalAddButtonText: { color: '#FFFFFF', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#6B7280' },
});
