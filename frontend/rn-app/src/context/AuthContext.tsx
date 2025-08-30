import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const API_URL = 'http://localhost:8000'; // Your backend URL

interface SearchResultUser {
  id: number;
  email: string;
  nickname: string;
}

interface Notification {
  id: number;
  message: string;
  type: string;
  status: string;
  created_at: string;
  related_trip_id?: number;
}

// Define the shape of the context state
interface AuthState {
  token: string | null;
  authenticated: boolean;
  user: any; // You can define a proper User type here
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, nickname: string) => Promise<boolean>;
  createTrip: (tripData: any) => Promise<any | null>;
  getTrips: () => Promise<any[]>;
  getTripDetails: (tripId: string) => Promise<any | null>;
  searchUsers: (email: string) => Promise<SearchResultUser[]>;
  inviteUser: (tripId: string, userId: number) => Promise<boolean>;
  getNotifications: () => Promise<Notification[]>;
  acceptInvitation: (notificationId: number) => Promise<boolean>;
  declineInvitation: (notificationId: number) => Promise<boolean>;
  deleteItineraryItem: (tripId: string, itemId: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: null,
    authenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    const loadToken = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const userResponse = await axios.get(`${API_URL}/v1/users/me`);
          setAuthState({
            token: token,
            authenticated: true,
            user: userResponse.data,
            loading: false,
          });
        } else {
          setAuthState({ ...authState, loading: false });
        }
      } catch (error) {
        await AsyncStorage.removeItem('token');
        setAuthState({ token: null, authenticated: false, user: null, loading: false });
      }
    };
    loadToken();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/v1/users/login`, { email, password });
      const { access_token } = response.data;
      await AsyncStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      const userResponse = await axios.get(`${API_URL}/v1/users/me`);
      setAuthState({ token: access_token, authenticated: true, user: userResponse.data, loading: false });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const signup = async (email: string, password: string, nickname: string) => {
    try {
      await axios.post(`${API_URL}/v1/users/register`, { email, password, nickname });
      return true;
    } catch (error) {
      console.error('Signup failed:', error);
      return false;
    }
  };

  const createTrip = async (tripData: any) => {
    try {
      const response = await axios.post(`${API_URL}/v1/trips`, tripData);
      return response.data;
    } catch (error) {
      console.error('Trip creation failed:', error);
      return null;
    }
  };

  const getTrips = async () => {
    try {
      const response = await axios.get(`${API_URL}/v1/users/me/trips`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      return [];
    }
  };

  const getTripDetails = async (tripId: string) => {
    try {
      const response = await axios.get(`${API_URL}/v1/trips/${tripId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch trip details:', error);
      return null;
    }
  };

  const searchUsers = async (email: string): Promise<SearchResultUser[]> => {
    try {
      const response = await axios.get(`${API_URL}/v1/users/search?email_query=${email}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  };

  const inviteUser = async (tripId: string, userId: number): Promise<boolean> => {
    try {
      await axios.post(`${API_URL}/v1/trips/${tripId}/invite`, { user_id: userId });
      return true;
    } catch (error) {
      console.error('Failed to invite user:', error);
      return false;
    }
  };

  const getNotifications = async (): Promise<Notification[]> => {
    try {
      const response = await axios.get(`${API_URL}/v1/notifications`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  };

  const acceptInvitation = async (notificationId: number): Promise<boolean> => {
    try {
      await axios.post(`${API_URL}/v1/notifications/${notificationId}/accept`);
      return true;
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      return false;
    }
  };

  const declineInvitation = async (notificationId: number): Promise<boolean> => {
    try {
      await axios.post(`${API_URL}/v1/notifications/${notificationId}/decline`);
      return true;
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      return false;
    }
  };

  const deleteItineraryItem = async (tripId: string, itemId: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/v1/trips/${tripId}/itinerary-items/${itemId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete itinerary item:', error);
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setAuthState({ token: null, authenticated: false, user: null, loading: false });
  };

  const value = {
    ...authState,
    login,
    logout,
    signup,
    createTrip,
    getTrips,
    getTripDetails,
    searchUsers,
    inviteUser,
    getNotifications,
    acceptInvitation,
    declineInvitation,
    deleteItineraryItem,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};