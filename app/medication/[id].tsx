import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/apiClient';

interface MedicationDetails {
  _id: string;
  medicationName: string;
  type: string;
  dosage: string;
  medicationTimes: string[];
  status: 'pending' | 'taken' | 'missed';
  photoVerification?: {
    required: boolean;
    photoUrl?: string;
    verifiedAt?: string;
  };
}

export default function MedicationDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [medication, setMedication] = useState<MedicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const isCaregiver = user && 'patientEmail' in user;

  const fetchMedication = async () => {
    try {
      const response = await apiClient.get(`/medication-reminders/${id}`);
      if (response.data.status === 'ok') {
        setMedication(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching medication:', error);
      Alert.alert('Error', 'Failed to fetch medication details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedication();
  }, [id]);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take a photo');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.1,
        base64: true,
      });

      if (!result.canceled) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await handleUploadPhoto(base64Image);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUploadPhoto = async (base64Image: string) => {
    try {
      setUploading(true);
      const response = await apiClient.post(`/medication-reminders/${id}/verify`, {
        photoUrl: base64Image,
      });

      if (response.data.status === 'ok') {
        setMedication(response.data.data);
        Alert.alert('Success', 'Medication marked as taken');
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleMarkAsTaken = async () => {
    if (medication?.photoVerification?.required) {
      handleTakePhoto();
    } else {
      try {
        const response = await apiClient.put(`/medication-reminders/${id}`, {
          status: 'taken',
        });

        if (response.data.status === 'ok') {
          setMedication(response.data.data);
          Alert.alert('Success', 'Medication marked as taken');
        }
      } catch (error) {
        console.error('Error marking as taken:', error);
        Alert.alert('Error', 'Failed to mark medication as taken');
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!medication) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.medicationName}>{medication.medicationName}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{medication.type}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Dosage</Text>
              <Text style={styles.infoValue}>{medication.dosage}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Times</Text>
              <Text style={styles.infoValue}>
                {medication.medicationTimes.map((time, index) => (
                  <Text key={index}>
                    Time {index + 1}: {time}
                    {'\n'}
                  </Text>
                ))}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.status, styles[medication.status]]}>{medication.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{medication.medicationTimes.join(', ')}</Text>
          </View>
        </View>

        {!isCaregiver && medication.status !== 'taken' && (
          <View style={styles.verificationSection}>
            <Text style={styles.sectionTitle}>Verification</Text>
            {medication.photoVerification?.required && (
              <Text style={styles.verificationText}>
                Please take a photo of the medication before marking it as taken
              </Text>
            )}
            <TouchableOpacity style={styles.takeButton} onPress={handleMarkAsTaken} disabled={uploading}>
              <Text style={styles.takeButtonText}>{uploading ? 'Processing...' : 'Mark as Taken'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {medication.photoVerification?.photoUrl && (
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Verification Photo</Text>
            <Image source={{ uri: medication.photoVerification.photoUrl }} style={styles.verificationPhoto} />
            <Text style={styles.verificationTime}>
              Verified at: {new Date(medication.photoVerification.verifiedAt!).toLocaleString()}
            </Text>
          </View>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  pending: {
    backgroundColor: '#FFF3E0',
    color: '#F57C00',
  },
  taken: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  missed: {
    backgroundColor: '#FFEBEE',
    color: '#D32F2F',
  },
  verificationSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  takeButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  takeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  verificationPhoto: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  verificationTime: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
});
