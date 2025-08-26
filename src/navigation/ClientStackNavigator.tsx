import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ClientsListScreen } from '../screens/clients/ClientsListScreen';
import { ClientDetailScreen } from '../screens/clients/ClientDetailScreen';

export type ClientStackParamList = {
  ClientsList: undefined;
  ClientDetail: { clientId?: number };
};

const Stack = createStackNavigator<ClientStackParamList>();

export const ClientStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClientsList" component={ClientsListScreen} />
      <Stack.Screen name="ClientDetail" component={ClientDetailScreen} />
    </Stack.Navigator>
  );
};