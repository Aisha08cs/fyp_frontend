import { IInventory } from '@/app/models/Inventory';
import apiClient from '@/app/utils/apiClient';
import ListItem from '@/components/ListItem';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const InventoryList = () => {
  const router = useRouter();
  const [items, setItems] = useState<IInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = async () => {
    try {
      const response = await apiClient.get('/inventory');

      if (response.data.status === 'ok') {
        setItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      Alert.alert('Error', 'Failed to fetch inventory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Use focus effect to refresh data when returning to the screen
  useFocusEffect(
    React.useCallback(() => {
      fetchItems();
    }, []),
  );

  // Initial load
  useEffect(() => {
    fetchItems();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await apiClient.delete(`/inventory/${id}`);
            if (response.data.status === 'ok') {
              setItems((prev) => prev.filter((item) => item._id !== id));
            }
          } catch (error) {
            console.error('Error deleting item:', error);
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const handleUseItem = async (id: string, currentQuantity: number) => {
    if (currentQuantity <= 0) return;

    try {
      const response = await apiClient.put(`/inventory/${id}/use`, {
        quantity: currentQuantity - 1,
        lastUsed: new Date().toISOString(),
      });

      if (response.data.status === 'ok') {
        setItems((prev) =>
          prev.map((item) =>
            item._id === id
              ? {
                  ...item,
                  quantity: item.quantity - 1,
                  lastUsed: new Date(),
                }
              : item,
          ),
        );
      }
    } catch (error) {
      console.error('Error using item:', error);
      Alert.alert('Error', 'Failed to update item usage');
    }
  };

  const renderItem = ({ item }: { item: IInventory }) => (
    <ListItem
      title={item.itemName}
      description={item.description}
      details={`${item.quantity} ${item.unit}`}
      status={{
        text: item.needsReplenishment ? 'Low Stock' : 'In Stock',
        style: item.needsReplenishment ? 'warning' : 'success',
      }}
      time={
        item.lastUsed
          ? {
              text: `Last used: ${new Date(item.lastUsed).toLocaleDateString()}`,
            }
          : undefined
      }
      onPress={() => router.push(`/inventory/${item._id}`)}
      actionButtons={[
        {
          icon: 'checkmark-circle-outline',
          color: '#34C759',
          onPress: () => handleUseItem(item._id, item.quantity),
          disabled: item.quantity <= 0,
        },
        {
          icon: 'pencil',
          color: '#0097B2',
          onPress: () =>
            router.push({
              pathname: '/inventory/add',
              params: { id: item._id },
            }),
        },
        {
          icon: 'trash-outline',
          color: '#FF3B30',
          onPress: () => handleDelete(item._id),
        },
      ]}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inventory</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0097B2" />
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContent}
          />
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/inventory/add')}>
            <View style={styles.addButtonContent}>
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>Add New Item</Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Add padding to prevent content from being hidden behind the FAB
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#0097B2',
    borderRadius: 30,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  addButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default InventoryList;
