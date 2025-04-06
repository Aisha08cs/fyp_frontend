import { ITaskReminder } from '@/app/models/TaskReminder';
import apiClient from '@/app/utils/apiClient';
import ListItem from '@/components/ListItem';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

const TaskList = () => {
  const router = useRouter();
  const { refresh } = useLocalSearchParams();
  const [tasks, setTasks] = useState<ITaskReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const response = await apiClient.get('/task-reminders');

      if (response.data.status === 'ok') {
        setTasks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      Alert.alert('Error', 'Failed to fetch tasks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Use focus effect to refresh data when returning to the screen
  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, []),
  );

  // Initial load and handle refresh parameter
  useEffect(() => {
    fetchTasks();
  }, [refresh]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await apiClient.delete(`/task-reminders/${id}`);
            if (response.data.status === 'ok') {
              setTasks((prev) => prev.filter((task) => task._id !== id));
            }
          } catch (error) {
            console.error('Error deleting task:', error);
            Alert.alert('Error', 'Failed to delete task');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: ITaskReminder }) => (
    <ListItem
      title={item.taskName}
      description={item.description}
      // details={`${item.frequency}x daily • ${item.duration}`}
      status={{
        text: item.status,
        style: item.status === 'completed' ? 'success' : item.status === 'missed' ? 'error' : 'warning',
      }}
      time={{
        text: item.reminderTime,
      }}
      notification={
        item.caregiverNotification?.enabled
          ? {
              text: `Caregiver notified after ${item.caregiverNotification.delayHours} hours`,
            }
          : undefined
      }
      onPress={() => router.push(`/tasks/${item._id}`)}
      actionButtons={[
        {
          icon: 'pencil',
          color: '#0097B2',
          onPress: () =>
            router.push({
              pathname: '/tasks/add',
              params: { id: item._id },
            }),
        },
        {
          icon: 'trash-outline',
          color: '#FF3B30',
          onPress: () => handleDelete(item._id),
        },
      ]}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Reminders</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0097B2" />
        </View>
      ) : (
        <>
          <FlatList
            data={tasks}
            renderItem={renderItem}
            keyExtractor={(item) => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContent}
          />
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/tasks/add')}>
            <View style={styles.addButtonContent}>
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>Add New Task</Text>
            </View>
          </TouchableOpacity>
        </>
      )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100, // Add padding to prevent content from being hidden behind the FAB
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

export default TaskList;
