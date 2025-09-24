import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = 'https://9762f7f3e9b1.ngrok-free.app'; // ngrok URL

// --- Interfaces ---

export interface User {
  id: number;
  email: string;
  nickname: string;
  phone?: string;
  gender?: string;
  birth_date?: string;
  address?: string;
  mbti?: string;
  profile_image_url?: string;
  profile_completed?: boolean;
}

export interface Diary {
  id: number;
  title: string;
  content: string;
  date: string; // Assuming date is a string in ISO format
  photo_path?: string;
  ai_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PackingListItem {
  id: number;
  trip_id: number;
  item_name: string;
  quantity: number;
  is_packed: boolean;
}

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

export interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface PlaceDetails {
  name: string;
  photo_url?: string;
  address?: string;
  opening_hours?: string[];
  phone_number?: string;
  website?: string;
}

export interface TripItineraryItem {
    id: number;
    trip_id: number;
    day: number;
    order_in_day: number;
    place_name: string;
    description?: string;
    start_time?: string;
    end_time?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    gpt_description?: string | null;
}

interface AuthState {
  token: string | null;
  authenticated: boolean;
  user: User | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signup: (userData: any) => Promise<any>;
  verifySignupCode: (email: string, code: string) => Promise<User>;
  resendVerificationCode: (email: string) => Promise<boolean>;
  createTrip: (tripData: any) => Promise<any | null>;
  getTrips: () => Promise<any[]>;
  getTripDetails: (tripId: string) => Promise<any | null>;
  searchUsers: (email: string) => Promise<SearchResultUser[]>;
  inviteUser: (tripId: string, userId: number) => Promise<boolean>;
  getNotifications: () => Promise<Notification[]>;
  acceptInvitation: (notificationId: number) => Promise<boolean>;
  declineInvitation: (notificationId: number) => Promise<boolean>;
  deleteItineraryItem: (tripId: string, itemId: number) => Promise<boolean>;
  updateItineraryOrder: (tripId: string, items: { id: number; day: number; order_in_day: number }[]) => Promise<boolean>;
  searchPlaces: (query: string) => Promise<Place[]>;
  createItineraryItem: (tripId: string, itemData: any) => Promise<boolean>;
  getPlaceDetailsByName: (placeName: string) => Promise<PlaceDetails | null>;
  generateGptDescription: (tripId: string, itemId: number) => Promise<TripItineraryItem | null>;
  leaveTrip: (tripId: string) => Promise<boolean>;
  updateProfile: (profileData: Partial<User>, imageUri?: string) => Promise<boolean>;
  // Packing List
  getPackingList: (tripId: string) => Promise<PackingListItem[]>;
  addPackingListItem: (tripId: string, itemData: { item_name: string; quantity: number }) => Promise<PackingListItem | null>;
  updatePackingListItem: (tripId: string, itemId: number, itemData: Partial<PackingListItem>) => Promise<PackingListItem | null>;
  deletePackingListItem: (tripId: string, itemId: number) => Promise<boolean>;
  togglePackingListItem: (tripId: string, itemId: number) => Promise<PackingListItem | null>;
  // Diary
  getDiaries: () => Promise<Diary[]>;
  createDiary: (diaryData: FormData) => Promise<Diary | null>;
  deleteDiary: (diaryId: number) => Promise<boolean>;
  generateDiaryImage: (title: string, content: string) => Promise<{ image_url: string } | null>;
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
          const userResponse = await axios.get(`${API_URL}/v1/auth/me`);
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
      const response = await axios.post(`${API_URL}/v1/auth/login`, { email, password });
      const { access_token, user } = response.data;
      await AsyncStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setAuthState({ token: access_token, authenticated: true, user: user, loading: false });
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const loginWithGoogle = async (idToken: string) => {
    try {
      const response = await axios.post(`${API_URL}/v1/auth/google/verify`, { id_token: idToken });
      const { access_token, user } = response.data;
      await AsyncStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setAuthState({ token: access_token, authenticated: true, user: user, loading: false });
      return true;
    } catch (error) {
      console.error('Google Login failed:', error);
      return false;
    }
  };

  const signup = async (userData: any) => {
    try {
      console.log('API_URL:', API_URL);
      console.log('Full URL:', `${API_URL}/v1/auth/signup`);
      console.log('UserData:', userData);
      const response = await axios.post(`${API_URL}/v1/auth/signup`, userData);
      return response.data;
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const verifySignupCode = async (email: string, code: string): Promise<User> => {
    try {
      const response = await axios.post(`${API_URL}/v1/auth/verify-code`, { email, code });
      const { access_token, user } = response.data;
      await AsyncStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setAuthState({ token: access_token, authenticated: true, user: user, loading: false });
      return user;
    } catch (error) {
      console.error('Signup verification failed:', error);
      throw error;
    }
  };

  const resendVerificationCode = async (email: string) => {
    try {
      await axios.post(`${API_URL}/v1/auth/resend-verification`, { email });
      return true;
    } catch (error) {
      console.error('Resend verification code failed:', error);
      throw error;
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

  const updateItineraryOrder = async (tripId: string, items: { id: number; day: number; order_in_day: number }[]): Promise<boolean> => {
    try {
      await axios.put(`${API_URL}/v1/trips/${tripId}/itinerary/order`, { items });
      return true;
    } catch (error) {
      console.error('Failed to update itinerary order:', error);
      return false;
    }
  };

  const searchPlaces = async (query: string): Promise<Place[]> => {
    try {
      const response = await axios.get(`${API_URL}/v1/google-maps/search?query=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search places:', error);
      return [];
    }
  };

  const createItineraryItem = async (tripId: string, itemData: any): Promise<boolean> => {
    try {
      await axios.post(`${API_URL}/v1/trips/${tripId}/itinerary-items/`, itemData);
      return true;
    } catch (error) {
      console.error('Failed to create itinerary item:', error);
      return false;
    }
  };

  const getPlaceDetailsByName = async (placeName: string): Promise<PlaceDetails | null> => {
    try {
      const response = await axios.get(`${API_URL}/v1/google-maps/place-details-by-name?query=${encodeURIComponent(placeName)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch place details:', error);
      return null;
    }
  };

  const generateGptDescription = async (tripId: string, itemId: number): Promise<TripItineraryItem | null> => {
    try {
      const response = await axios.post(`${API_URL}/v1/trips/${tripId}/itinerary-items/${itemId}/generate-description`);
      return response.data;
    } catch (error) {
      console.error('Failed to generate GPT description:', error);
      return null;
    }
  };

  const leaveTrip = async (tripId: string): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/v1/trips/${tripId}/members/me`);
      return true;
    } catch (error) {
      console.error('Failed to leave trip:', error);
      return false;
    }
  };

  const updateProfile = async (profileData: Partial<User>, imageUri?: string) => {
    try {
      let response;
      if (imageUri) {
        const formData = new FormData();
        // Append other profile data fields
        for (const key in profileData) {
          if (Object.prototype.hasOwnProperty.call(profileData, key)) {
            const value = profileData[key as keyof Partial<User>];
            if (value !== undefined) {
              formData.append(key, value as string | Blob);
            }
          }
        }
        // Append the image file
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        formData.append('profile_image', {
          uri: imageUri,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        } as any); // 'as any' is used here to bypass TypeScript's strict type checking for FormData append

        response = await axios.post(`${API_URL}/v1/users/me/profile-image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await axios.put(`${API_URL}/v1/users/me`, profileData);
      }

      setAuthState(prevState => ({
        ...prevState,
        user: response.data,
      }));
      return true;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return false;
    }
  };

  // Packing List Functions
  const getPackingList = async (tripId: string): Promise<PackingListItem[]> => {
    try {
      const response = await axios.get(`${API_URL}/v1/trips/${tripId}/packing-items`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch packing list:', error);
      return [];
    }
  };

  const addPackingListItem = async (tripId: string, itemData: { item_name: string; quantity: number }): Promise<PackingListItem | null> => {
    try {
      const response = await axios.post(`${API_URL}/v1/trips/${tripId}/packing-items`, itemData);
      return response.data;
    } catch (error) {
      console.error('Failed to add packing list item:', error);
      return null;
    }
  };

  const updatePackingListItem = async (tripId: string, itemId: number, itemData: Partial<PackingListItem>): Promise<PackingListItem | null> => {
    try {
      const response = await axios.put(`${API_URL}/v1/trips/${tripId}/packing-items/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      console.error('Failed to update packing list item:', error);
      return null;
    }
  };

  const deletePackingListItem = async (tripId: string, itemId: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/v1/trips/${tripId}/packing-items/${itemId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete packing list item:', error);
      return false;
    }
  };

  const togglePackingListItem = async (tripId: string, itemId: number): Promise<PackingListItem | null> => {
    try {
      const response = await axios.patch(`${API_URL}/v1/trips/${tripId}/packing-items/${itemId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Failed to toggle packing list item:', error);
      return null;
    }
  };

  // Diary Functions
  const getDiaries = async (): Promise<Diary[]> => {
    try {
      const response = await axios.get(`${API_URL}/v1/diaries`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch diaries:', error);
      return [];
    }
  };

  const createDiary = async (diaryData: FormData): Promise<Diary | null> => {
    try {
      const response = await axios.post(`${API_URL}/v1/diaries`, diaryData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create diary:', error);
      return null;
    }
  };

  const deleteDiary = async (diaryId: number): Promise<boolean> => {
    try {
      await axios.delete(`${API_URL}/v1/diaries/${diaryId}`);
      return true;
    } catch (error) {
      console.error('Failed to delete diary:', error);
      return false;
    }
  };

  const generateDiaryImage = async (title: string, content: string): Promise<{ image_url: string } | null> => {
    try {
      const response = await axios.post(`${API_URL}/v1/diaries/generate-image`, { title, content });
      return response.data;
    } catch (error) {
      console.error('Failed to generate diary image:', error);
      return null;
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
    loginWithGoogle,
    logout,
    signup,
    verifySignupCode,
    resendVerificationCode,
    createTrip,
    getTrips,
    getTripDetails,
    searchUsers,
    inviteUser,
    getNotifications,
    acceptInvitation,
    declineInvitation,
    deleteItineraryItem,
    updateItineraryOrder,
    searchPlaces,
    createItineraryItem,
    getPlaceDetailsByName,
    generateGptDescription,
    leaveTrip,
    updateProfile,
    // Packing List
    getPackingList,
    addPackingListItem,
    updatePackingListItem,
    deletePackingListItem,
    togglePackingListItem,
    // Diary
    getDiaries,
    createDiary,
    deleteDiary,
    generateDiaryImage,
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
