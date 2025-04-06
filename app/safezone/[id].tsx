import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ISafezone } from '../types/Safezone';
import apiClient from '../utils/apiClient';

export default function SafezoneViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [safezone, setSafezone] = useState<ISafezone | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSafezone();
  }, [id]);

  const fetchSafezone = async () => {
    try {
      const response = await apiClient.get(`/safezones/${id}`);
      if (response.data.status === 'ok') {
        setSafezone(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching safezone:', error);
      Alert.alert('Error', 'Failed to fetch safezone details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097B2" />
      </View>
    );
  }

  if (!safezone) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Safezone not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safe Zone Details</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.name}>{safezone.name}</Text>
          <Text style={styles.details}>Radius: {safezone.radius} meters</Text>
          <Text style={styles.details}>Created: {new Date(safezone.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              ...safezone.location,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker coordinate={safezone.location} />
            <Circle
              center={safezone.location}
              radius={safezone.radius}
              fillColor="rgba(0, 151, 178, 0.2)"
              strokeColor="#0097B2"
              strokeWidth={2}
            />
          </MapView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  details: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
});
