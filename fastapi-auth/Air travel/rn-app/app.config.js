export default {
  expo: {
    owner: "kingmin",
    slug: "air-travel",
    name: "AIR TRAVEL",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.kingmin.airtravel"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.kingmin.airtravel"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    extra: {
      GOOGLE_EXPO_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
      GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL
    },
    // 터널 모드 강제 설정
    experiments: {
      tsconfigPaths: true
    },
    // 로컬 IP 감지 방지
    scheme: "airtravel",
    // 개발 서버 설정
    developmentClient: {
      silentLaunch: true
    },
    plugins: [
      "expo-router"
    ]
  }
};
