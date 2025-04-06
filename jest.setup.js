import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  Link: 'Link',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock Settings module directly
jest.mock('react-native/Libraries/Settings/Settings', () => ({
  get: jest.fn(),
  set: jest.fn(),
  watchKeys: jest.fn(),
  clearWatch: jest.fn(),
}));

// Mock NativeSettingsManager
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({
  getConstants: () => ({
    settings: {
      AppleLocale: 'en_US',
      AppleLanguages: ['en'],
    },
  }),
}));

// Mock React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
    },
    Platform: {
      ...RN.Platform,
      OS: 'ios',
      select: jest.fn((x) => x.ios),
    },
    NativeModules: {
      ...RN.NativeModules,
      DevSettings: {
        addListener: jest.fn(),
        removeListeners: jest.fn(),
      },
    },
    NativeEventEmitter: class {
      constructor() {
        this.addListener = jest.fn();
        this.removeListeners = jest.fn();
      }
    },
    // Mock deprecated components
    ProgressBarAndroid: jest.fn(),
    Clipboard: {
      getString: jest.fn(),
      setString: jest.fn(),
    },
    PushNotificationIOS: {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      requestPermissions: jest.fn(),
    },
  };
});
