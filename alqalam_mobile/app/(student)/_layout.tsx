// ═══════════════════════════════════════════════════════
//  Student Portal Layout — Bottom Tab Navigator
// ═══════════════════════════════════════════════════════

import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Platform, View } from 'react-native';
import { Colors } from '../../src/theme';

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <FontAwesome5 name={name} size={focused ? 18 : 16} color={color} solid={focused} />
    </View>
  );
}

export default function StudentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161b22',
          borderTopColor: '#30363d',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.purple,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}>

      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={color} focused={focused} />,
      }} />
      <Tabs.Screen name="attendance" options={{
        title: 'Attendance',
        tabBarIcon: ({ color, focused }) => <TabIcon name="clipboard-check" color={color} focused={focused} />,
      }} />
      <Tabs.Screen name="results" options={{
        title: 'Results',
        tabBarIcon: ({ color, focused }) => <TabIcon name="chart-bar" color={color} focused={focused} />,
      }} />
      <Tabs.Screen name="fee" options={{
        title: 'Fee',
        tabBarIcon: ({ color, focused }) => <TabIcon name="receipt" color={color} focused={focused} />,
      }} />
      <Tabs.Screen name="timetable" options={{
        title: 'Timetable',
        tabBarIcon: ({ color, focused }) => <TabIcon name="calendar-alt" color={color} focused={focused} />,
      }} />
    </Tabs>
  );
}
