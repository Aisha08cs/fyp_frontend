import { ITaskReminder } from '@/app/models/TaskReminder';
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

const DURATION_OPTIONS = [
  { id: '7', label: '7 days' },
  { id: '14', label: '14 days' },
  { id: '30', label: '30 days' },
  { id: '90', label: '90 days' },
  { id: '180', label: '180 days' },
  { id: '365', label: '365 days' },
  { id: 'ongoing', label: 'Ongoing' },
];

const AddEditTask = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const isEditing = !!id;
  const { user } = useAuth();
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [frequency, setFrequency] = useState('1');
  const [duration, setDuration] = useState('');
  const [caregiverNotificationEnabled, setCaregiverNotificationEnabled] = useState(false);
  const [caregiverNotificationDelay, setCaregiverNotificationDelay] = useState('4');
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      fetchTaskDetails();
    }
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const response = await apiClient.get(`/task-reminders/${id}`);
      if (response.data.status === 'ok') {
        const task: ITaskReminder = response.data.data;
        setTaskName(task.taskName);
        setDescription(task.description || '');
        setReminderTime(new Date(`2000-01-01T${task.reminderTime}`));
        setFrequency(task.frequency.toString());
        setDuration(task.duration);
        setCaregiverNotificationEnabled(task.caregiverNotification?.enabled || false);
        setCaregiverNotificationDelay(task.caregiverNotification?.delayHours.toString() || '4');
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      Alert.alert('Error', 'Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    const currentTime = selectedTime || new Date();
    setShowTimePicker(Platform.OS === 'ios');
    setReminderTime(currentTime);
  };

  const handleSave = async () => {
    try {
      if (!taskName || !frequency || !duration) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const data = {
        taskName,
        description,
        reminderTime: format(reminderTime, 'HH:mm'),
        frequency: parseInt("1", 10),
        duration,
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
        ? apiClient.put(`/task-reminders/${id}`, data)
        : apiClient.post('/task-reminders', data));

      if (response.data.status !== 'ok') {
        throw new Error(`Failed to ${isEditing ? 'update' : 'save'} task reminder`);
      }

      router.back();
      router.setParams({ refresh: Date.now().toString() });
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'saving'} task reminder:`, error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'save'} task reminder. Please try again.`);
    }
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading task details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit' : 'Add'} Task</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.formGroup}>
          <Text style={styles.label}>Task Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Task Name"
            placeholderTextColor="#000"
            value={taskName}
            onChangeText={setTaskName}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Task description (optional)"
            placeholderTextColor="#000"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.formGroup}>
          {/* <Text style={styles.label}>Frequency</Text>
          <TextInput
            style={styles.input}
            placeholder="Number of times per day"
            value={frequency}
            placeholderTextColor="#000"
            onChangeText={setFrequency}
            keyboardType="numeric"
          /> */}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Time</Text>
          <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(!showTimePicker)}>
            <Text style={styles.timeButtonText}>{format(reminderTime, 'h:mm aa')}</Text>
            <Ionicons name="time-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {showTimePicker && (
          <DateTimePicker
            testID="timePicker"
            value={reminderTime}
            mode="time"
            textColor="#000"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
          />
        )}

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
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
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
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  timeButtonText: {
    fontSize: 16,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  durationButtonSelected: {
    backgroundColor: '#0097B2',
    borderColor: '#0097B2',
  },
  durationLabel: {
    fontSize: 14,
    color: '#000',
  },
  durationLabelSelected: {
    color: '#FFFFFF',
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
});

export default AddEditTask;
