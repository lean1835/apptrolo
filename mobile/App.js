import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { COLORS } from './src/styles/Theme';
import { HomeIcon, DoorIcon, MoneyIcon, SettingsIcon } from './src/assets/Icons';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
// Mock screens for 이제
import HomeScreen from './src/screens/HomeScreen';
import RoomsScreen from './src/screens/RoomsScreen';
import DebtScreen from './src/screens/DebtScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabBarIcon = (Icon) => ({ color, size }) => (
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
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            {/* Add more screens here later like RoomDetail, etc. */}
          </>
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
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
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
