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
import { styles } from './_styles';

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

  const handleSave = () => {
    // TODO: 백엔드 API 연동
    console.log('추가 정보 저장:', {
      phoneNumber,
      address,
      birthDate: { year, month, day },
      mbti,
      gender,
    });
    
    Alert.alert('성공', '추가 정보가 저장되었습니다!', [
      {
        text: '확인',
        onPress: () => {
          router.replace('/main');
        },
      },
    ]);
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
          router.replace('/main');
        },
      },
    ]);
  };

  const handleAddressSearch = () => {
    // TODO: 주소 검색 API 연동
    Alert.alert('알림', '주소 검색 기능은 준비 중입니다.');
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
            <Text style={styles.addressSearchButtonText}>주소 검색</Text>
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
    </SafeAreaView>
  );
};

export default AdditionalInfo;
