export interface ITaskReminder {
  _id: string;
  patientId: string;
  taskName: string;
  description?: string;
  reminderTime: string;
  startDate: Date;
  endDate?: Date;
  frequency: 1 | number;
  duration: string;
  status: 'pending' | 'completed' | 'missed';
  caregiverNotification?: {
    enabled: boolean;
    delayHours: number;
  };
  lastNotificationSent?: Date;
  caregiverNotified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
