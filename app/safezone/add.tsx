import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../utils/apiClient';

export default function SafezoneAddScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [radius, setRadius] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [initialRegion, setInitialRegion] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get user's current location when component mounts or fetch existing safezone if editing
  useEffect(() => {
    if (isEditing) {
      fetchSafezone();
    } else {
      getCurrentLocation();
    }
  }, [id]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to create a safe zone.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setInitialRegion(region);
      setSelectedLocation(region);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const fetchSafezone = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/safezones/${id}`);
      if (response.data.status === 'ok') {
        const safezone = response.data.data;
        setZoneName(safezone.name);
        setRadius(safezone.radius.toString());
        setSelectedLocation(safezone.location);
        setInitialRegion(safezone.location);
      }
    } catch (error) {
      console.error('Error fetching safezone:', error);
      Alert.alert('Error', 'Failed to fetch safezone details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!zoneName.trim()) {
      Alert.alert('Error', 'Please enter a zone name');
      return;
    }

    if (!selectedLocation) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    const radiusValue = Number(radius);
    if (isNaN(radiusValue) || radiusValue <= 0) {
      Alert.alert('Error', 'Please enter a valid radius');
      return;
    }

    setIsSaving(true);
    try {
      const endpoint = isEditing ? `/safezones/${id}` : '/safezones';
      const method = isEditing ? 'put' : 'post';

      const response = await apiClient[method](endpoint, {
        name: zoneName.trim(),
        location: selectedLocation,
        radius: radiusValue,
      });

      if (response.data.status === 'ok') {
        router.back();
      }
    } catch (error) {
      console.error('Error saving safezone:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} safezone`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097B2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Safe Zone' : 'Create Safe Zone'}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Zone Name</Text>
          <TextInput
            style={styles.input}
            value={zoneName}
            onChangeText={setZoneName}
            placeholder="Enter zone name"
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Radius (meters)</Text>
          <TextInput
            style={styles.input}
            value={radius}
            onChangeText={setRadius}
            placeholder="Enter radius in meters"
            placeholderTextColor="#666"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.mapContainer}>
          <Text style={styles.label}>Select Location</Text>
          <MapView
            style={styles.map}
            initialRegion={
              initialRegion
                ? {
                    ...initialRegion,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }
                : undefined
            }
            onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
          >
            {selectedLocation && (
              <>
                <Marker coordinate={selectedLocation} />
                <Circle
                  center={selectedLocation}
                  radius={Number(radius) || 0}
                  fillColor="rgba(0, 151, 178, 0.2)"
                  strokeColor="#0097B2"
                  strokeWidth={2}
                />
              </>
            )}
          </MapView>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>{isEditing ? 'Save Changes' : 'Save Safe Zone'}</Text>
          )}
        </TouchableOpacity>
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
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    marginBottom: 16,
  },
  map: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveButton: {
    backgroundColor: '#0097B2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
