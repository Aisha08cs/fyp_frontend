import { IInventory } from '@/app/models/Inventory';
import apiClient from '@/app/utils/apiClient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

const InventoryDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<IInventory | null>(null);
  const { user } = useAuth();
  const isCaregiver = user && 'patientEmail' in user;

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await apiClient.get(`/inventory/${id}`);
      if (response.data.status === 'ok') {
        setItem(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      Alert.alert('Error', 'Failed to fetch item details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await apiClient.delete(`/inventory/${id}`);
            if (response.data.status === 'ok') {
              router.back();
            }
          } catch (error) {
            console.error('Error deleting item:', error);
            Alert.alert('Error', 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const handleUseItem = async () => {
    if (!item || item.quantity <= 0) {
      Alert.alert('Error', 'This item is out of stock');
      return;
    }

    Alert.alert('Use Item', 'How many units would you like to use?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Use 1',
        onPress: async () => {
          try {
            const response = await apiClient.post(`/inventory/${id}/use`, {
              quantityUsed: 1,
            });
            if (response.data.status === 'ok') {
              setItem(response.data.data);
            }
          } catch (error) {
            console.error('Error using item:', error);
            Alert.alert('Error', 'Failed to mark item as used');
          }
        },
      },
      {
        text: 'Use All',
        onPress: async () => {
          try {
            const response = await apiClient.post(`/inventory/${id}/use`, {
              quantityUsed: item.quantity,
            });
            if (response.data.status === 'ok') {
              setItem(response.data.data);
            }
          } catch (error) {
            console.error('Error using item:', error);
            Alert.alert('Error', 'Failed to mark item as used');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097B2" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Item not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Item Details</Text>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: '/inventory/add',
              params: { id: item._id },
            })
          }
        >
          <Ionicons name="pencil" size={24} color="#0097B2" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.itemName}>{item.itemName}</Text>
            <View style={[styles.statusBadge, item.needsReplenishment && styles.needsReplenishmentBadge]}>
              <Text style={[styles.statusText, item.needsReplenishment && styles.needsReplenishmentText]}>
                {item.needsReplenishment ? 'Low Stock' : 'In Stock'}
              </Text>
            </View>
          </View>

          {item.description && <Text style={styles.description}>{item.description}</Text>}

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Quantity:</Text>
              <Text style={styles.detailValue}>
                {item.quantity} {item.unit}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Low Stock Threshold:</Text>
              <Text style={styles.detailValue}>
                {item.lowStockThreshold} {item.unit}
              </Text>
            </View>

            {item.lastUsed && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Last Used:</Text>
                <Text style={styles.detailValue}>{new Date(item.lastUsed).toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actionsContainer}>
          {!isCaregiver && item.quantity > 0 && (
            <TouchableOpacity
              style={[styles.actionButton, styles.useButton, item.quantity <= 0 && styles.disabledButton]}
              onPress={handleUseItem}
              disabled={item.quantity <= 0}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={item.quantity <= 0 ? '#999' : '#fff'} />
              <Text style={[styles.actionButtonText, item.quantity <= 0 && styles.disabledButtonText]}>Use Item</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Delete Item</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#E5F6E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  needsReplenishmentBadge: {
    backgroundColor: '#FFE5E5',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#34C759',
  },
  needsReplenishmentText: {
    color: '#FF3B30',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  useButton: {
    backgroundColor: '#34C759',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#999',
  },
});

export default InventoryDetail;
