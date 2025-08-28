import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
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
  onEdit?: (client: Client) => void;
  selectedClient?: Client | null;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  isVisible,
  onClose,
  onSelect,
  onEdit,
  selectedClient,
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompanyName, setNewClientCompanyName] = useState('');
  const [newClientContactName, setNewClientContactName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientBillingAddress, setNewClientBillingAddress] = useState('');
  const [newClientTags, setNewClientTags] = useState('');

  useEffect(() => {
    if (isVisible) {
      loadClients();
    }
  }, [isVisible]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(
        client =>
          client.name.toLowerCase().includes(query) ||
          client.company_name?.toLowerCase().includes(query) ||
          client.contact_name?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.includes(searchQuery)
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
      // Failed to load clients
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
        company_name: newClientCompanyName.trim() || undefined,
        contact_name: newClientContactName.trim() || undefined,
        email: newClientEmail.trim() || undefined,
        phone: newClientPhone.trim() || undefined,
        billing_address: newClientBillingAddress.trim() || undefined,
        tags: newClientTags.trim() || undefined,
      });

      const newClient = await ClientModel.getById(clientId);
      
      if (newClient) {
        // Reload clients list to include the new client
        await loadClients();
        onSelect(newClient);
        handleClose();
      } else {
        Alert.alert('Error', 'Failed to retrieve created client');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create client');
    }
  };

  const resetForm = () => {
    setNewClientName('');
    setNewClientCompanyName('');
    setNewClientContactName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientBillingAddress('');
    setNewClientTags('');
    setShowCreateForm(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderClient = ({ item }: { item: Client }) => {
    if (!item || !item.id) {
      return null;
    }
    
    const isSelected = selectedClient?.id === item.id;
    
    return (
      <View style={[styles.clientItem, isSelected && styles.clientItemSelected]}>
        <TouchableOpacity
          style={styles.clientMainInfo}
          onPress={() => {
            onSelect(item);
            handleClose();
          }}
        >
          <View style={styles.clientInfo}>
            <Text style={[styles.clientName, isSelected && { color: Colors.white }]}>{item.name}</Text>
            {item.company_name && (
              <Text style={[styles.clientDetail, isSelected && { color: Colors.white, opacity: 0.9 }]}>{item.company_name}</Text>
            )}
            {item.email && (
              <Text style={[styles.clientDetail, isSelected && { color: Colors.white, opacity: 0.8 }]}>{item.email}</Text>
            )}
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
          )}
        </TouchableOpacity>
        
        {onEdit && (
          <TouchableOpacity
            style={[styles.editButton, isSelected && styles.editButtonSelected]}
            onPress={() => onEdit(item)}
          >
            <Ionicons 
              name="pencil-outline" 
              size={18} 
              color={isSelected ? Colors.white : Colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>
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
          <ScrollView style={styles.createForm} contentContainerStyle={styles.createFormContent}>
            <Text style={styles.formTitle}>Create New Client</Text>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Client Name *"
                value={newClientName}
                onChangeText={setNewClientName}
                placeholderTextColor={Colors.textLight}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Company Name (optional)"
                value={newClientCompanyName}
                onChangeText={setNewClientCompanyName}
                placeholderTextColor={Colors.textLight}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Contact Person (optional)"
                value={newClientContactName}
                onChangeText={setNewClientContactName}
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
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
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Address</Text>
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Billing Address (recommended for invoices)"
                value={newClientBillingAddress}
                onChangeText={setNewClientBillingAddress}
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Additional</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Tags (optional, comma-separated)"
                value={newClientTags}
                onChangeText={setNewClientTags}
                placeholderTextColor={Colors.textLight}
              />
            </View>
            
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
                <Text style={styles.saveButtonText}>Create Client</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    height: '85%',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.white,
    fontWeight: Typography.weights.semibold,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  clientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  clientMainInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  clientItemSelected: {
    backgroundColor: Colors.black,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  clientDetail: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    letterSpacing: -0.1,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  editButtonSelected: {
    borderLeftColor: 'rgba(255, 255, 255, 0.2)',
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
    flex: 1,
  },
  createFormContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  formTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    marginBottom: Spacing.lg,
    letterSpacing: -0.3,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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