import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, Platform, Image, ActivityIndicator, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { getLanguageName, languageMap } from './utils';
import LanguagePicker from './LanguagePicker'; // Changed import

import { API_URL } from '@env';

// 🚨 중요: 이 주소는 API 서버의 기본 URL을 사용합니다.
const SERVER_URL = `${API_URL}/v1/translation/translate`;

const LANG_OPTIONS = Object.keys(languageMap).map(name => ({
    label: name,
    value: languageMap[name],
}));

const TranslationImage: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  
  const [fromLang, setFromLang] = useState('en'); // Re-introduced
  const [toLang, setToLang] = useState('ko');
  const [translatedImage, setTranslatedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    if (params?.from) setFromLang(params.from as string); // Re-introduced
    if (params?.to) setToLang(params.to as string);
  }, []);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const takePicture = async () => {
    if (isLoading || !cameraRef.current) return;
    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      await sendToServer(photo);
    } catch (error) {
      console.error("사진 촬영 오류:", error);
      alert("사진을 촬영하는 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const sendToServer = async (photo: { uri: string }) => {
    const formData = new FormData();
    formData.append('image', {
      uri: Platform.OS === 'android' ? photo.uri : photo.uri.replace('file://', ''),
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    formData.append('lang1', fromLang); // Changed back
    formData.append('lang2', toLang);   // Changed back
    
    try {
      const response = await axios.post(SERVER_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data && response.data.result_url) {
        setTranslatedImage(response.data.result_url);
      } else {
        throw new Error("서버 응답에 결과 URL이 없습니다.");
      }
    } catch (error) {
        if (error instanceof Error) {
            alert(`서버 통신 오류: ${error.message}`);
        } else {
            alert('알 수 없는 서버 통신 오류가 발생했습니다.');
        }
    } finally {
      setIsLoading(false);
    }
  };
  
  const reset = () => setTranslatedImage(null);
  const swapLanguages = () => { // Re-introduced
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
  };

  if (!permission) {
    return <View style={styles.permissionContainer}><ActivityIndicator /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>카메라 권한이 필요합니다.</Text>
        <Button onPress={requestPermission} title="권한 허용하기" />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        {translatedImage && <Image source={{ uri: translatedImage }} style={styles.resultImage} resizeMode="contain" />}
      </View>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.langControls}>
            <LanguagePicker // Re-introduced
                selectedValue={fromLang}
                onValueChange={(value) => setFromLang(value)}
                options={languageMap}
            />
            <TouchableOpacity onPress={swapLanguages} style={styles.swapIcon}>
                <Text style={styles.swapIcon}>⇌</Text>
            </TouchableOpacity>
            <LanguagePicker // Re-introduced
                selectedValue={toLang}
                onValueChange={(value) => setToLang(value)}
                options={languageMap}
            />
        </View>
      </View>

      <View style={styles.bottomContainer}>
        {translatedImage ? (
          <TouchableOpacity style={styles.retakeButton} activeOpacity={0.8} onPress={reset}>
            <Text style={styles.retakeButtonText}>다시 촬영하기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.shutterBtn} activeOpacity={0.8} onPress={takePicture} disabled={isLoading} />
        )}
      </View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff"/>
          <Text style={styles.loadingText}>번역 중...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  permissionText: { fontSize: 18, marginBottom: 10 },
  cameraContainer: { flex: 1 },
  resultImage: { width: '100%', height: '100%' },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 15,
    padding: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  backBtn: { padding: 5 },
  backIcon: { fontSize: 24, fontWeight: 'bold' },
  langControls: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  swapIcon: { fontSize: 20, color: '#4b5563', marginHorizontal: 5 },
  targetLangLabel: { fontSize: 16, color: '#4b5563', marginRight: 10 }, // This will be unused but kept for now
  bottomContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  shutterBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  retakeButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 10 },
});


export default TranslationImage;