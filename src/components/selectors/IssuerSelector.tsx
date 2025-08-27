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
  ScrollView,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
import { Issuer } from '../../types/database';
import { IssuerModel } from '../../models/IssuerModel';

interface IssuerSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (issuer: Issuer) => void;
  selectedIssuer?: Issuer | null;
}

export const IssuerSelector: React.FC<IssuerSelectorProps> = ({
  isVisible,
  onClose,
  onSelect,
  selectedIssuer,
}) => {
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingIssuer, setEditingIssuer] = useState<Issuer | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (isVisible) {
      loadIssuers();
    }
  }, [isVisible]);

  useEffect(() => {
    if (editingIssuer) {
      setCompanyName(editingIssuer.company_name || '');
      setContactName(editingIssuer.contact_name || '');
      setEmail(editingIssuer.email || '');
      setPhone(editingIssuer.phone || '');
      setAddress(editingIssuer.address || '');
      setShowCreateForm(true);
    }
  }, [editingIssuer]);

  const loadIssuers = async () => {
    try {
      const data = await IssuerModel.getAll();
      setIssuers(data);
    } catch (error) {
      console.error('Failed to load issuers:', error);
    }
  };

  const handleSaveIssuer = async () => {
    if (!companyName.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }

    try {
      if (editingIssuer?.id) {
        await IssuerModel.update(editingIssuer.id, {
          company_name: companyName.trim(),
          contact_name: contactName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        });
      } else {
        const issuerId = await IssuerModel.create({
          company_name: companyName.trim(),
          contact_name: contactName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          is_default: issuers.length === 0 ? 1 : 0,
        });
        
        const newIssuer = await IssuerModel.getById(issuerId);
        if (newIssuer) {
          onSelect(newIssuer);
          handleClose();
          return;
        }
      }
      
      await loadIssuers();
      resetForm();
    } catch (error) {
      console.error('Failed to save issuer:', error);
      Alert.alert('Error', 'Failed to save issuer');
    }
  };

  const handleSetDefault = async (issuer: Issuer) => {
    if (issuer.id) {
      try {
        await IssuerModel.setDefault(issuer.id);
        await loadIssuers();
      } catch (error) {
        Alert.alert('Error', 'Failed to set default issuer');
      }
    }
  };

  const handleDeleteIssuer = async (issuer: Issuer) => {
    if (issuer.is_default) {
      Alert.alert('Error', 'Cannot delete default issuer');
      return;
    }

    Alert.alert(
      'Delete Issuer',
      `Are you sure you want to delete "${issuer.company_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (issuer.id) {
              try {
                await IssuerModel.delete(issuer.id);
                await loadIssuers();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete issuer');
              }
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setShowCreateForm(false);
    setEditingIssuer(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const renderIssuer = ({ item }: { item: Issuer }) => {
    const isSelected = selectedIssuer?.id === item.id;
    
    return (
      <View style={styles.issuerCard}>
        <TouchableOpacity
          style={[styles.issuerItem, isSelected && styles.issuerItemSelected]}
          onPress={() => {
            onSelect(item);
            handleClose();
          }}
        >
          <View style={styles.issuerContent}>
            <View style={styles.issuerInfo}>
              <View style={styles.issuerHeader}>
                <Text style={[styles.issuerName, isSelected && { color: Colors.white }]}>
                  {item.company_name}
                </Text>
                {item.is_default === 1 && (
                  <View style={[styles.defaultBadge, isSelected && { backgroundColor: Colors.white }]}>
                    <Text style={[styles.defaultText, isSelected && { color: Colors.black }]}>DEFAULT</Text>
                  </View>
                )}
              </View>
              {item.contact_name && (
                <Text style={[styles.issuerDetail, isSelected && { color: Colors.white, opacity: 0.9 }]}>
                  {item.contact_name}
                </Text>
              )}
              {item.email && (
                <Text style={[styles.issuerDetail, isSelected && { color: Colors.white, opacity: 0.9 }]}>
                  {item.email}
                </Text>
              )}
              {item.address && (
                <Text style={[styles.issuerDetail, isSelected && { color: Colors.white, opacity: 0.9 }]} numberOfLines={1}>
                  {item.address}
                </Text>
              )}
            </View>
            
            <View style={styles.issuerRight}>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color={Colors.white} />
              )}
            </View>
          </View>
        </TouchableOpacity>
        
        <View style={styles.issuerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setEditingIssuer(item)}
          >
            <Ionicons name="create-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          
          {item.is_default === 0 && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleSetDefault(item)}
              >
                <Ionicons name="star-outline" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteIssuer(item)}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
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
          <Text style={styles.title}>
            {showCreateForm 
              ? (editingIssuer ? 'Edit Issuer' : 'Create Issuer')
              : 'Select Issuer'}
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {!showCreateForm ? (
          <>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
              <Text style={styles.createButtonText}>Add New Issuer</Text>
            </TouchableOpacity>

            <FlatList
              data={issuers}
              keyExtractor={(item) => item.id?.toString() || ''}
              renderItem={renderIssuer}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No issuers yet</Text>
                </View>
              }
              contentContainerStyle={styles.listContent}
            />
          </>
        ) : (
          <ScrollView style={styles.createForm}>
            <TextInput
              style={styles.input}
              placeholder="Company Name *"
              value={companyName}
              onChangeText={setCompanyName}
              placeholderTextColor={Colors.textLight}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Contact Name (optional)"
              value={contactName}
              onChangeText={setContactName}
              placeholderTextColor={Colors.textLight}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Email (optional)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.textLight}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textLight}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Address (optional)"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              placeholderTextColor={Colors.textLight}
            />
            
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={resetForm}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.formButton, styles.saveButton]}
                onPress={handleSaveIssuer}
              >
                <Text style={styles.saveButtonText}>
                  {editingIssuer ? 'Update' : 'Create'}
                </Text>
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
    height: '75%',
    maxHeight: '75%',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
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
    paddingTop: Spacing.sm,
  },
  issuerCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  issuerItem: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  issuerItemSelected: {
    backgroundColor: Colors.black,
  },
  issuerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  issuerInfo: {
    flex: 1,
  },
  issuerRight: {
    marginLeft: Spacing.md,
  },
  issuerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  issuerName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  defaultBadge: {
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    letterSpacing: 0.3,
  },
  issuerDetail: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  issuerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
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
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
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
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.black,
  },
  saveButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
});