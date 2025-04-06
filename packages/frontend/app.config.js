// Dynamic app configuration for Expo
import 'dotenv/config';

export default {
  expo: {
    name: "GifticApp",
    slug: "gifticapp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      jsEngine: "hermes"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      jsEngine: "hermes"
    },
    web: {
      favicon: "./assets/images/favicon.png",
      bundler: "metro"
    },
    experiments: {
      tsconfigPaths: true,
      typedRoutes: true
    },
    plugins: [
      "expo-router"
    ],
    scheme: "gifticapp",
    extra: {
      // Add environment variables here
      API_URL: process.env.API_URL || "http://localhost:3000",
      API_BASE_URL: process.env.API_BASE_URL || "http://localhost:3000",
      NODE_ENV: process.env.NODE_ENV || "development",
      router: {
        origin: false
      },
      eas: {
        projectId: "your-project-id"
      }
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: ""
    },
    jsEngine: "hermes",
    runtimeVersion: {
      policy: "sdkVersion"
    },
    newArchEnabled: true
  }
}; 