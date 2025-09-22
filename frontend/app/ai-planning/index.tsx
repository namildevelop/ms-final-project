import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';

const AIPlanningPage: React.FC = () => {
  const router = useRouter();
  const { tripId } = useLocalSearchParams();
  const { token } = useAuth();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 로딩 애니메이션 시작
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    ).start();

    if (!tripId || !token) {
      Alert.alert("오류", "여행 정보를 불러올 수 없습니다.");
      router.replace('/main');
      return;
    }

    const wsUrl = `ws://0.0.0.0:8000/v1/trips/${tripId}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('AI Planning WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      if (messageData.type === 'plan_update' || messageData.type === 'initial_plan_ready') {
        console.log('Plan update received, navigating to itinerary.');
        router.replace(`/trip-itinerary/${tripId}`);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      Alert.alert("오류", "연결 중 문제가 발생했습니다.");
      router.replace('/main');
    };

    ws.onclose = () => {
      console.log('AI Planning WebSocket Disconnected');
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      ws.close();
    };
  }, [router, animatedValue, tripId, token]);

  const rotateAnimation = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text>
        </View>
        <Text style={styles.title}>여행 계획 만들기</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
        <View style={styles.loadingContainer}>
          {/* 로딩 애니메이션 */}
          <Animated.View 
            style={[
              styles.loadingCircle,
              {
                transform: [{ rotate: rotateAnimation }],
              }
            ]}
          >
            <View style={styles.circleInner} />
          </Animated.View>
          
          {/* 로딩 텍스트 */}
          <Text style={styles.loadingText}>일정을 만들고 있습니다...</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#4a5568',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a202c',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#3182ce',
    borderTopColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  circleInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3182ce',
  },
  loadingText: {
    fontSize: 18,
    color: '#1a202c',
    fontWeight: '500',
  },
});

export default AIPlanningPage;
