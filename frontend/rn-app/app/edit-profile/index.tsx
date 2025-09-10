// 프로필 편집 페이지 (닉네임, 전화번호, 주소, 생년월일, MBTI, 성별, 프로필 이미지)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  Modal,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

interface UserProfile {
  nickname?: string;
  phoneNumber?: string;
  address?: string;
  birthYear?: string;
  birthMonth?: string;
  birthDay?: string;
  mbti?: string;
  gender?: string;
  profileImage?: string;
}

const EditProfile: React.FC = () => {
  const router = useRouter();
  
  // 상태 관리
  const [profile, setProfile] = useState<UserProfile>({});
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showMbtiPicker, setShowMbtiPicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const yearListRef = useRef<FlatList<string>>(null);
  
  // 드롭다운 옵션들 - additional-info와 동일하게
  const years = Array.from({ length: 126 }, (_, i) => (1900 + i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const mbtiOptions = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];
  const genderOptions = ['남성', '여성', '기타'];

  // 백엔드에서 사용자 데이터 불러오기 (나중에 구현)
  useEffect(() => {
    // TODO: 백엔드 API 호출
    // const fetchUserProfile = async () => {
    //   const userData = await getUserProfile();
    //   setProfile(userData);
    // };
    // fetchUserProfile();
  }, []);

  // 입력 필드 변경 핸들러
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // 드롭다운 선택 핸들러
  const handleDropdownSelect = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // 이미지 선택 핸들러
  const handleImagePick = async () => {
    try {
      // 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '앨범 접근 권한이 필요합니다.');
        return;
      }

      // 이미지 선택
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // 정사각형
        quality: 0.8, // 이미지 품질
        maxWidth: 400,
        maxHeight: 400,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedImage = result.assets[0];
        setProfile(prev => ({ ...prev, profileImage: selectedImage.uri }));
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지 선택 중 오류가 발생했습니다.');
    }
  };

  // 옵션 아이템 렌더링 함수 (additional-info와 동일)
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

  // 선택 모달 렌더링 함수 (additional-info와 동일)
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

  // 저장 핸들러
  const handleSave = () => {
    // TODO: 백엔드 API 호출
    console.log('저장할 프로필 데이터:', profile);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>프로필 수정</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 사진 영역 */}
        <View style={styles.profileImageSection}>
          <View style={styles.profileImage}>
            {profile.profileImage ? (
              <Image 
                source={{ uri: profile.profileImage }} 
                style={styles.profileImageContent}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.profileIcon}>👤</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.changePhotoButton}
            onPress={handleImagePick}
          >
            <Text style={styles.changePhotoText}>사진 변경</Text>
          </TouchableOpacity>
        </View>

        {/* 입력 필드들 */}
        <View style={styles.inputSection}>
          {/* 닉네임 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>닉네임 (필수)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="닉네임을 입력하세요."
              placeholderTextColor="#999"
              value={profile.nickname || ''}
              onChangeText={(value) => handleInputChange('nickname', value)}
            />
            <Text style={styles.errorMessage}>체크 메시지 영역</Text>
          </View>

          {/* 휴대폰 번호 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>휴대폰 번호 (선택)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="휴대폰 번호를 입력하세요."
              placeholderTextColor="#999"
              value={profile.phoneNumber || ''}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              keyboardType="phone-pad"
            />
            <Text style={styles.errorMessage}>체크 메시지 영역</Text>
          </View>

          {/* 주소 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>주소 (선택)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="주소를 입력하세요."
              placeholderTextColor="#999"
              value={profile.address || ''}
              onChangeText={(value) => handleInputChange('address', value)}
            />
            <TouchableOpacity style={styles.addressSearchButton}>
              <Text style={styles.addressSearchText}>주소 검색</Text>
            </TouchableOpacity>
            <Text style={styles.errorMessage}>체크 메시지 영역</Text>
          </View>

          {/* 생년월일 - additional-info와 동일한 스타일 */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>생년월일 (선택)</Text>
            <View style={styles.dateContainer}>
              <View style={styles.datePicker}>
                <Text style={styles.dateLabel}>년</Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setShowYearPicker(true)}
                >
                  <Text style={styles.dropdownText}>{profile.birthYear || '선택'}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePicker}>
                <Text style={styles.dateLabel}>월</Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setShowMonthPicker(true)}
                >
                  <Text style={styles.dropdownText}>{profile.birthMonth || '선택'}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePicker}>
                <Text style={styles.dateLabel}>일</Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setShowDayPicker(true)}
                >
                  <Text style={styles.dropdownText}>{profile.birthDay || '선택'}</Text>
                  <Text style={styles.dropdownArrow}>▼</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* MBTI와 성별 */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>MBTI (선택)</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowMbtiPicker(true)}
              >
                <Text style={styles.dropdownText}>
                  {profile.mbti || '선택'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>성별 (선택)</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowGenderPicker(true)}
              >
                <Text style={styles.dropdownText}>
                  {profile.gender || '선택'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>
      </View>

      {/* 년도 선택 모달 - additional-info와 동일 */}
      {renderSelectionModal(
        showYearPicker,
        () => setShowYearPicker(false),
        '연도 선택',
        years,
        (value) => handleDropdownSelect('birthYear', value),
        profile.birthYear || '',
        90, // 1990년이 90번째 항목
        yearListRef
      )}

      {/* 월 선택 모달 */}
      {renderSelectionModal(
        showMonthPicker,
        () => setShowMonthPicker(false),
        '월 선택',
        months,
        (value) => handleDropdownSelect('birthMonth', value),
        profile.birthMonth || ''
      )}

      {/* 일 선택 모달 */}
      {renderSelectionModal(
        showDayPicker,
        () => setShowDayPicker(false),
        '일 선택',
        days,
        (value) => handleDropdownSelect('birthDay', value),
        profile.birthDay || ''
      )}

      {/* MBTI 선택 모달 */}
      {renderSelectionModal(
        showMbtiPicker,
        () => setShowMbtiPicker(false),
        'MBTI 선택',
        mbtiOptions,
        (value) => handleDropdownSelect('mbti', value),
        profile.mbti || ''
      )}

      {/* 성별 선택 모달 */}
      {renderSelectionModal(
        showGenderPicker,
        () => setShowGenderPicker(false),
        '성별 선택',
        genderOptions,
        (value) => handleDropdownSelect('gender', value),
        profile.gender || ''
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backArrow: {
    fontSize: 24,
    color: '#000000',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
  },
  profileImageSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileIcon: {
    fontSize: 40,
  },
  profileImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  changePhotoButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 16,
  },
  inputSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  errorMessage: {
    color: '#ff0000',
    fontSize: 12,
    marginTop: 5,
    opacity: 0, // 평상시에는 숨김
  },
  addressSearchButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  addressSearchText: {
    color: '#007AFF',
    fontSize: 16,
  },
  // 생년월일 스타일 - additional-info와 동일
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  datePicker: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666666',
  },
  saveButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // 모달 스타일 - additional-info와 동일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '70%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666666',
  },
  optionsList: {
    maxHeight: 300,
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
  },
});

export default EditProfile;
