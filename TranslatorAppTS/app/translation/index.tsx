import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { styles, pickerSelectStyles } from './styles'; // styles.ts 파일 import
import { useRouter } from 'expo-router';
import { languageMap } from './utils'; // utils.ts 파일 import
import RNPickerSelect from 'react-native-picker-select'; // 드롭다운 라이브러리

// utils.ts의 languageMap을 사용하여 동적으로 옵션 생성
const LANG_OPTIONS = Object.keys(languageMap).map(name => ({
  label: name,
  value: languageMap[name],
}));

const TranslationScreen: React.FC = () => {
  const router = useRouter();
  const [fromLang, setFromLang] = useState('en');
  const [toLang, setToLang] = useState('ko');

  const swapLanguages = () => {
    const temp = fromLang;
    setFromLang(toLang);
    setToLang(temp);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>통역/번역하기</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.langRow}>
          <RNPickerSelect
            value={fromLang}
            onValueChange={(value) => value && setFromLang(value)}
            items={LANG_OPTIONS}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
            placeholder={{}}
          />
          <TouchableOpacity style={styles.swapBtn} onPress={swapLanguages}>
            <Text style={styles.swapIcon}>↔︎</Text>
          </TouchableOpacity>
          <RNPickerSelect
            value={toLang}
            onValueChange={(value) => value && setToLang(value)}
            items={LANG_OPTIONS}
            style={pickerSelectStyles}
            useNativeAndroidPickerStyle={false}
            placeholder={{}}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.8}
            onPress={() =>
                router.push({
                  pathname: '/translation/conversation',
                  params: { from: fromLang, to: toLang },
                })
            }
          >
            <Text style={styles.actionText}>대화 통역</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { marginTop: 20 }]}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/translation/image',
                params: { from: fromLang, to: toLang },
              })
            }
          >
            <Text style={styles.actionText}>이미지 번역</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TranslationScreen;

