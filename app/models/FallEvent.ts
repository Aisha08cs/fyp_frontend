export interface IFallEvent {
  _id: string;
  patientId: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'confirmed' | 'resolved';
  confirmedAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: 'patient' | 'caregiver';
  caregiverNotified: boolean;
  caregiverNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
