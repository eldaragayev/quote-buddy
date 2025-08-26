import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeDatabase } from './src/database/database';
import { initializeDefaultData, isFirstRun } from './src/database/initialData';
import { TabNavigator } from './src/navigation/TabNavigator';
import { Colors, Typography } from './src/styles/theme';

export default function App() {
  const [dbInitialized, setDbInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Step 1: Initialize database schema
        initializeDatabase();
        
        // Step 2: Check if this is first run and initialize default data
        const firstRun = await isFirstRun();
        if (firstRun) {
          console.log('First run detected, initializing default data...');
          await initializeDefaultData();
        } else {
          console.log('Existing installation detected, skipping default data');
        }
        
        setDbInitialized(true);
      } catch (err) {
        console.error('App initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    initApp();
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Database Error: {error}</Text>
      </View>
    );
  }

  if (!dbInitialized) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Initializing...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <TabNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  error: {
    fontSize: Typography.sizes.base,
    color: Colors.danger,
  },
});