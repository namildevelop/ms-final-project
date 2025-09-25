import React from 'react';
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { styles as globalStyles } from './styles';
// Removed: import { languageMap } from './utils';
// Removed: import LanguagePicker from './LanguagePicker';

const TranslationHome: React.FC = () => {
  const router = useRouter();
  // Removed: fromLang and toLang state
  // Removed: swapLanguages function

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.content}>
        <View style={globalStyles.header}>
            <TouchableOpacity onPress={() => router.back()} style={globalStyles.backBtn}>
                <Text style={globalStyles.backIcon}>←</Text>
            </TouchableOpacity>
            <Text style={globalStyles.headerTitle}>통역/번역하기</Text>
        </View>

        {/* Removed: Language selection View (langRow) */}

        <View style={globalStyles.actions}>
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity
                  style={[globalStyles.actionButton, { width: 240, marginBottom: 20 }]} 
                  onPress={() => router.push('/translation/conversation')}>
                  <Text style={globalStyles.actionText}>대화 통역</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                  style={[globalStyles.actionButton, { width: 240 }]} 
                  onPress={() => router.push('/translation/image')}>
                  <Text style={globalStyles.actionText}>문자 번역</Text>
              </TouchableOpacity>
            </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TranslationHome;