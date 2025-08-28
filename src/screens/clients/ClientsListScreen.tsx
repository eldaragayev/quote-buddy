import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  RefreshControl, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
import { SearchBar } from '../../components/common/SearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { ClientCard } from '../../components/client/ClientCard';
import { ClientModel } from '../../models/ClientModel';
import { Client } from '../../types/database';

type ClientStackParamList = {
  ClientsList: undefined;
  ClientDetail: { clientId?: number };
};

type NavigationProp = StackNavigationProp<ClientStackParamList, 'ClientsList'>;

export const ClientsListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadClients = useCallback(async () => {
    try {
      const data = await ClientModel.getAll();
      setClients(data);
    } catch (error) {
      // Failed to load clients
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [loadClients])
  );

  useEffect(() => {
    let filtered = [...clients];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(query) ||
        client.company_name?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query)
      );
    }
    
    setFilteredClients(filtered);
  }, [clients, searchQuery]);

  const handleCreateClient = () => {
    navigation.navigate('ClientDetail', {});
  };

  const handleClientPress = (client: Client) => {
    navigation.navigate('ClientDetail', { clientId: client.id });
  };

  const handleDeleteClient = async (client: Client) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (client.id) {
                await ClientModel.delete(client.id);
                loadClients();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete client');
            }
          }
        }
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  const renderHeader = () => (
    <SearchBar
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Search clients..."
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Clients</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <Text style={styles.count}>{filteredClients.length}</Text>
      </View>

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id?.toString() || ''}
        renderItem={({ item }) => (
          <ClientCard
            client={item}
            onPress={() => handleClientPress(item)}
            onDelete={() => handleDeleteClient(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No clients yet"
            subtitle="Add your first client to get started"
            actionLabel="Add Client"
            onAction={handleCreateClient}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={filteredClients.length === 0 && styles.emptyContainer}
      />

      {clients.length > 0 && (
        <FloatingActionButton
          onPress={handleCreateClient}
          label="Add Client"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  count: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});