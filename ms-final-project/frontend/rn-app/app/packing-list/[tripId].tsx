import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Modal, TextInput, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth, PackingListItem } from '../../src/context/AuthContext';
import Checkbox from 'expo-checkbox';

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

  const renderItem = ({ item }: { item: PackingListItem }) => (
    <View style={styles.itemContainer}>
        <Checkbox
            style={styles.checkbox}
            value={item.is_packed}
            onValueChange={() => handleTogglePacked(item.id)}
        />
        <Text style={[styles.itemName, item.is_packed && styles.itemPacked]}>{item.item_name}</Text>
        <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <SafeAreaView style={[styles.container, styles.centered]}><ActivityIndicator size="large" /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>준비물 체크하기</Text>
        <TouchableOpacity onPress={() => setIsModalVisible(true)}>
          <Text style={styles.addButton}>추가하기</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ListEmptyComponent={<View style={styles.centered}><Text>준비물이 없습니다.</Text></View>}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>준비물 추가하기</Text>
            <TextInput
              style={styles.input}
              placeholder="항목 이름"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.buttonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleAddItem}>
                <Text style={styles.buttonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 18,
    color: '#007AFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    fontSize: 18,
    color: '#007AFF',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkbox: {
    marginRight: 15,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
  },
  itemPacked: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
