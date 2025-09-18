import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { getLanguageName } from './utils';

interface LanguagePickerProps {
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: { [key: string]: string };
}

const LanguagePicker: React.FC<LanguagePickerProps> = ({ selectedValue, onValueChange, options }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const languageName = getLanguageName(selectedValue);
  const languageOptions = Object.keys(options).map(name => ({
    label: name,
    value: options[name],
  }));

  const handleSelect = (value: string) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.pickerButtonText}>{languageName}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={{flex: 1}}>
            <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <FlatList
                data={languageOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.optionButton} onPress={() => handleSelect(item.value)}>
                    <Text style={styles.optionText}>{item.label}</Text>
                    </TouchableOpacity>
                )}
                />
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButtonText}>닫기</Text>
                </TouchableOpacity>
            </View>
            </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerButton: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 10,
    width: 120,
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1a202c',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 20,
    maxHeight: '80%',
  },
  optionButton: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 18,
  },
  closeButton: {
    marginTop: 10,
    padding: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: 'red',
  },
});

export default LanguagePicker;
