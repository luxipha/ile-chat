# Setting up Expo Development Build for LiveKit

Since LiveKit requires native modules, you need to create an Expo Development Build.

## Steps to Create Development Build:

### 1. Install EAS CLI
```bash
npm install -g @expo/eas-cli
eas login
```

### 2. Configure EAS Build
```bash
eas build:configure
```

### 3. Update app.json/app.config.js
Add the following plugins to your app configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "deploymentTarget": "13.0"
          },
          "android": {
            "compileSdkVersion": 33,
            "targetSdkVersion": 33,
            "minSdkVersion": 21
          }
        }
      ]
    ]
  }
}
```

### 4. Create Development Build
```bash
# For iOS (if you have Apple Developer account)
eas build --profile development --platform ios

# For Android
eas build --profile development --platform android
```

### 5. Install and Run
- Download the built app from the EAS dashboard
- Install it on your device
- Run: `expo start --dev-client`

## Alternative: Use Expo Dev Client Locally

### 1. Install expo-dev-client
```bash
npx expo install expo-dev-client
```

### 2. Create local development build
```bash
# For iOS (requires Xcode and iOS Simulator)
npx expo run:ios

# For Android (requires Android Studio)
npx expo run:android
```

This will create a development build with native modules support.