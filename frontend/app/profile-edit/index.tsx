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
  Platform
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
            <Text style={styles.backIcon}>‹</Text>
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
              <Text style={styles.changeButtonText}>프로필 사진 변경</Text>
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
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>생년월일</Text>
              <TextInput
                style={styles.input}
                value={profileData.birth_date}
                onChangeText={(val) => handleInputChange('birth_date', val)}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MBTI</Text>
              <TextInput
                style={styles.input}
                value={profileData.mbti}
                onChangeText={(val) => handleInputChange('mbti', val)}
                placeholder="MBTI를 입력하세요"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>성별</Text>
              <TextInput
                style={styles.input}
                value={profileData.gender}
                onChangeText={(val) => handleInputChange('gender', val)}
                placeholder="성별을 입력하세요"
              />
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>저장하기</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileEditScreen;
