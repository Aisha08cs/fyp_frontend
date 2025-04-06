export interface ISafezone {
  _id: string;
  patientId: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  createdAt: string;
  updatedAt: string;
}
