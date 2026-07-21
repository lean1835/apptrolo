// @ts-nocheck
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, AppState, AppStateStatus } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { COLORS } from './src/styles/Theme';
import { HomeIcon, DoorIcon, MoneyIcon, SettingsIcon } from './src/assets/Icons';
import { fetchAndSaveDynamicApiUrl } from './src/services/api';

// New Modular Screens
import LoginScreen from './src/modules/auth/screens/LoginScreen';
import RegisterScreen from './src/modules/auth/screens/RegisterScreen';
import HomeScreen from './src/modules/home/screens/HomeScreen';
import RoomsScreen from './src/modules/room/screens/RoomsScreen';
import DebtScreen from './src/modules/bill/screens/DebtScreen';
import SettingsScreen from './src/modules/settings/screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabBarIcon = (Icon: any) => ({ color }: { color: string; size: number }) => (
  <Icon color={color} size={22} />
);

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.pr,
      tabBarInactiveTintColor: COLORS.g4,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopWidth: 1,
        borderTopColor: COLORS.g5,
        height: 65,
        paddingBottom: 20,
        paddingTop: 6,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '700',
      },
    }}
  >
    <Tab.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{ 
        tabBarLabel: 'Trang chủ',
        tabBarIcon: TabBarIcon(HomeIcon),
      }} 
    />
    <Tab.Screen 
      name="Rooms" 
      component={RoomsScreen} 
      options={{ 
        tabBarLabel: 'Phòng',
        tabBarIcon: TabBarIcon(DoorIcon),
      }} 
    />
    <Tab.Screen 
      name="Debt" 
      component={DebtScreen} 
      options={{ 
        tabBarLabel: 'Công nợ',
        tabBarIcon: TabBarIcon(MoneyIcon),
      }} 
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen} 
      options={{ 
        tabBarLabel: 'Cài đặt',
        tabBarIcon: TabBarIcon(SettingsIcon),
      }} 
    />
  </Tab.Navigator>
);

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) return <View style={styles.loading}><Text>Đang tải...</Text></View>;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
};

export default function App() {
  useEffect(() => {
    // Tải cấu hình ngầm khi khởi chạy ứng dụng (không chặn giao diện)
    fetchAndSaveDynamicApiUrl();

    // Lắng nghe sự kiện chuyển đổi trạng thái của app (Background -> Foreground)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App returned to active foreground, fetching latest API config...');
        fetchAndSaveDynamicApiUrl();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
  },
});
