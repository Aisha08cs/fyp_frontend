import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import { Alert } from 'react-native';
import apiClient from '../utils/apiClient';

class FallDetectionService {
  private static instance: FallDetectionService;
  private isMonitoring: boolean = false;
  private lastAcceleration: { x: number; y: number; z: number } | null = null;
  private readonly FALL_THRESHOLD = 7;
  private readonly SAMPLES_PER_SECOND = 10;
  private readonly SAMPLES_TO_CHECK = 5;
  private isAlertActive: boolean = false;
  private readonly COOLDOWN_PERIOD = 10000;
  private lastFallTime: number = 0;

  private constructor() {}

  public static getInstance(): FallDetectionService {
    if (!FallDetectionService.instance) {
      FallDetectionService.instance = new FallDetectionService();
    }
    return FallDetectionService.instance;
  }

  public async startMonitoring() {
    if (this.isMonitoring) return;

    try {
      // Request location permissions if not already granted
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // Set up accelerometer
      await Accelerometer.setUpdateInterval(1000 / this.SAMPLES_PER_SECOND);
      this.isMonitoring = true;

      Accelerometer.addListener(({ x, y, z }) => {
        this.detectFall(x, y, z);
      });
    } catch (error) {
      console.error('Error starting fall detection:', error);
    }
  }

  public stopMonitoring() {
    if (!this.isMonitoring) return;

    Accelerometer.removeAllListeners();
    this.isMonitoring = false;
    this.lastAcceleration = null;
    this.isAlertActive = false;
  }

  private async detectFall(x: number, y: number, z: number) {
    if (!this.lastAcceleration) {
      this.lastAcceleration = { x, y, z };
      return;
    }

    const acceleration = Math.sqrt(
      Math.pow(x - this.lastAcceleration.x, 2) +
        Math.pow(y - this.lastAcceleration.y, 2) +
        Math.pow(z - this.lastAcceleration.z, 2),
    );

    // Check if we're in cooldown period or if an alert is active
    const now = Date.now();
    if (now - this.lastFallTime < this.COOLDOWN_PERIOD || this.isAlertActive) {
      return;
    }

    if (acceleration > this.FALL_THRESHOLD) {
      this.lastFallTime = now;
      await this.handlePotentialFall();
    }

    this.lastAcceleration = { x, y, z };
  }

  private async handlePotentialFall() {
    if (this.isAlertActive) return;

    try {
      this.isAlertActive = true;

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Create fall event
      const response = await apiClient.post('/fall-events', {
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
      });

      if (response.data.status === 'ok') {
        // Show confirmation dialog
        Alert.alert(
          'Fall Detected',
          'Are you okay?',
          [
            {
              text: 'I am okay',
              onPress: async () => {
                await this.confirmFallEvent(response.data.data._id, 'resolved');
                this.isAlertActive = false;
              },
            },
            {
              text: 'I need help',
              onPress: async () => {
                await this.confirmFallEvent(response.data.data._id, 'confirmed');
                this.isAlertActive = false;
              },
            },
          ],
          {
            cancelable: false,
            onDismiss: () => {
              this.isAlertActive = false;
            },
          },
        );
      }
    } catch (error) {
      console.error('Error handling potential fall:', error);
      this.isAlertActive = false;
    }
  }

  private async confirmFallEvent(eventId: string, status: 'confirmed' | 'resolved') {
    try {
      await apiClient.patch(`/fall-events/${eventId}/status`, {
        status,
      });
    } catch (error) {
      console.error('Error confirming fall event:', error);
    }
  }
}

export default FallDetectionService;
