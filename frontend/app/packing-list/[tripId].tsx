import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, PackingListItem } from '../../src/context/AuthContext';
import { styles } from './_styles';

export default function PackingListPage() {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { getPackingList, addPackingListItem, deletePackingListItem, togglePackingListItem } = useAuth();

  const [items, setItems] = useState<PackingListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const fetchPackingList = useCallback(async () => {
    if (typeof tripId !== 'string') return;
    setIsLoading(true);
    try {
      const packingList = await getPackingList(tripId);
      setItems(packingList);
    } catch (error) {
      console.error("Failed to fetch packing list:", error);
      Alert.alert("오류", "준비물 목록을 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [tripId, getPackingList]);

  useEffect(() => {
    fetchPackingList();
  }, [fetchPackingList]);

  const handleAddItem = async () => {
    if (!newItemName.trim() || typeof tripId !== 'string') {
      Alert.alert("오류", "항목 이름을 입력해주세요.");
      return;
    }
    const newItem = await addPackingListItem(tripId, { item_name: newItemName, quantity: 1 });
    if (newItem) {
      setItems(prevItems => [...prevItems, newItem]);
      setNewItemName('');
      setIsModalVisible(false);
    } else {
      Alert.alert("오류", "항목 추가에 실패했습니다.");
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (typeof tripId !== 'string') return;
    Alert.alert(
      "항목 삭제",
      "정말로 이 항목을 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            const success = await deletePackingListItem(tripId, itemId);
            if (success) {
              setItems(prevItems => prevItems.filter(item => item.id !== itemId));
            } else {
              Alert.alert("오류", "항목 삭제에 실패했습니다.");
            }
          },
        },
      ]
    );
  };

  const handleTogglePacked = async (itemId: number) => {
    if (typeof tripId !== 'string') return;
    const updatedItem = await togglePackingListItem(tripId, itemId);
    if (updatedItem) {
      setItems(prevItems => prevItems.map(item => item.id === itemId ? updatedItem : item));
    } else {
      Alert.alert("오류", "상태 변경에 실패했습니다.");
    }
  };

  const renderItem = (item: PackingListItem) => (
    <View key={item.id} style={[styles.row, item.is_packed ? styles.rowChecked : undefined]}>
        <TouchableOpacity 
          style={[styles.checkbox, item.is_packed && styles.checkboxChecked]}
          onPress={() => handleTogglePacked(item.id)}
        >
          {item.is_packed && <Text style={styles.checkboxMark}>✓</Text>}
        </TouchableOpacity>
        <Text style={[styles.itemText, item.is_packed && styles.itemTextChecked]}>{item.item_name}</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteItem(item.id)}>
          <Text style={styles.deleteText}>삭제</Text>
        </TouchableOpacity>
      </View>
  );

  if (isLoading) {
    return <SafeAreaView style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}><ActivityIndicator size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>준비물 체크하기</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Text style={styles.addActionText}>준비물 추가하기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {items.map(item => renderItem(item))}
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>준비물 추가</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={styles.close}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="예: 칫솔, 충전기"
              placeholderTextColor="#999"
              value={newItemName}
              onChangeText={setNewItemName}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
              <Text style={styles.addBtnText}>추가</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}