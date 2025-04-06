export type UserType = 'patient' | 'caregiver';
export type Gender = 'male' | 'female';

export interface User {
  _id?: string;
  userType: UserType | null;
  firstName: string;
  lastName: string;
  gender: Gender;
  birthday: string;
  email: string;
  password: string;
  profileImage?: string;
}

export interface Caregiver extends User {
  patientEmail: string;
}

export interface Patient extends User {
  caregiverEmail: string;
  uniqueCode: number;
}

export interface CaregiverForm extends Caregiver {
  uniqueCode: number;
}

export interface UserCred {
  email: string;
  password: string;
}
