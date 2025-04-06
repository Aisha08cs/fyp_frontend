import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';
import { IFallEvent } from '../models/FallEvent';
import apiClient from '../utils/apiClient';

export default function EmergencyScreen() {
  const router = useRouter();
  const { onLogout } = useAuth();
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<IFallEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      const response = await apiClient.get(`/fall-events/${id}`);
      if (response.data.status === 'ok') {
        setEvent(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching event details:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
          {
            text: 'OK',
            onPress: () => {
              if (onLogout) {
                onLogout();
              }
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to load event details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await apiClient.patch(`/fall-events/${id}/dismiss`);
      router.back();
    } catch (error: any) {
      console.error('Error dismissing event:', error);
      if (error.response?.status === 401) {
        Alert.alert('Session Expired', 'Your session has expired. Please log in again.', [
          {
            text: 'OK',
            onPress: () => {
              if (onLogout) {
                onLogout();
              }
            },
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to dismiss event');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4BA7D1" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
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
        <Text style={styles.headerTitle}>Fall Event Details</Text>
      </View>

      {/* Event Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.eventType}>Fall Event</Text>
        <Text style={styles.timestamp}>{new Date(event.timestamp).toLocaleString()}</Text>
        {event.location && (
          <Text style={styles.location}>
            Location: {event.location.latitude.toFixed(6)}, {event.location.longitude.toFixed(6)}
          </Text>
        )}
      </View>

      {/* Map Section */}
      {event.location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: event.location.latitude,
              longitude: event.location.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            userInterfaceStyle="light"
          >
            <Marker
              coordinate={{
                latitude: event.location.latitude,
                longitude: event.location.longitude,
              }}
              title="Fall Location"
              description={new Date(event.timestamp).toLocaleString()}
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
