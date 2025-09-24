require('dotenv').config();

export default {
  "expo": {
    "name": "rn-app",
    "slug": "rn-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "scheme": "rn-app",
    "web": {
      "bundler": "metro"
    },
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.travelai"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.yourcompany.travelai",
      "edgeToEdgeEnabled": true,
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID": process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
      "EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
    }
  }
};