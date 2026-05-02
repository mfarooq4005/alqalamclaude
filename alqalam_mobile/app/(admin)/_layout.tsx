// ═══════════════════════════════════════════════════════
//  Admin Portal Layout — Bottom Tab Navigator
//  Roles: admin, super_admin, principal, accountant,
//         hr_manager, librarian, transport_manager,
//         exam_controller, receptionist
// ═══════════════════════════════════════════════════════

import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { Platform, TouchableOpacity, Text, View } from 'react-native';
import { Colors } from '../../src/theme';
import { useAuthStore } from '../../src/store/auth';
import { router } from 'expo-router';

function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <FontAwesome5 name={name} size={focused ? 18 : 16} color={color} solid={focused} />
    </View>
  );
}

export default function AdminLayout() {
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
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <TabIcon name="th-large" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ color, focused }) => <TabIcon name="user-graduate" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, focused }) => <TabIcon name="clipboard-check" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="fee"
        options={{
          title: 'Fee',
          tabBarIcon: ({ color, focused }) => <TabIcon name="money-bill-wave" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => <TabIcon name="ellipsis-h" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
