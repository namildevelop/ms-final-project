import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getLanguageName, languageMap } from './utils';
import { Audio } from 'expo-av';
import axios from 'axios';
import LanguagePicker from './LanguagePicker';

const SERVER_URL = `${process.env.EXPO_PUBLIC_API_URL}/v1/translation/speech-translate`;

type ConversationMessage = {
  id: string;
  text: string;
  ttsAudio?: string;
};

const TranslationConversation: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string; to?: string }>();

  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('ko');
  
  const [fromLangMessages, setFromLangMessages] = useState<ConversationMessage[]>([]);
  const [toLangMessages, setToLangMessages] = useState<ConversationMessage[]>([]);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeMic, setActiveMic] = useState<'A' | 'B' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const swapLanguages = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
    // Also swap messages
    const tempMessages = fromLangMessages;
    setFromLangMessages(toLangMessages);
    setToLangMessages(tempMessages);
  };

  useEffect(() => {
    if (params?.from) setFromLang(params.from as string);
    if (params?.to) setToLang(params.to as string);
  }, []);

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
      setIsRecording(false);
      setActiveMic(null);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) {
        await sendToServer(uri);
      }
      setRecording(null);
    } else {
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

  const sendToServer = async (uri: string) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('audio', {
      uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);

    formData.append('lang1', fromLang);
    formData.append('lang2', toLang);

    try {
      const response = await axios.post(SERVER_URL, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });

      if (response.data && response.data.success) {
        const { detected_lang, source_text, translated_text, tts_audio } = response.data;

        const sourceMessage: ConversationMessage = {
          id: Date.now().toString() + '-src',
          text: source_text,
        };
        const translatedMessage: ConversationMessage = {
          id: Date.now().toString() + '-trans',
          text: translated_text,
          ttsAudio: tts_audio,
        };

        if (detected_lang === fromLang) {
          setFromLangMessages(prev => [...prev, sourceMessage]);
          setToLangMessages(prev => [...prev, translatedMessage]);
        } else {
          setToLangMessages(prev => [...prev, sourceMessage]);
          setFromLangMessages(prev => [...prev, translatedMessage]);
        }

        if (tts_audio) {
          await playSound(tts_audio);
        }
      } else {
        alert(`번역 실패: ${response.data?.error || '알 수 없는 오류'}`);
      }
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            alert(`서버 통신 오류: ${error.message}`);
        } else if (error instanceof Error) {
            alert(`오류 발생: ${error.message}`);
        } else {
            alert('알 수 없는 서버 통신 오류가 발생했습니다.');
        }
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.langSelectContainer}>
        <LanguagePicker
            selectedValue={fromLang}
            onValueChange={(value) => setFromLang(value)}
            options={languageMap}
        />
        <TouchableOpacity style={styles.swapBtn} onPress={swapLanguages}>
          <Text style={styles.swapIcon}>↔︎</Text>
        </TouchableOpacity>
        <LanguagePicker
            selectedValue={toLang}
            onValueChange={(value) => setToLang(value)}
            options={languageMap}
        />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.bubblesArea}>
            {fromLangMessages.map((m) => (
              <View key={m.id} style={[styles.bubble, styles.bubbleBlue]}>
                <Text style={styles.bubbleTextDark}>{m.text}</Text>
                {m.ttsAudio && (
                  <TouchableOpacity onPress={() => playSound(m.ttsAudio!)} style={styles.speakerIconWrapper}>
                    <Text style={styles.speakerIcon}>🔊</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
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

        <View style={styles.separator} />

        <View style={styles.section}>
          <View style={styles.bubblesArea}>
            {toLangMessages.map((m) => (
              <View key={m.id} style={[styles.bubble, styles.bubbleGray]}>
                <Text style={styles.bubbleTextDark}>{m.text}</Text>
                {m.ttsAudio && (
                  <TouchableOpacity onPress={() => playSound(m.ttsAudio!)} style={styles.speakerIconWrapper}>
                    <Text style={styles.speakerIcon}>🔊</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
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
  speakerIconWrapper: { paddingLeft: 8 },
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
  },
  langSelectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  swapBtn: {
    padding: 8,
  },
  swapIcon: {
    fontSize: 20,
    color: '#6b7280',
  },
});

export default TranslationConversation;