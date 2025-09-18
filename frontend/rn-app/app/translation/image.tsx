import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

const LANG_OPTIONS = ['영어', '한국어', '중국어', '일본어'];

const TranslationImage: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  const [fromLang, setFromLang] = useState('영어');
  const [toLang, setToLang] = useState('한국어');

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    if (params?.from && typeof params.from === 'string') setFromLang(params.from);
    if (params?.to && typeof params.to === 'string') setToLang(params.to);
  }, [params]);

  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
  }, [permission]);
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.langControls}>
          <View style={styles.smallDropdown}><Text style={styles.smallDropdownText}>{fromLang}</Text></View>
          <Text style={styles.swapIcon}>↔︎</Text>
          <View style={styles.smallDropdown}><Text style={styles.smallDropdownText}>{toLang}</Text></View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.cameraWrap}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cameraPlaceholder]}>
            <Text style={{ color: '#111827' }}>카메라 권한이 필요합니다.</Text>
          </View>
        )}
      </View>

      <View style={styles.shutterWrap}>
        <TouchableOpacity style={styles.shutterBtn} activeOpacity={0.8}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  backBtn: { padding: 6, marginRight: 8 },
  backIcon: { fontSize: 18 },
  langControls: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  smallDropdown: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  smallDropdownText: { fontSize: 12, color: '#111827' },
  swapIcon: { marginHorizontal: 6 },
  cameraWrap: { flex: 1, marginHorizontal: 8, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000000' },
  cameraPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6' },
  shutterWrap: { alignItems: 'center', paddingVertical: 12 },
  shutterBtn: { width: 64, height: 64, borderRadius: 32, borderWidth: 4, borderColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3b82f6' },
});

export default TranslationImage;


