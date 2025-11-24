import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tehnoprokat.app',
  appName: 'Водовозка',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: [
      'https://api-maps.yandex.ru',
      'https://suggest-maps.yandex.ru',
      'https://*.supabase.co'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: '#3b82f6',
      showSpinner: false
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
