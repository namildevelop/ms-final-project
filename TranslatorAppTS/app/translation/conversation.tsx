import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { languageMap, getLanguageName } from './utils';
import { Audio } from 'expo-av';
import axios from 'axios';

const SERVER_URL = 'http://4.230.16.32:5000/speech-translate';

type Message = {
  id: string;
  original: string;
  translated: string;
  ttsAudio?: string;
  speaker: 'A' | 'B';
};

const TranslationConversation: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();
  
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('ko');
  const [messages, setMessages] = useState<Message[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeMic, setActiveMic] = useState<'A' | 'B' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (params?.from) setFromLang(params.from as string);
    if (params?.to) setToLang(params.to as string);
  }, [params]);

  // 오디오 권한 초기화
  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error('오디오 설정 오류:', error);
      }
    };
    setupAudio();
  }, []);

  const handleRecord = async (speaker: 'A' | 'B') => {
    if (isRecording && activeMic !== speaker) return;

    if (recording) {
      // 녹음 중지
      setIsRecording(false);
      setActiveMic(null);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        const langPair = speaker === 'A' 
          ? { from: fromLang, to: toLang }
          : { from: toLang, to: fromLang };
        await sendToServer(uri, langPair, speaker);
      }
      setRecording(null);
    } else {
      // 녹음 시작
      try {
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
        setActiveMic(speaker);
      } catch (err) {
        console.error('녹음 시작 실패', err);
        alert('마이크를 시작할 수 없습니다.');
      }
    }
  };

  const sendToServer = async (uri: string, langPair: { from: string, to: string }, speaker: 'A' | 'B') => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('audio', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);

    formData.append('from_lang', langPair.from);
    formData.append('to_lang', langPair.to);

    try {
      const response = await axios.post(SERVER_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      if (response.data && response.data.success) {
        const data = response.data;
        const newMessage: Message = {
          id: Date.now().toString(),
          original: data.original,
          translated: data.translated,
          ttsAudio: data.tts_audio,
          speaker: speaker
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        if (data.tts_audio) {
          await playSound(data.tts_audio);
        }
      } else {
        alert(`번역 실패: ${response.data?.error || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
      alert(`서버 통신 오류: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const playSound = async (base64Audio: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/wav;base64,${base64Audio}` }
      );
      await sound.playAsync();
      
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("오디오 재생 실패:", error);
    }
  };

  // 샘플 메시지 (개발용)
  const sourceMessages = messages.filter(m => m.speaker === 'A');
  const translatedMessages = messages.filter(m => m.speaker === 'B');

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* 위쪽 원본 영역 */}
        <View style={styles.section}>
          <View style={styles.bubblesArea}>
            {sourceMessages.map((m) => (
              <View key={m.id} style={[styles.bubble, styles.bubbleBlue]}>
                <Text style={styles.bubbleTextDark}>{m.original}</Text>
                {m.ttsAudio && (
                  <TouchableOpacity onPress={() => playSound(m.ttsAudio!)}>
                    <Text style={styles.speakerIcon}>🔊</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            {/* 녹음 중 표시 */}
            {isRecording && activeMic === 'A' && (
              <View style={[styles.bubble, { backgroundColor: '#fef2f2' }]}>
                <Text style={styles.bubbleTextDark}>🔴 녹음 중...</Text>
              </View>
            )}
          </View>
          
          <View style={styles.controlRow}>
            <Text style={styles.langLabel}>{getLanguageName(fromLang)}</Text>
            <TouchableOpacity 
              style={[styles.micBtn, activeMic === 'A' && { backgroundColor: '#dc2626' }]}
              onPress={() => handleRecord('A')}
              disabled={isLoading}
            >
              <Text style={styles.micIcon}>
                {isRecording && activeMic === 'A' ? '⏹️' : '🎤'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 구분선 */}
        <View style={styles.separator} />

        {/* 아래쪽 번역 영역 */}
        <View style={styles.section}>
          <View style={styles.bubblesArea}>
            {translatedMessages.map((m) => (
              <View key={m.id} style={[styles.bubble, styles.bubbleGray]}>
                <Text style={styles.bubbleTextDark}>{m.translated}</Text>
                {m.ttsAudio && (
                  <TouchableOpacity onPress={() => playSound(m.ttsAudio!)}>
                    <Text style={styles.speakerIcon}>🔊</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            {/* 녹음 중 표시 */}
            {isRecording && activeMic === 'B' && (
              <View style={[styles.bubble, { backgroundColor: '#fef2f2' }]}>
                <Text style={styles.bubbleTextDark}>🔴 녹음 중...</Text>
              </View>
            )}
          </View>
          
          <View style={styles.controlRow}>
            <Text style={styles.langLabel}>{getLanguageName(toLang)}</Text>
            <TouchableOpacity 
              style={[styles.micBtn, activeMic === 'B' && { backgroundColor: '#dc2626' }]}
              onPress={() => handleRecord('B')}
              disabled={isLoading}
            >
              <Text style={styles.micIcon}>
                {isRecording && activeMic === 'B' ? '⏹️' : '🎤'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* 로딩 오버레이 */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>번역 중...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  backBtn: { padding: 8 },
  closeIcon: { fontSize: 18 },
  section: { paddingHorizontal: 12, paddingTop: 4, paddingBottom: 16 },
  bubblesArea: { gap: 10, paddingTop: 8, paddingBottom: 8 },
  bubble: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubbleBlue: { backgroundColor: '#e5f0ff', borderWidth: 0, },
  bubbleGray: { backgroundColor: '#f3f4f6', borderWidth: 0, },
  bubbleTextDark: { color: '#111827', fontSize: 14, flex: 1, marginRight: 8 },
  speakerIcon: { fontSize: 14, color: '#111827' },
  controlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  langLabel: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: { fontSize: 18, color: '#ffffff' },
  separator: { height: 1, backgroundColor: '#e5e7eb' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default TranslationConversation;
