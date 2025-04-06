import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Colors from '../../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { IAttentionRequest } from '../models/AttentionRequest';
import { IFallEvent } from '../models/FallEvent';
import { IInventory } from '../models/Inventory';
import { IMedicationReminder } from '../models/MedicationReminder';
import { ISafezoneBreach } from '../models/SafezoneBreach';
import { ITaskReminder } from '../models/TaskReminder';
import FallDetectionService from '../services/FallDetectionService';
import apiClient from '../utils/apiClient';

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

interface Safezone {
  _id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
}

interface DashboardData {
  pendingMedications: IMedicationReminder[];
  pendingTasks: ITaskReminder[];
  inventoryItems: IInventory[];
  fallEvents: IFallEvent[];
  attentionRequests: IAttentionRequest[];
  safezoneBreaches: ISafezoneBreach[];
  safezones: Safezone[];
}

export default function HomeScreen() {
  const router = useRouter();
  const auth = useAuth();
  const user = auth.user;
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPatient, setIsPatient] = useState(false);
  const [isCaregiverAssigned, setIsCaregiverAssigned] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationData[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    pendingMedications: [],
    pendingTasks: [],
    inventoryItems: [],
    fallEvents: [],
    attentionRequests: [],
    safezoneBreaches: [],
    safezones: [],
  });

  const getLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLocationEnabled(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);

      if (isLocationEnabled && isPatient) {
        // Send location to server
        await apiClient.post('/patients/location', {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setIsLocationEnabled(false);
    }
  }, [isLocationEnabled, isPatient]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    if (isLocationEnabled && isPatient) {
      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 30000, // Update every 30 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (newLocation) => {
          setLocation(newLocation);
          // Send location to server
          apiClient
            .post('/patients/location', {
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
            })
            .catch((error) => {
              console.error('Error sending location update:', error);
            });
        },
      ).then((subscription) => {
        locationSubscription = subscription;
      });
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isLocationEnabled, isPatient]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/dashboard');
      if (response.data.status === 'ok') {
        const {
          user,
          pendingMedications,
          pendingTasks,
          inventoryItems,
          fallEvents,
          attentionRequests,
          locationSharing,
          safezones,
          safezoneBreaches,
        } = response.data.data;

        setIsPatient(user.userType === 'patient');
        setIsCaregiverAssigned(user.caregiverEmail !== null);

        setDashboardData({
          pendingMedications,
          pendingTasks,
          inventoryItems,
          fallEvents,
          attentionRequests,
          safezoneBreaches,
          safezones,
        });

        // Update location sharing status
        if (locationSharing) {
          setIsLocationEnabled(locationSharing.enabled);
          if (locationSharing.lastLocation) {
            setLocationHistory([locationSharing.lastLocation]);
          } else {
            setLocationHistory([]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      const pollInterval = setInterval(fetchDashboardData, 30000);

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [fetchDashboardData, user]);

  useEffect(() => {
    if (isPatient) {
      FallDetectionService.getInstance().startMonitoring();
    }

    return () => {
      if (isPatient) {
        FallDetectionService.getInstance().stopMonitoring();
      }
    };
  }, [isPatient]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  }, [fetchDashboardData]);

  const navigateToScreen = (path: string) => {
    router.push(path as any);
  };

  const handleCreateAttentionRequest = async () => {
    Alert.alert('Request Attention', 'Are you sure you need attention? This will notify your caregivers.', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Yes, I Need Help',
        style: 'destructive',
        onPress: async () => {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });

            const response = await apiClient.post('/attention-requests', {
              location: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              },
            });

            if (response.data.status === 'ok') {
              await fetchDashboardData();
            }
          } catch (error) {
            console.error('Error creating attention request:', error);
            Alert.alert('Error', 'Failed to create attention request');
          }
        },
      },
    ]);
  };

  const renderMedicationItem = (medication: IMedicationReminder) => (
    <TouchableOpacity
      key={medication._id}
      style={styles.medicationItem}
      onPress={() => router.push(`/medication/${medication._id}`)}
    >
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName}>{medication.medicationName}</Text>
        <Text style={styles.medicationDetails}>
          {medication.dosage} • {medication.type}
        </Text>
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={14} color="#0097B2" style={styles.timeIcon} />
          <Text style={styles.actionTime}>
            {medication.medicationTimes.map((time, index) => (
              <Text key={index}>
                {time}
                {index < medication.medicationTimes.length - 1 ? ', ' : ''}
              </Text>
            ))}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4BA7D1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.accountTypePill}>
            <Text style={styles.accountTypeText}>{user?.userType || ''}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.welcomeText}>Welcome, {user?.firstName || 'User'}!</Text>

        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigateToScreen('/medication')}>
            <Ionicons name="medical-outline" size={24} color="white" />
            <Text style={styles.gridTitle}>Medication Reminder</Text>
            <Text style={styles.gridSubtitle}>{dashboardData.pendingMedications.length} pending</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/safezone')}>
            <Ionicons name="location-outline" size={24} color="white" />
            <Text style={styles.gridTitle}>Safe Zones</Text>
            <Text style={styles.gridSubtitle}>{dashboardData.safezones.length} zones</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigateToScreen('/inventory')}>
            <Ionicons name="cube-outline" size={24} color="white" />
            <Text style={styles.gridTitle}>Inventory Management</Text>
            <Text style={styles.gridSubtitle}>{dashboardData.inventoryItems.length} items</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigateToScreen('/tasks')}>
            <Ionicons name="checkbox-outline" size={24} color="white" />
            <Text style={styles.gridTitle}>Task Reminder</Text>
            <Text style={styles.gridSubtitle}>{dashboardData.pendingTasks.length} pending</Text>
          </TouchableOpacity>
        </View>

        {!isPatient && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Emergency Notifications</Text>
            </View>
            {dashboardData.fallEvents.length === 0 &&
            dashboardData.attentionRequests.length === 0 &&
            dashboardData.safezoneBreaches.length === 0 ? (
              <Text style={styles.emptyText}>No emergency notifications</Text>
            ) : (
              <>
                {dashboardData.fallEvents.map((event: IFallEvent) => (
                  <TouchableOpacity
                    key={event._id}
                    style={styles.emergencyCard}
                    onPress={() => {
                      router.push(`/emergency/${event._id}`);
                    }}
                  >
                    <View style={styles.emergencyHeader}>
                      <View style={styles.emergencyTitleContainer}>
                        <Text style={styles.emergencyTitle}>Fall Detected</Text>
                        <Text style={styles.emergencyTime}>{new Date(event.timestamp).toLocaleString()}</Text>
                      </View>
                    </View>
                    {event.location && (
                      <Text style={styles.emergencyLocation}>
                        Location: {event.location.latitude.toFixed(6)}, {event.location.longitude.toFixed(6)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
                {dashboardData.attentionRequests.map((request: IAttentionRequest) => (
                  <TouchableOpacity
                    key={request._id}
                    style={styles.emergencyCard}
                    onPress={() => {
                      router.push(`/attention/${request._id}`);
                    }}
                  >
                    <View style={styles.emergencyHeader}>
                      <View style={styles.emergencyTitleContainer}>
                        <Text style={styles.emergencyTitle}>Attention Requested</Text>
                        <Text style={styles.emergencyTime}>{new Date(request.timestamp).toLocaleString()}</Text>
                      </View>
                    </View>
                    {request.location && (
                      <Text style={styles.emergencyLocation}>
                        Location: {request.location.latitude.toFixed(6)}, {request.location.longitude.toFixed(6)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
                {dashboardData.safezoneBreaches.map((breach: ISafezoneBreach) => (
                  <TouchableOpacity
                    key={breach._id}
                    style={styles.emergencyCard}
                    onPress={() => {
                      router.push(`/safezone-breach/${breach._id}`);
                    }}
                  >
                    <View style={styles.emergencyHeader}>
                      <View style={styles.emergencyTitleContainer}>
                        <Text style={styles.emergencyTitle}>Safezone Breach Detected</Text>
                        <Text style={styles.emergencyTime}>{new Date(breach.timestamp).toLocaleString()}</Text>
                      </View>
                    </View>
                    {breach.location && (
                      <Text style={styles.emergencyLocation}>
                        Location: {breach.location.latitude.toFixed(6)}, {breach.location.longitude.toFixed(6)}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Reminders</Text>
          {dashboardData.pendingMedications.length === 0 && dashboardData.pendingTasks.length === 0 ? (
            <Text style={styles.emptyText}>No pending reminders</Text>
          ) : (
            <>
              {dashboardData.pendingMedications.map(renderMedicationItem)}
              {dashboardData.pendingTasks.map((task) => (
                <TouchableOpacity
                  key={task._id}
                  style={styles.actionItem}
                  onPress={() => navigateToScreen(`/tasks/${task._id}`)}
                >
                  <Ionicons name="checkbox-outline" size={24} color="#4BA7D1" />
                  <View style={styles.actionContent}>
                    <Text style={styles.actionTitle}>{task.taskName}</Text>
                    <Text style={styles.actionTime}>{task.reminderTime}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#666" />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Low Stock Items</Text>
          {dashboardData.inventoryItems.filter((item) => item.needsReplenishment).length === 0 ? (
            <Text style={styles.emptyText}>No low stock inventory items</Text>
          ) : (
            <>
              {dashboardData.inventoryItems
                .filter((item) => item.needsReplenishment)
                .map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={styles.actionItem}
                    onPress={() => navigateToScreen(`/inventory/${item._id}`)}
                  >
                    <Ionicons name="cube-outline" size={24} color="#4BA7D1" />
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>{item.itemName}</Text>
                      <Text style={styles.actionTime}>
                        {item.quantity} {item.unit}
                        {item.needsReplenishment && ' • Low Stock'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#666" />
                  </TouchableOpacity>
                ))}
              {dashboardData.inventoryItems.length > 3 && (
                <TouchableOpacity style={styles.viewMoreButton} onPress={() => navigateToScreen('/inventory')}>
                  <Text style={styles.viewMoreText}>View All Inventory Items</Text>
                  <Ionicons name="chevron-forward" size={24} color="#4BA7D1" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{isPatient ? 'Your Location' : 'Patient Location'}</Text>
            {isPatient && (
              <TouchableOpacity
                style={[styles.toggleButton, isLocationEnabled && styles.toggleButtonEnabled]}
                onPress={async () => {
                  try {
                    const newState = !isLocationEnabled;
                    await apiClient.post('/patients/location-sharing', {
                      enabled: newState,
                    });
                    setIsLocationEnabled(newState);
                    if (!newState) {
                      setLocation(null);
                      setLocationHistory([]);
                    }
                  } catch (error) {
                    console.error('Error toggling location sharing:', error);
                    Alert.alert('Error', 'Failed to update location sharing settings');
                  }
                }}
              >
                <View style={[styles.toggleCircle, isLocationEnabled && styles.toggleCircleEnabled]} />
              </TouchableOpacity>
            )}
          </View>
          {isPatient ? (
            isLocationEnabled && location ? (
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                  userInterfaceStyle="light"
                >
                  <Marker
                    coordinate={{
                      latitude: location.coords.latitude,
                      longitude: location.coords.longitude,
                    }}
                    title="Current Location"
                    description={new Date().toLocaleString()}
                  />
                  {locationHistory.map((loc, index) => (
                    <Marker
                      key={index}
                      coordinate={{
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                      }}
                      title="Previous Location"
                      description={new Date(loc.timestamp).toLocaleString()}
                      pinColor="#4BA7D1"
                    />
                  ))}
                </MapView>
              </View>
            ) : (
              <Text style={styles.emptyText}>
                {isLocationEnabled ? 'Getting location...' : 'Enable location sharing to view the map'}
              </Text>
            )
          ) : locationHistory.length > 0 ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: locationHistory[0].latitude,
                  longitude: locationHistory[0].longitude,
                  latitudeDelta: 0.0922,
                  longitudeDelta: 0.0421,
                }}
                userInterfaceStyle="light"
              >
                <Marker
                  coordinate={{
                    latitude: locationHistory[0].latitude,
                    longitude: locationHistory[0].longitude,
                  }}
                  title="Patient Location"
                  description={`Last updated: ${new Date(locationHistory[0].timestamp).toLocaleString()}`}
                  pinColor="#4BA7D1"
                />
              </MapView>
            </View>
          ) : (
            <Text style={styles.emptyText}>No patient location available</Text>
          )}
        </View>
      </ScrollView>
      {isPatient && isCaregiverAssigned && (
        <TouchableOpacity style={styles.attentionButton} onPress={handleCreateAttentionRequest}>
          <View style={styles.attentionButtonContent}>
            <Ionicons name="warning" size={24} color="white" />
            <Text style={styles.attentionButtonText}>Request Attention</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    marginHorizontal: 'auto',
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
  },
  gridItem: {
    width: '48%',
    backgroundColor: '#4BA7D1',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  disabledGridItem: {
    opacity: 0.7,
  },
  gridTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  gridSubtitle: {
    color: '#fff',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
    color: '#000',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  actionContent: {
    flex: 1,
    marginLeft: 15,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    fontStyle: 'italic',
  },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  accountTypePill: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  accountTypeText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginTop: 8,
  },
  viewMoreText: {
    color: '#4BA7D1',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  emergencyCard: {
    backgroundColor: '#FFF3F3',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  emergencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  emergencyTitleContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 4,
  },
  emergencyTime: {
    fontSize: 14,
    color: '#666',
  },
  emergencyLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  dismissButtonText: {
    fontSize: 24,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  attentionButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FF3B30',
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
  attentionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '500',
  },
  medicationDetails: {
    fontSize: 14,
    color: '#666',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timeIcon: {
    marginRight: 4,
  },
  toggleButton: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    padding: 2,
  },
  toggleButtonEnabled: {
    backgroundColor: '#4BA7D1',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  toggleCircleEnabled: {
    transform: [{ translateX: 16 }],
  },
});
