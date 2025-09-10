// AI 여행 계획 생성 페이지 (로딩 애니메이션)
import React, { useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { styles } from './styles';

const AIPlanningPage: React.FC = () => {
  const router = useRouter();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 로딩 애니메이션 시작
    const startAnimation = () => {
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
    };

    startAnimation();

    // 2초 후 여행 계획표 페이지로 이동
    const timer = setTimeout(() => {
      router.replace('/trip-itinerary');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, animatedValue]);

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

// styles moved to styles.ts

export default AIPlanningPage;

