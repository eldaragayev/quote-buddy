import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
import { Client } from '../../types/database';
import { ClientModel } from '../../models/ClientModel';

interface ClientSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
  selectedClient?: Client | null;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  isVisible,
  onClose,
  onSelect,
  selectedClient,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  useEffect(() => {
    if (isVisible) {
      loadClients();
    }
  }, [isVisible]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = clients.filter(
        client =>
          client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          client.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      const data = await ClientModel.getAll();
      setClients(data);
      setFilteredClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    }
  };

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      Alert.alert('Error', 'Please enter a client name');
      return;
    }

    try {
      const clientId = await ClientModel.create({
        name: newClientName.trim(),
        email: newClientEmail.trim() || undefined,
        phone: newClientPhone.trim() || undefined,
      });

      console.log('Created client with ID:', clientId);
      
      const newClient = await ClientModel.getById(clientId);
      console.log('Retrieved client:', newClient);
      
      if (newClient) {
        onSelect(newClient);
        handleClose();
      } else {
        Alert.alert('Error', 'Failed to retrieve created client');
      }
    } catch (error) {
      console.error('Failed to create client:', error);
      Alert.alert('Error', 'Failed to create client');
    }
  };

  const resetForm = () => {
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setShowCreateForm(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderClient = ({ item }: { item: Client }) => {
    if (!item || !item.id) {
      console.warn('Invalid client item:', item);
      return null;
    }
    
    const isSelected = selectedClient?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.clientItem, isSelected && styles.clientItemSelected]}
        onPress={() => {
          onSelect(item);
          handleClose();
        }}
      >
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{item.name}</Text>
          {item.email && (
            <Text style={styles.clientDetail}>{item.email}</Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={handleClose}
      onBackButtonPress={handleClose}
      style={styles.modal}
      avoidKeyboard={Platform.OS === 'ios'}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Select Client</Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {!showCreateForm ? (
          <>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={Colors.textLight} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search clients..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.createButtonText}>Add New Client</Text>
            </TouchableOpacity>

            <FlatList
              data={filteredClients}
              keyExtractor={(item) => item.id ? item.id.toString() : `temp-${Math.random()}`}
              renderItem={renderClient}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No clients found' : 'No clients yet'}
                  </Text>
                </View>
              }
              contentContainerStyle={styles.listContent}
            />
          </>
        ) : (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Create New Client</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Client Name *"
              value={newClientName}
              onChangeText={setNewClientName}
              placeholderTextColor={Colors.textLight}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email (optional)"
              value={newClientEmail}
              onChangeText={setNewClientEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.textLight}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone (optional)"
              value={newClientPhone}
              onChangeText={setNewClientPhone}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textLight}
            />
            
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={() => setShowCreateForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.formButton, styles.saveButton]}
                onPress={handleCreateClient}
              >
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: '90%',
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  createButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  clientItemSelected: {
    backgroundColor: Colors.backgroundSecondary,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  clientDetail: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  emptyState: {
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  createForm: {
    padding: Spacing.lg,
  },
  formTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  formButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  formButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundTertiary,
  },
  cancelButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
});