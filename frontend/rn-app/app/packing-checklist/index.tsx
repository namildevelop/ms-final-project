import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Modal } from 'react-native';
import { router } from 'expo-router';
import { styles } from './styles';

type PackingItem = {
  id: string;
  title: string;
  checked: boolean;
};

export default function PackingChecklist() {
  const [items, setItems] = useState<PackingItem[]>([
    { id: '1', title: '준비물 1', checked: false },
    { id: '2', title: '준비물 2', checked: true },
    { id: '3', title: '준비물 2', checked: true },
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, checked: !it.checked } : it));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const addItem = () => {
    const title = newTitle.trim();
    if (!title) return;
    setItems(prev => [
      ...prev,
      { id: Math.random().toString(36).slice(2, 9), title, checked: false }
    ]);
    setNewTitle('');
    setShowAddModal(false);
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>준비물 체크하기</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Text style={styles.addActionText}>준비물 추가하기</Text>
        </TouchableOpacity>
      </View>

      {/* 리스트 */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {items.map(item => (
          <View key={item.id} style={[styles.row, item.checked ? styles.rowChecked : undefined]}>
            <TouchableOpacity 
              style={[styles.checkbox, item.checked && styles.checkboxChecked]}
              onPress={() => toggleItem(item.id)}
            >
              {item.checked && <Text style={styles.checkboxMark}>✓</Text>}
            </TouchableOpacity>
            <Text style={[styles.itemText, item.checked && styles.itemTextChecked]}>{item.title}</Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeItem(item.id)}>
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* 추가 모달 */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>준비물 추가</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="예: 칫솔, 충전기"
              placeholderTextColor="#999"
              value={newTitle}
              onChangeText={setNewTitle}
              onSubmitEditing={addItem}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addItem}>
              <Text style={styles.addBtnText}>추가</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// styles moved to styles.ts


