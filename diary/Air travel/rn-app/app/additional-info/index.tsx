import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { styles } from './styles';
import { getApiUrl, API_ENDPOINTS } from '../../lib/api';

const AdditionalInfo: React.FC = () => {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [mbti, setMbti] = useState('');
  const [gender, setGender] = useState('');

  // 모달 상태
  const [showYearModal, setShowYearModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showMbtiModal, setShowMbtiModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [addressOptions, setAddressOptions] = useState<string[]>([]);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  // FlatList refs
  const yearListRef = useRef<FlatList<string>>(null);

  // 옵션 데이터 - 년도는 1900년부터 2025년까지, 초기 스크롤은 1990년
  const yearOptions = Array.from({ length: 126 }, (_, i) => (1900 + i).toString());
  const monthOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const dayOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  const mbtiOptions = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];
  
  const genderOptions = ['남', '여', '기타'];

  const handleSave = async () => {
    try {
      // 생년월일 형식 변환 (YYYY-MM-DD)
      const birthdate = year && month && day ? `${year}-${month}-${day}` : null;
      
      // 백엔드 API 호출 - 프로필 완성
      const response = await fetch(getApiUrl(API_ENDPOINTS.PROFILE_COMPLETE), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // TODO: JWT 토큰 추가 (로그인 후 저장된 토큰 사용)
          // 'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          address: address || null,
          phone: phoneNumber || null,
          gender: gender || null,
          mbti: mbti || null,
          birthdate: birthdate
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('프로필 완성 성공!', data);
        Alert.alert('성공', '추가 정보가 저장되었습니다!', [
          {
            text: '확인',
            onPress: () => {
              // 메인 화면으로 이동
              router.replace('/');
            },
          },
        ]);
      } else {
        Alert.alert('오류', data.detail || '프로필 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      Alert.alert('오류', '프로필 저장 중 오류가 발생했습니다.');
    }
  };

  const handleSkip = () => {
    Alert.alert('알림', '추가 정보 입력을 건너뛰시겠습니까?', [
      {
        text: '취소',
        style: 'cancel',
      },
      {
        text: '건너뛰기',
        onPress: () => {
          // 메인 화면으로 이동 (건너뛰기)
          router.replace('/');
        },
      },
    ]);
  };

  const handleAddressSearch = async () => {
    console.log('주소 검색 시작...');
    
    try {
      console.log('GPS 위치 정보 요청 중...');
      
      // GPS 위치 정보 가져오기 (Expo Location 사용)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('오류', '위치 정보 접근 권한이 거부되었습니다.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
        maximumAge: 60000
      });

      const { latitude, longitude } = location.coords;
      console.log('GPS 위치 획득:', { latitude, longitude });
      
      // 좌표를 주소로 변환 (카카오 API)
      const apiUrl = `${getApiUrl()}${API_ENDPOINTS.reverseGeocode}?lat=${latitude}&lng=${longitude}`;
      console.log('API 호출:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('API 응답 상태:', response.status);
      
      const data = await response.json();
      console.log('API 응답 데이터:', data);
      
      if (response.ok && data.address) {
        // 주소를 자동으로 입력 필드에 설정
        setAddress(data.address);
        console.log('주소 설정 완료:', data.address);
        Alert.alert('성공', '현재 위치의 주소가 입력되었습니다!');
      } else {
        console.log('주소 변환 실패:', data);
        Alert.alert('오류', '주소 변환에 실패했습니다.');
      }
    } catch (error) {
      console.error('주소 검색 오류:', error);
      Alert.alert('오류', '주소 검색 중 오류가 발생했습니다.');
    }
  };

  const renderOptionItem = ({ item, onSelect, onClose }: { item: string, onSelect: (value: string) => void, onClose: () => void }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <Text style={styles.optionText}>{item}</Text>
    </TouchableOpacity>
  );

  const renderSelectionModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: string[],
    onSelect: (value: string) => void,
    selectedValue: string,
    initialScrollIndex?: number,
    listRef?: React.RefObject<FlatList<string> | null>
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList<string>
            ref={listRef}
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => renderOptionItem({ 
              item, 
              onSelect, 
              onClose 
            })}
            showsVerticalScrollIndicator={false}
            style={styles.optionsList}
            initialScrollIndex={initialScrollIndex}
            getItemLayout={(data, index) => ({
              length: 50, // 각 아이템의 높이
              offset: 50 * index,
              index,
            })}
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목 */}
        <Text style={styles.title}>추가입력</Text>
        
        {/* 휴대폰 번호 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>휴대폰 번호 (선택)</Text>
          <TextInput
            style={styles.inputField}
            placeholder="예) 01012345678"
            placeholderTextColor="#999"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            maxLength={11}
          />
          <Text style={styles.checkMessage}>체크 메시지 영역</Text>
        </View>
        
        {/* 주소 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>주소 (선택)</Text>
          <TextInput
            style={styles.inputField}
            placeholder="주소를 검색해서 입력하세요."
            placeholderTextColor="#999"
            value={address}
            onChangeText={setAddress}
          />
          <TouchableOpacity 
            style={styles.addressSearchButton}
            onPress={handleAddressSearch}
          >
            <Text style={styles.addressSearchButtonText}>현재 위치로 주소 입력</Text>
          </TouchableOpacity>
        </View>
        
        {/* 생년월일 */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>생년월일 (선택)</Text>
          <View style={styles.dateContainer}>
            <View style={styles.datePicker}>
              <Text style={styles.dateLabel}>년</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowYearModal(true)}
              >
                <Text style={styles.dropdownText}>{year || '선택'}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePicker}>
              <Text style={styles.dateLabel}>월</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowMonthModal(true)}
              >
                <Text style={styles.dropdownText}>{month || '선택'}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.datePicker}>
              <Text style={styles.dateLabel}>일</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowDayModal(true)}
              >
                <Text style={styles.dropdownText}>{day || '선택'}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* MBTI와 성별 */}
        <View style={styles.rowSection}>
          <View style={styles.halfSection}>
            <Text style={styles.inputLabel}>MBTI (선택)</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowMbtiModal(true)}
            >
              <Text style={styles.dropdownText}>{mbti || '선택'}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.halfSection}>
            <Text style={styles.inputLabel}>성별 (선택)</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowGenderModal(true)}
            >
              <Text style={styles.dropdownText}>{gender || '선택'}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      
      {/* 버튼 영역 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonText}>건너뛰기</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>저장 후 시작하기</Text>
        </TouchableOpacity>
      </View>

      {/* 년도 선택 모달 - 1990년이 초기 스크롤 위치 */}
      {renderSelectionModal(
        showYearModal,
        () => setShowYearModal(false),
        '연도 선택',
        yearOptions,
        setYear,
        year,
        90, // 1990년이 90번째 항목이므로 인덱스 90
        yearListRef
      )}

      {/* 월 선택 모달 */}
      {renderSelectionModal(
        showMonthModal,
        () => setShowMonthModal(false),
        '월 선택',
        monthOptions,
        setMonth,
        month
      )}

      {/* 일 선택 모달 */}
      {renderSelectionModal(
        showDayModal,
        () => setShowDayModal(false),
        '일 선택',
        dayOptions,
        setDay,
        day
      )}

      {/* MBTI 선택 모달 */}
      {renderSelectionModal(
        showMbtiModal,
        () => setShowMbtiModal(false),
        'MBTI 선택',
        mbtiOptions,
        setMbti,
        mbti
      )}

      {/* 성별 선택 모달 */}
      {renderSelectionModal(
        showGenderModal,
        () => setShowGenderModal(false),
        '성별 선택',
        genderOptions,
        setGender,
        gender
      )}

      {/* 주소 선택 모달 */}
      {renderSelectionModal(
        addressModalVisible,
        () => setAddressModalVisible(false),
        '주소 선택',
        addressOptions,
        setAddress,
        address
      )}
    </SafeAreaView>
  );
};

export default AdditionalInfo;
