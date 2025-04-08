import { registerForPushNotificationsAsync } from '@/services/notifications';
import { RelativePathString, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { API_CONFIG } from '../config/api.config';
import { Caregiver, CaregiverForm, Patient, User, UserCred } from '../models/User';
import apiClient from '../utils/apiClient';

interface AuthProps {
  authState?: { token: string | null; authenticated: boolean | null };
  user?: Patient | Caregiver | null;
  onRegister?: (userData: User | CaregiverForm) => void;
  onLogin?: (userData: UserCred) => void;
  onLogout?: () => void;
  onUserDetail?: () => Promise<Caregiver | Patient | null>;
  isLoading?: boolean;
}

interface JwtPayload {
  exp: number;
  [key: string]: any;
}

const AuthContext = createContext<AuthProps>({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [authState, setAuthState] = useState<{
    token: string | null;
    authenticated: boolean | null;
  }>({
    token: null,
    authenticated: null,
  });
  const [user, setUser] = useState<Patient | Caregiver | null>(null);

  const checkTokenExpiration = (token: string): boolean => {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  };

  const initializeAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync(API_CONFIG.TOKEN_KEY);
      if (token) {
        if (checkTokenExpiration(token)) {
          setAuthState({
            token,
            authenticated: true,
          });
          const details = await userDetails();
          setUser(details);
        } else {
          await SecureStore.deleteItemAsync(API_CONFIG.TOKEN_KEY);
          setAuthState({
            token: null,
            authenticated: false,
          });
        }
      } else {
        setAuthState({
          token: null,
          authenticated: false,
        });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setAuthState({
        token: null,
        authenticated: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  const userDetails = async (): Promise<Patient | Caregiver | null> => {
    try {
      const response = await apiClient.get('/users/me');
      const userData = response.data.data;
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const register = async (userData: User | CaregiverForm) => {
    try {
      const path = userData.userType === 'caregiver' ? '/registerCaregiver' : '/registerPatient';
      console.log('Registering user:', userData);
      console.log('path',path)
      await apiClient.post(`auth/${path}`, userData);

      // Automatically log in after successful registration
      await login({ email: userData.email, password: userData.password });
    } catch (error: any) {
      if (error.response) {
        Alert.alert('Error', error.response.data.message || 'Registration failed');
      } else {
        Alert.alert('Error', 'Network error occurred');
      }
    }
  };

  const login = async (userData: UserCred) => {
    try {
      const result = await apiClient.post('/auth/login', userData);
      const token = result.data.data;

      setAuthState({
        token,
        authenticated: true,
      });

      await SecureStore.setItemAsync(API_CONFIG.TOKEN_KEY, token);
      const details = await userDetails();
      setUser(details);

      // Initialize push notifications for caregivers and patients 
      if (details) {
        try {
          await registerForPushNotificationsAsync();
        } catch (error) {
          console.error('Error initializing push notifications:', error);
        }
      }

      router.replace('/home' as RelativePathString);
    } catch (error: any) {
      if (error.response) {
        Alert.alert('Error', error.response.data.data || 'Login failed');
      } else {
        Alert.alert('Error', 'Network error occurred');
      }
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(API_CONFIG.TOKEN_KEY);
    setAuthState({
      token: null,
      authenticated: false,
    });
    setUser(null);
    router.replace('/login' as RelativePathString);
  };

  const value = {
    onRegister: register,
    onLogin: login,
    onLogout: logout,
    onUserDetail: userDetails,
    authState,
    user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
