import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker'; // Added ImagePicker
import { useAuth } from '../../src/context/AuthContext';
import { styles } from './_styles';
 
interface ProfileData {
  nickname: string;
  phone: string;
  address: string;
  birth_date: string;
  mbti: string;
  gender: string;
  profile_image_url?: string;
}
 
const ProfileEditScreen = () => {
  const router = useRouter();
  const { user, updateProfile, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    nickname: '',
    phone: '',
    address: '',
    birth_date: '',
    mbti: '',
    gender: '',
    profile_image_url: ''
  });

  // 드롭다운 상태 및 옵션
  const [showYearModal, setShowYearModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showMbtiModal, setShowMbtiModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const yearOptions = Array.from({ length: 126 }, (_, i) => (1900 + i).toString());
  const monthOptions = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const dayOptions = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const mbtiOptions = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
  const genderOptions = ['남', '여', '기타'];

  const renderSelectionModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: string[],
    onSelect: (value: string) => void,
  ) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.optionItem} onPress={() => { onSelect(item); onClose(); }}>
                <Text style={styles.optionText}>{item}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            style={styles.optionsList}
          />
        </View>
      </View>
    </Modal>
  );
 
  useEffect(() => {
    if (user) {
      setProfileData({
        nickname: user.nickname || '',
        phone: user.phone || '',
        address: user.address || '',
        birth_date: user.birth_date || '',
        mbti: user.mbti || '',
        gender: user.gender || '',
        profile_image_url: user.profile_image_url || ''
      });
    }
  }, [user]);
 
  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };
 
  const handleImagePick = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
 
    if (!result.canceled) {
      setProfileData(prev => ({ ...prev, profile_image_url: result.assets[0].uri }));
    }
  };
 
  const handleSave = async () => {
    setIsLoading(true);
    // Create a payload with only the fields that are not empty strings
    const payload: Partial<ProfileData> = {};
    let imageUriToUpload: string | undefined;
 
    for (const key in profileData) {
      if (Object.prototype.hasOwnProperty.call(profileData, key)) {
        const value = profileData[key as keyof ProfileData];
        if (key === 'profile_image_url') {
          // Check if the profile image URL has changed
          if (value && value !== user?.profile_image_url) {
            imageUriToUpload = value;
          }
        } else if (value) {
            payload[key as keyof ProfileData] = value;
        }
      }
    }
 
    const success = await updateProfile(payload, imageUriToUpload);
    setIsLoading(false);
 
    if (success) {
      Alert.alert('성공', '프로필이 성공적으로 업데이트되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } else {
      Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
    }
  };

  // 생년월일 값 조합 유틸
  const setBirthPart = (part: 'year' | 'month' | 'day', value: string) => {
    const [y, m, d] = (profileData.birth_date || '--').split('-');
    const newY = part === 'year' ? value : (y || '');
    const newM = part === 'month' ? value : (m || '');
    const newD = part === 'day' ? value : (d || '');
    const composed = [newY, newM, newD].filter(Boolean).join('-');
    handleInputChange('birth_date', composed);
  };
 
  if (authLoading) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} />;
  }
 
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>프로필 수정</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.profileSection}>
            <TouchableOpacity style={styles.profileImage}>
              {profileData.profile_image_url ? (
                <Image source={{ uri: profileData.profile_image_url }} style={styles.profileImage} />
              ) : (
                <Text style={styles.profileImagePlaceholder}>👤</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.changeButton} onPress={handleImagePick}>
              <Text style={styles.changeButtonText}>사진 변경</Text>
            </TouchableOpacity>
          </View>
 
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                style={styles.input}
                value={profileData.nickname}
                onChangeText={(val) => handleInputChange('nickname', val)}
                placeholder="닉네임을 입력하세요"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>휴대폰 번호</Text>
              <TextInput
                style={styles.input}
                value={profileData.phone}
                onChangeText={(val) => handleInputChange('phone', val)}
                placeholder="휴대폰 번호를 입력하세요"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>주소</Text>
              <TextInput
                style={styles.input}
                value={profileData.address}
                onChangeText={(val) => handleInputChange('address', val)}
                placeholder="주소를 입력하세요"
              />
              <TouchableOpacity style={styles.addressSearchButton} onPress={() => {}}>
                <Text style={styles.addressSearchButtonText}>주소 검색</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>생년월일</Text>
              <View style={styles.dateContainer}>
                <View style={styles.datePicker}>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowYearModal(true)}>
                    <Text style={styles.dropdownText}>{profileData.birth_date?.split('-')[0] || '년'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePicker}>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowMonthModal(true)}>
                    <Text style={styles.dropdownText}>{profileData.birth_date?.split('-')[1] || '월'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.datePicker}>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowDayModal(true)}>
                    <Text style={styles.dropdownText}>{profileData.birth_date?.split('-')[2] || '일'}</Text>
                    <Text style={styles.dropdownArrow}>▼</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MBTI</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowMbtiModal(true)}>
                <Text style={styles.dropdownText}>{profileData.mbti || '선택'}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>성별</Text>
              <TouchableOpacity style={styles.dropdown} onPress={() => setShowGenderModal(true)}>
                <Text style={styles.dropdownText}>{profileData.gender || '선택'}</Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>
          </View>
 
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>저장하기</Text>}
          </TouchableOpacity>
        </ScrollView>
        {/* 선택 모달들 */}
        {renderSelectionModal(
          showYearModal,
          () => setShowYearModal(false),
          '연도 선택',
          yearOptions,
          (val) => setBirthPart('year', val),
        )}
        {renderSelectionModal(
          showMonthModal,
          () => setShowMonthModal(false),
          '월 선택',
          monthOptions,
          (val) => setBirthPart('month', val),
        )}
        {renderSelectionModal(
          showDayModal,
          () => setShowDayModal(false),
          '일 선택',
          dayOptions,
          (val) => setBirthPart('day', val),
        )}
        {renderSelectionModal(
          showMbtiModal,
          () => setShowMbtiModal(false),
          'MBTI 선택',
          mbtiOptions,
          (val) => handleInputChange('mbti', val),
        )}
        {renderSelectionModal(
          showGenderModal,
          () => setShowGenderModal(false),
          '성별 선택',
          genderOptions,
          (val) => handleInputChange('gender', val),
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
 
export default ProfileEditScreen;