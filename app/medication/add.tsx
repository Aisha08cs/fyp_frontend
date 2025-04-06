import { IMedicationReminder } from '@/app/models/MedicationReminder';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { Patient } from '../models/User';
import apiClient from '../utils/apiClient';

const MEDICATION_TYPES = [
  { id: 'tablet', label: 'Tablet', icon: '💊' },
  { id: 'capsule', label: 'Capsule', icon: '💊' },
  { id: 'liquid', label: 'Liquid', icon: '🧪' },
  { id: 'spray', label: 'Spray', icon: '💨' },
  { id: 'injection', label: 'Injection', icon: '💉' },
  { id: 'inhaler', label: 'Inhaler', icon: '🌬️' },
  { id: 'cream', label: 'Cream', icon: '🧴' },
  { id: 'patch', label: 'Patch', icon: '🩹' },
];

const DURATION_OPTIONS = [
  { id: '7', label: '7 days' },
  { id: '14', label: '14 days' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
  { id: '180', label: '180 days' },
  { id: '365', label: '365 days' },
  { id: 'ongoing', label: 'Ongoing' },
];

const AddEditReminder = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;
  const { user } = useAuth();
  const [medicationName, setMedicationName] = useState('');
  const [type, setType] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [medicationTimes, setMedicationTimes] = useState<Date[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeIndex, setActiveTimeIndex] = useState(0);
  const [duration, setDuration] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [caregiverNotificationEnabled, setCaregiverNotificationEnabled] = useState(false);
  const [caregiverNotificationDelay, setCaregiverNotificationDelay] = useState('4');
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    const freq = parseInt(frequency, 10) || 0;
    if (freq > 0) {
      const currentTimes = [...medicationTimes];
      if (freq > currentTimes.length) {
        while (currentTimes.length < freq) {
          currentTimes.push(new Date());
        }
      } else if (freq < currentTimes.length) {
        currentTimes.splice(freq);
      }
      setMedicationTimes(currentTimes);
    } else {
      setMedicationTimes([]);
    }
  }, [frequency]);

  useEffect(() => {
    if (isEditing) {
      fetchMedicationDetails();
    }
  }, [id]);

  const fetchMedicationDetails = async () => {
    try {
      const response = await apiClient.get(`/medication-reminders/${id}`);
      if (response.data.status === 'ok') {
        const reminder: IMedicationReminder = response.data.data;
        setMedicationName(reminder.medicationName);
        setType(reminder.type);
        setDosage(reminder.dosage);
        setFrequency(reminder.frequency.toString());
        setMedicationTimes(reminder.medicationTimes.map((time) => new Date(`2000-01-01T${time}`)));
        setDuration(reminder.duration);
        setSpecialInstructions(reminder.specialInstructions || '');
        setCaregiverNotificationEnabled(reminder.caregiverNotification?.enabled || false);
        setCaregiverNotificationDelay(reminder.caregiverNotification?.delayHours.toString() || '4');
      }
    } catch (error) {
      console.error('Error fetching medication details:', error);
      Alert.alert('Error', 'Failed to fetch medication details');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || new Date();
    setShowTimePicker(Platform.OS === 'ios');
    const newTimes = [...medicationTimes];
    newTimes[activeTimeIndex] = currentTime;
    setMedicationTimes(newTimes);
  };

  const handleTimeButtonPress = (index: number) => {
    setActiveTimeIndex(index);
    setShowTimePicker(true);
  };

  const handleCaregiverNotificationToggle = (value: boolean) => {
    if (user?.userType === 'patient') {
      const patient = user as Patient;
      if (!patient.caregiverEmail) {
        Alert.alert(
          'No Caregiver',
          'You need to invite a caregiver to use this feature. Please go to your profile to invite a caregiver.',
          [{ text: 'OK' }],
        );
        return;
      }
    }
    setCaregiverNotificationEnabled(value);
  };

  const handleSave = async () => {
    try {
      if (!medicationName || !type || !dosage || !frequency || !duration) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (medicationTimes.length !== parseInt(frequency, 10)) {
        Alert.alert('Error', 'Please set all medication times');
        return;
      }

      const data = {
        medicationName,
        type,
        dosage,
        frequency: parseInt(frequency, 10),
        medicationTimes: medicationTimes.map((time) => format(time, 'HH:mm')),
        duration,
        specialInstructions,
        caregiverNotification: caregiverNotificationEnabled
          ? {
              enabled: true,
              delayHours: parseInt(caregiverNotificationDelay, 10),
            }
          : {
              enabled: false,
            },
      };

      const response = await (isEditing
        ? apiClient.put(`/medication-reminders/${id}`, data)
        : apiClient.post('/medication-reminders', data));

      if (response.data.status !== 'ok') {
        throw new Error(`Failed to ${isEditing ? 'update' : 'save'} medication reminder`);
      }

      router.back();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'saving'} medication reminder:`, error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'save'} medication reminder. Please try again.`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading medication details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit' : 'Add'} Medication</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formGroup}>
          <Text style={styles.label}>Medication Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Medication Name"
            placeholderTextColor="#000"
            value={medicationName}
            onChangeText={setMedicationName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.typeContainer}>
            {MEDICATION_TYPES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.typeButton, type === item.id && styles.typeButtonSelected]}
                onPress={() => setType(item.id)}
              >
                <Text style={styles.typeIcon}>{item.icon}</Text>
                <Text style={[styles.typeLabel, type === item.id && styles.typeLabelSelected]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Dosage</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter dosage (e.g., 15mg, 100ml)"
            value={dosage}
            onChangeText={setDosage}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Frequency</Text>
          <TextInput
            style={styles.input}
            placeholder="Number of times per day"
            value={frequency}
            onChangeText={setFrequency}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Times</Text>
          <View style={styles.timesContainer}>
            {medicationTimes.map((time, index) => (
              <TouchableOpacity key={index} style={styles.timeButton} onPress={() => handleTimeButtonPress(index)}>
                <Text style={styles.timeButtonText}>
                  Time {index + 1}: {format(time, 'h:mm aa')}
                </Text>
                <Ionicons name="time-outline" size={24} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
          {showTimePicker && (
            <DateTimePicker
              testID="timePicker"
              value={medicationTimes[activeTimeIndex] || new Date()}
              mode="time"
              textColor="#000"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleTimeChange}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Duration</Text>
          <View style={styles.durationContainer}>
            {DURATION_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.durationButton, duration === item.id && styles.durationButtonSelected]}
                onPress={() => setDuration(item.id)}
              >
                <Text style={[styles.durationLabel, duration === item.id && styles.durationLabelSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.notificationHeader}>
            <Text style={styles.label}>Caregiver Notification</Text>
            <Switch
              value={caregiverNotificationEnabled}
              onValueChange={handleCaregiverNotificationToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={caregiverNotificationEnabled ? '#0097B2' : '#f4f3f4'}
            />
          </View>
          {caregiverNotificationEnabled && (
            <View style={styles.notificationSettings}>
              <Text style={styles.subLabel}>Notify caregiver after</Text>
              <View style={styles.delayContainer}>
                <TextInput
                  style={[styles.input, styles.delayInput]}
                  value={caregiverNotificationDelay}
                  onChangeText={setCaregiverNotificationDelay}
                  keyboardType="numeric"
                />
                <Text style={styles.delayLabel}>hours</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Special Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Any special instructions?"
            placeholderTextColor="#000"
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    color: '#0097B2',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  formGroup: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
    marginBottom: 8,
  },
  typeButtonSelected: {
    backgroundColor: '#E3F2FD',
  },
  typeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 14,
    color: '#666',
  },
  typeLabelSelected: {
    color: '#0097B2',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  durationButtonSelected: {
    backgroundColor: '#E3F2FD',
  },
  durationLabel: {
    fontSize: 14,
    color: '#666',
  },
  durationLabelSelected: {
    color: '#0097B2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationSettings: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  delayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  delayInput: {
    flex: 1,
  },
  delayLabel: {
    fontSize: 16,
    color: '#666',
  },
  subLabel: {
    fontSize: 14,
    color: '#333',
  },
  timesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

export default AddEditReminder;
