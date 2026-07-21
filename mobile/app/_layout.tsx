// @ts-nocheck
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, Platform, LogBox, AppState, Text } from 'react-native';
import { COLORS } from '../src/styles/Theme';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { fetchAndSaveDynamicApiUrl } from '../src/services/api';

LogBox.ignoreLogs([
  'expo-notifications',
  'expo-media-library',
  'Missing Expo Project ID',
]);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppLayout() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Skip remote notifications setup if running in Expo Go (removed in SDK 53)
    if (Constants.appOwnership === 'expo') {
      console.log('Bypassing remote push notification setup in Expo Go');
      return;
    }

    async function registerForPushNotificationsAsync() {
      let token;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          Alert.alert('Lỗi', 'Không thể xin quyền gửi thông báo!');
          return;
        }
        try {
          const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
          if (!projectId) {
            console.warn('Missing Expo Project ID (EAS). Push notifications will not work. Run "eas project:init" to configure push notifications.');
          } else {
            token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            console.log('Expo Push Token:', token);
          }
        } catch (e) {
          token = `${e}`;
          console.error('Lỗi lấy token:', token);
        }
      } else {
        console.log('Must use physical device for Push Notifications');
      }

      return token;
    }

    registerForPushNotificationsAsync();

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Nhận được thông báo:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Click vào thông báo:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.pr} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function Root() {
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  useEffect(() => {
    // Chờ cấu hình cập nhật xong trước khi tải giao diện chính của ứng dụng
    fetchAndSaveDynamicApiUrl().finally(() => {
      setIsConfigLoaded(true);
    });

    // Lắng nghe sự kiện chuyển đổi trạng thái của app (Background -> Foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('App returned to active foreground, fetching latest API config...');
        fetchAndSaveDynamicApiUrl();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (!isConfigLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.pr} />
        <Text style={{ marginTop: 12, color: COLORS.g1, fontWeight: '600' }}>
          Đang cập nhật cấu hình...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
