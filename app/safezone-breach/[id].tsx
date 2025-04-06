import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { ISafezoneBreach } from '../models/SafezoneBreach';
import apiClient from '../utils/apiClient';

export default function SafezoneBreachScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [breach, setBreach] = useState<ISafezoneBreach | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreachDetails();
  }, [id]);

  const fetchBreachDetails = async () => {
    try {
      const response = await apiClient.get(`/users/safezone-breach/${id}`);
      if (response.data.status === 'ok') {
        setBreach(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching breach details:', error);
      Alert.alert('Error', 'Failed to load breach details');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      const response = await apiClient.post(`/users/safezone-breach/${id}/dismiss`);
      if (response.data.status === 'ok') {
        router.back();
      }
    } catch (error) {
      console.error('Error dismissing breach:', error);
      Alert.alert('Error', 'Failed to dismiss breach');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4BA7D1" />
      </View>
    );
  }

  if (!breach) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Breach not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safezone Breach Details</Text>
      </View>

      {/* Event Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.eventType}>Safezone Breach</Text>
        <Text style={styles.timestamp}>{new Date(breach.timestamp).toLocaleString()}</Text>
        {breach.location && (
          <Text style={styles.location}>
            Location: {breach.location.latitude.toFixed(6)}, {breach.location.longitude.toFixed(6)}
          </Text>
        )}
      </View>

      {/* Map Section */}
      {breach.location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: breach.location.latitude,
              longitude: breach.location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            userInterfaceStyle="light"
          >
            <Marker
              coordinate={{
                latitude: breach.location.latitude,
                longitude: breach.location.longitude,
              }}
              title="Breach Location"
              description={new Date(breach.timestamp).toLocaleString()}
              pinColor="#FF3B30"
            />
          </MapView>
        </View>
      )}

      {/* Dismiss Button */}
      <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
        <Text style={styles.dismissButtonText}>Dismiss Notification</Text>
      </TouchableOpacity>
    </View>
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
  infoSection: {
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  eventType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  dismissButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
  },
});
