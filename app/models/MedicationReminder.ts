export interface IMedicationReminder {
  _id: string;
  patientId: string;
  medicationName: string;
  type: string;
  dosage: string;
  frequency: number;
  medicationTimes: string[];
  startDate: Date;
  endDate?: Date;
  duration: string;
  specialInstructions?: string;
  status: 'pending' | 'taken' | 'missed';
  photoVerification?: {
    required: boolean;
    photoUrl?: string;
    verifiedAt?: Date;
  };
  lastNotificationSent?: Date;
  caregiverNotified?: boolean;
  caregiverNotification?: {
    enabled: boolean;
    delayHours: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
