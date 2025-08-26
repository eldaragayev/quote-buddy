import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
import { IssuerModel } from '../../models/IssuerModel';
import { Issuer } from '../../types/database';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { EmptyState } from '../../components/common/EmptyState';

export const IssuerSettingsScreen = () => {
  const navigation = useNavigation();
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIssuer, setEditingIssuer] = useState<Issuer | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadIssuers = useCallback(async () => {
    try {
      const data = await IssuerModel.getAll();
      setIssuers(data);
    } catch (error) {
      console.error('Failed to load issuers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadIssuers();
    }, [loadIssuers])
  );

  const handleAddIssuer = () => {
    setEditingIssuer(null);
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsDefault(issuers.length === 0);
    setShowAddModal(true);
  };

  const handleEditIssuer = (issuer: Issuer) => {
    setEditingIssuer(issuer);
    setCompanyName(issuer.company_name || '');
    setContactName(issuer.contact_name || '');
    setEmail(issuer.email || '');
    setPhone(issuer.phone || '');
    setAddress(issuer.address || '');
    setIsDefault(issuer.is_default === 1);
    setShowAddModal(true);
  };

  const handleSaveIssuer = async () => {
    if (!companyName.trim()) {
      Alert.alert('Error', 'Please enter a company name');
      return;
    }

    try {
      const issuerData: Omit<Issuer, 'id'> = {
        company_name: companyName.trim(),
        contact_name: contactName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        is_default: isDefault ? 1 : 0,
      };

      if (editingIssuer?.id) {
        await IssuerModel.update(editingIssuer.id, issuerData);
      } else {
        await IssuerModel.create(issuerData);
      }
      
      setShowAddModal(false);
      loadIssuers();
    } catch (error) {
      Alert.alert('Error', 'Failed to save issuer');
    }
  };

  const handleDeleteIssuer = (issuer: Issuer) => {
    if (issuer.is_default === 1) {
      Alert.alert('Error', 'Cannot delete the default issuer');
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
                loadIssuers();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete issuer');
              }
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (issuer: Issuer) => {
    if (issuer.id && issuer.is_default !== 1) {
      try {
        await IssuerModel.setDefault(issuer.id);
        loadIssuers();
      } catch (error) {
        Alert.alert('Error', 'Failed to set default issuer');
      }
    }
  };

  const renderIssuerItem = ({ item }: { item: Issuer }) => (
    <TouchableOpacity
      style={styles.issuerItem}
      onPress={() => handleEditIssuer(item)}
      onLongPress={() => handleDeleteIssuer(item)}
    >
      <View style={styles.issuerInfo}>
        <View style={styles.issuerHeader}>
          <Text style={styles.issuerName}>{item.company_name}</Text>
          {item.is_default === 1 && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultText}>Default</Text>
            </View>
          )}
        </View>
        {item.contact_name && (
          <Text style={styles.issuerDetail}>{item.contact_name}</Text>
        )}
        {item.email && (
          <Text style={styles.issuerDetail}>{item.email}</Text>
        )}
      </View>
      <View style={styles.issuerActions}>
        {item.is_default !== 1 && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleSetDefault(item)}
          >
            <Ionicons name="star-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Issuer Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={issuers}
          keyExtractor={(item) => item.id?.toString() || ''}
          renderItem={renderIssuerItem}
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title="No issuers configured"
              subtitle="Add your company details to get started"
              actionLabel="Add Issuer"
              onAction={handleAddIssuer}
            />
          }
          contentContainerStyle={issuers.length === 0 && styles.emptyContainer}
        />
      )}

      <FloatingActionButton
        onPress={handleAddIssuer}
        label="Add Issuer"
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView 
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingIssuer ? 'Edit Issuer' : 'Add Issuer'}
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Company Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={companyName}
                    onChangeText={setCompanyName}
                    placeholder="Your company name"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Contact Name</Text>
                  <TextInput
                    style={styles.input}
                    value={contactName}
                    onChangeText={setContactName}
                    placeholder="Contact person name"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="company@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone</Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 234 567 8900"
                    keyboardType="phone-pad"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Address</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Company address"
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={Colors.textLight}
                  />
                </View>

                <View style={styles.switchGroup}>
                  <Text style={styles.label}>Set as Default</Text>
                  <Switch
                    value={isDefault}
                    onValueChange={setIsDefault}
                    trackColor={{ false: Colors.border, true: Colors.primary }}
                    thumbColor={Colors.white}
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveIssuer}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
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
  issuerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  issuerInfo: {
    flex: 1,
  },
  issuerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  issuerName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  defaultBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  defaultText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  issuerDetail: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  issuerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  modalBody: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
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