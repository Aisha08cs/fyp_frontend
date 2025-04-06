import { ITaskReminder } from '@/app/models/TaskReminder';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import apiClient from '../utils/apiClient';

const TaskDetail = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [task, setTask] = useState<ITaskReminder | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isCaregiver = user && 'patientEmail' in user;

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

  const fetchTaskDetails = async () => {
    try {
      const response = await apiClient.get(`/task-reminders/${id}`);
      if (response.data.status === 'ok') {
        setTask(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching task details:', error);
      Alert.alert('Error', 'Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      const response = await apiClient.post(`/task-reminders/${id}/complete`);
      if (response.data.status === 'ok') {
        setTask(response.data.data);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0097B2" />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Task Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{task.taskName}</Text>
          </View>
          {task.description && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{task.description}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.label}>Status</Text>
            <View style={[styles.statusBadge, styles[`status${task.status}`]]}>
              <Text style={styles.statusText}>{task.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{task.reminderTime}</Text>
          </View>
          <View style={styles.infoRow}>
            {/* <Text style={styles.label}>Frequency</Text>
            <Text style={styles.value}>{task.frequency}x daily</Text> */}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Duration</Text>
            <Text style={styles.value}>{task.duration} days</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caregiver Notification</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Enabled</Text>
            <Text style={styles.value}>{task.caregiverNotification?.enabled ? 'Yes' : 'No'}</Text>
          </View>
          {task.caregiverNotification?.enabled && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>Delay</Text>
              <Text style={styles.value}>{task.caregiverNotification.delayHours} hours</Text>
            </View>
          )}
        </View>

        {!isCaregiver && task.status === 'pending' && (
          <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
            <Text style={styles.completeButtonText}>Mark as Complete</Text>
          </TouchableOpacity>
        )}
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
    color: '#FF3B30',
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
  headerActions: {
    flexDirection: 'row',
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statuspending: {
    backgroundColor: '#FFE5E5',
  },
  statuscompleted: {
    backgroundColor: '#E5FFE5',
  },
  statusmissed: {
    backgroundColor: '#FFE5E5',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  completeButton: {
    backgroundColor: '#0097B2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TaskDetail;
