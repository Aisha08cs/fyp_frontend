export interface ISafezoneBreach {
  _id: string;
  patientId: string;
  safezoneId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  dismissed: boolean;
  dismissedAt?: Date;
  dismissedBy?: string;
}
