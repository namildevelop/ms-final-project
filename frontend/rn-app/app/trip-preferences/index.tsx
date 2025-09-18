import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

const TripPreferencesPage: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { createTrip } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // 교통방식 선택 (중복 선택 가능)
  const [selectedTransportation, setSelectedTransportation] = useState<string[]>([]);
  
  // 관심사 선택 (중복 선택 가능)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  // 숙박 선택 (중복 선택 가능)
  const [selectedAccommodation, setSelectedAccommodation] = useState<string[]>([]);
  
  // 최신 트렌드 반영 (체크박스)
  const [reflectTrends, setReflectTrends] = useState(false);

  // 교통방식 옵션
  const transportationOptions = ['차량(렌트)', '대중교통', '도보'];
  
  // 관심사 옵션
  const interestOptions = [
    '문화/역사', '자연/경치', '쇼핑', '음식/맛집', 
    '엔터테인먼트', '휴양/힐링', '액티비티/스포츠', 
    '무장애관광', '반려동물동반'
  ];
  
  // 숙박 옵션
  const accommodationOptions = ['호텔', '리조트', '게스트하우스', '펜션'];

  // 교통방식 토글
  const toggleTransportation = (option: string) => {
    setSelectedTransportation(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  // 관심사 토글
  const toggleInterest = (option: string) => {
    setSelectedInterests(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  // 숙박 토글
  const toggleAccommodation = (option: string) => {
    setSelectedAccommodation(prev => 
      prev.includes(option) 
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  // 완료 버튼 핸들러
  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const tripData = {
        title: `${params.region} 여행`, // Example title
        start_date: params.startDate,
        end_date: params.endDate,
        destination_country: params.country,
        destination_city: params.region,
        transport_method: selectedTransportation.join(', '),
        accommodation: selectedAccommodation.join(', '),
        interests: selectedInterests,
        trend: reflectTrends,
      };

      const newTrip = await createTrip(tripData);

      if (newTrip) {
        router.replace({ 
          pathname: '/ai-planning',
          params: { tripId: newTrip.id }
        });
      } else {
        Alert.alert('오류', '여행 생성에 실패했습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '여행 생성 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이전 버튼 핸들러
  const handlePrevious = () => {
    router.back();
  };

  // 선택된 옵션인지 확인하는 함수
  const isSelected = (option: string, selectedArray: string[]) => {
    return selectedArray.includes(option);
  };

  // 버튼 스타일 생성 함수
  const getButtonStyle = (option: string, selectedArray: string[]) => {
    return [
      styles.optionButton,
      isSelected(option, selectedArray) && styles.selectedOptionButton
    ];
  };

  // 버튼 텍스트 스타일 생성 함수
  const getButtonTextStyle = (option: string, selectedArray: string[]) => {
    return [
      styles.optionButtonText,
      isSelected(option, selectedArray) && styles.selectedOptionButtonText
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handlePrevious} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>여행 계획 만들기</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 교통방식 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>교통방식</Text>
          <View style={styles.optionsContainer}>
            {transportationOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={getButtonStyle(option, selectedTransportation)}
                onPress={() => toggleTransportation(option)}
              >
                <Text style={getButtonTextStyle(option, selectedTransportation)}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 관심사 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관심사</Text>
          <View style={styles.optionsContainer}>
            {interestOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={getButtonStyle(option, selectedInterests)}
                onPress={() => toggleInterest(option)}
              >
                <Text style={getButtonTextStyle(option, selectedInterests)}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 숙박 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>숙박</Text>
          <View style={styles.optionsContainer}>
            {accommodationOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={getButtonStyle(option, selectedAccommodation)}
                onPress={() => toggleAccommodation(option)}
              >
                <Text style={getButtonTextStyle(option, selectedAccommodation)}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 최신 트렌드 반영 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최신 트렌드 반영</Text>
          <TouchableOpacity 
            style={styles.checkboxRow}
            onPress={() => setReflectTrends(!reflectTrends)}
          >
            <View style={[styles.checkbox, reflectTrends && styles.checkboxChecked]}>
              {reflectTrends && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxText}>반영하기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 하단 버튼 영역 */}
      <View style={styles.buttonContainer}>
        <Text style={styles.infoText}>완료를 누르면 AI가 일정을 추천해줍니다.</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.previousButton}
            onPress={handlePrevious}
          >
            <Text style={styles.previousButtonText}>이전</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.completeButton, isLoading && styles.disabledButton]}
            onPress={handleComplete}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeButtonText}>완료</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#4a5568',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: 15,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    minWidth: 80,
    alignItems: 'center',
  },
  selectedOptionButton: {
    borderWidth: 2,
    borderColor: '#3182ce',
    backgroundColor: '#ffffff',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedOptionButtonText: {
    color: '#3182ce',
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3182ce',
    borderColor: '#3182ce',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 16,
    color: '#1a202c',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  previousButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#111111',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  previousButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#a0aec0',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default TripPreferencesPage;
