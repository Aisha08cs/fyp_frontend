export interface User {
  id: string;
  email: string;
  name: string;
  type: 'Patient' | 'Caregiver';
  image?: string;
  birthday?: string;
  gender?: string;
  assignedCaregiver?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface AuthState {
  token: string | null;
  authenticated: boolean;
}

export interface AuthContextProps {
  user: User | null;
  authState: AuthState;
  isLoading: boolean;
  onRegister: (data: any) => Promise<void>;
  onLogin: (data: any) => Promise<void>;
  onLogout: () => Promise<void>;
  onUserDetail: (data: Partial<User>) => Promise<void>;
}
