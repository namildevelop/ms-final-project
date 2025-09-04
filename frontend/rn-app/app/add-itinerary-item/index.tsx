import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth, Place } from '../../src/context/AuthContext';

interface TripDetails {
  id: number;
  itinerary_items: { day: number; order_in_day: number }[];
}

export default function AddItineraryItemPage() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { searchPlaces, createItineraryItem, getTripDetails } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tripData, setTripData] = useState<TripDetails | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      if (typeof tripId === 'string') {
        const details = await getTripDetails(tripId);
        setTripData(details);
      }
    };
    fetchTrip();
  }, [tripId, getTripDetails]);

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
      Alert.alert("성공", "일정이 추가되었습니다.", [
        { text: "확인", onPress: () => router.back() },
      ]);
    } else {
      Alert.alert("오류", "일정 추가에 실패했습니다.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>일정 추가</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
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
            <ActivityIndicator size="large" color="#007AFF" />
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
                  <TouchableOpacity style={styles.addButton} onPress={() => handleAddItem(item)}>
                    <Text style={styles.addButtonText}>추가하기</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<View><Text style={styles.emptyText}>검색 결과가 없습니다.</Text></View>}
            />
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
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
  backButton: {
    fontSize: 24,
    color: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    height: 50,
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultInfo: {
    flex: 1,
    marginRight: 10,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  resultAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#6B7280',
  },
});