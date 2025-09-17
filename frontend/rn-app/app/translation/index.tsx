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
            <Text style={globalStyles.headerTitle}>번역</Text>
        </View>

        {/* Removed: Language selection View (langRow) */}

        <View style={globalStyles.actions}>
            <TouchableOpacity
                style={[globalStyles.actionButton, { marginBottom: 20 }]} 
                onPress={() => router.push('/translation/conversation')}>
                <Text style={globalStyles.actionText}>🎙️ 음성 통역</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={globalStyles.actionButton} 
                onPress={() => router.push('/translation/image')}>
                <Text style={globalStyles.actionText}>📸 이미지 번역</Text>
            </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TranslationHome;