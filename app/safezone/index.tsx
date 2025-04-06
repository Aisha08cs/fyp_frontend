import ListItem from '@/components/ListItem';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { ISafezone } from '../types/Safezone';
import apiClient from '../utils/apiClient';

export default function SafezoneListScreen() {
  const router = useRouter();
  const auth = useAuth();
  const user = auth.user;
  const [safezones, setSafezones] = useState<ISafezone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSafezones = async () => {
    try {
      const response = await apiClient.get('/safezones');
      if (response.data.status === 'ok') {
        setSafezones(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching safezones:', error);
      Alert.alert('Error', 'Failed to fetch safezones');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Use focus effect to refresh data when returning to the screen
  useFocusEffect(
    React.useCallback(() => {
      fetchSafezones();
    }, []),
  );

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchSafezones();
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Safe Zone', 'Are you sure you want to delete this safe zone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await apiClient.delete(`/safezones/${id}`);
            if (response.data.status === 'ok') {
              setSafezones((prev) => prev.filter((zone) => zone._id !== id));
            }
          } catch (error) {
            console.error('Error deleting safezone:', error);
            Alert.alert('Error', 'Failed to delete safezone');
          }
        },
      },
    ]);
  };

  const renderSafezoneItem = (safezone: ISafezone) => (
    <ListItem
      key={safezone._id}
      title={safezone.name}
      description={`Radius: ${safezone.radius} meters`}
      details={`Created: ${new Date(safezone.createdAt).toLocaleDateString()}`}
      onPress={() => router.push(`/safezone/${safezone._id}`)}
      actionButtons={
        user?.userType === 'caregiver'
          ? [
              {
                icon: 'pencil',
                color: '#0097B2',
                onPress: () => router.push(`/safezone/add?id=${safezone._id}`),
              },
              {
                icon: 'trash-outline',
                color: '#FF3B30',
                onPress: () => handleDelete(safezone._id),
              },
            ]
          : []
      }
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safe Zones</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0097B2" />
        </View>
      ) : (
        <>
          <View style={styles.content}>
            <View style={styles.safezonesContainer}>
              {safezones.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location-outline" size={48} color="#999" />
                  <Text style={styles.emptyStateText}>No safe zones defined yet</Text>
                </View>
              ) : (
                <FlatList
                  data={safezones}
                  renderItem={({ item }) => renderSafezoneItem(item)}
                  keyExtractor={(item) => item._id}
                  refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
                  contentContainerStyle={styles.listContent}
                />
              )}
            </View>
          </View>
          {user?.userType === 'caregiver' && (
            <TouchableOpacity style={styles.addButton} onPress={() => router.push('/safezone/add')}>
              <View style={styles.addButtonContent}>
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.addButtonText}>Add New Safe Zone</Text>
              </View>
            </TouchableOpacity>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

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
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  toggleButton: {
    backgroundColor: '#EEEEEE',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleButtonEnabled: {
    backgroundColor: '#0097B2',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  safezonesContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
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
