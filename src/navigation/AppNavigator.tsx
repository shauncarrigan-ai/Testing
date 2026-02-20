import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import TodayScreen from '../screens/TodayScreen';
import CalendarScreen from '../screens/CalendarScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import TemplateEditScreen from '../screens/TemplateEditScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { useTheme } from '../hooks/useTheme';
import { MainTabParamList, RootStackParamList } from '../types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

// ─── Custom tab bar with separators ──────────────────────────────────────────

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        tabStyles.container,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          paddingBottom: insets.bottom || 8,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isLast = index === state.routes.length - 1;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const color = isFocused ? colors.accent : colors.textTertiary;
        const label = (options.tabBarLabel ?? options.title ?? route.name) as string;
        const icon = options.tabBarIcon?.({ focused: isFocused, color, size: 22 });

        return (
          <React.Fragment key={route.key}>
            <TouchableOpacity
              onPress={onPress}
              style={tabStyles.tab}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              {icon}
              <Text style={[tabStyles.label, { color }]}>{label}</Text>
            </TouchableOpacity>
            {!isLast && (
              <View
                style={[tabStyles.separator, { backgroundColor: colors.tabBarBorder }]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
  separator: {
    width: StyleSheet.hairlineWidth,
    marginVertical: 6,
  },
});

// ─── Main Tabs ────────────────────────────────────────────────────────────────

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>☀</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🗓</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Templates"
        component={TemplatesScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📋</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📁</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>⚙</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// ─── Root Stack ───────────────────────────────────────────────────────────────

const AppNavigator: React.FC = () => {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="TemplateEdit" component={TemplateEditScreen} />
        <Stack.Screen name="ProjectDetail" component={ProjectDetailScreen} />
        <Stack.Screen name="Stats" component={StatsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
