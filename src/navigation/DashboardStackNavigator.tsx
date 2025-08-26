import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { TaxSettingsScreen } from '../screens/settings/TaxSettingsScreen';
import { IssuerSettingsScreen } from '../screens/settings/IssuerSettingsScreen';

export type DashboardStackParamList = {
  DashboardMain: undefined;
  Settings: undefined;
  TaxSettings: undefined;
  IssuerSettings: undefined;
};

const Stack = createStackNavigator<DashboardStackParamList>();

export const DashboardStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardMain" component={DashboardScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="TaxSettings" component={TaxSettingsScreen} />
      <Stack.Screen name="IssuerSettings" component={IssuerSettingsScreen} />
    </Stack.Navigator>
  );
};