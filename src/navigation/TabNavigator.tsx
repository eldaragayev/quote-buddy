import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { InvoiceStackNavigator } from './InvoiceStackNavigator';
import { ClientStackNavigator } from './ClientStackNavigator';
import { DashboardStackNavigator } from './DashboardStackNavigator';
import { ToolsScreen } from '../screens/tools/ToolsScreen';
import { Colors, Typography } from '../styles/theme';

export type TabParamList = {
  Invoices: undefined;
  Clients: undefined;
  Tools: undefined;
  Dashboard: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';

          if (route.name === 'Invoices') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'Clients') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Tools') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textLight,
        tabBarLabelStyle: {
          fontSize: Typography.sizes.xs,
          fontWeight: Typography.weights.medium,
        },
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
        },
      })}
    >
      <Tab.Screen name="Invoices" component={InvoiceStackNavigator} />
      <Tab.Screen name="Clients" component={ClientStackNavigator} />
      <Tab.Screen name="Tools" component={ToolsScreen} />
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} />
    </Tab.Navigator>
  );
};