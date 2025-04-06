export interface IAttentionRequest {
  _id: string;
  patientId: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'resolved';
  resolvedAt?: Date;
  resolvedBy?: 'patient' | 'caregiver';
  caregiverNotified: boolean;
  caregiverNotifiedAt?: Date;
  dismissed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
