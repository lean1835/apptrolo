import { Tabs } from 'expo-router';
import { HomeIcon, DoorIcon, MoneyIcon, SettingsIcon } from '../../src/assets/Icons';
import { COLORS } from '../../src/styles/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const TabBarIcon = (Icon) => {
    const IconComponent = ({ color, size }) => <Icon color={color} size={22} />;
    IconComponent.displayName = 'TabBarIcon';
    return IconComponent;
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.pr,
        tabBarInactiveTintColor: COLORS.g4,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: COLORS.g5,
          height: 55 + insets.bottom,
          paddingBottom: insets.bottom || 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: TabBarIcon(HomeIcon),
        }}
      />
      <Tabs.Screen
        name="rooms"
        options={{
          title: 'Phòng',
          tabBarIcon: TabBarIcon(DoorIcon),
        }}
      />
      <Tabs.Screen
        name="debt"
        options={{
          title: 'Công nợ',
          tabBarIcon: TabBarIcon(MoneyIcon),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: TabBarIcon(SettingsIcon),
        }}
      />
    </Tabs>
  );
}
