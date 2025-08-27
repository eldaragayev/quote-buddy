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
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../styles/theme';
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
      style={styles.issuerCard}
      onPress={() => handleEditIssuer(item)}
      activeOpacity={0.7}
    >
      {item.is_default === 1 && (
        <View style={styles.defaultIndicator} />
      )}
      <View style={styles.issuerContent}>
        <View style={styles.issuerLeft}>
          <View style={styles.issuerIconContainer}>
            <Ionicons name="business" size={20} color={Colors.text} />
          </View>
          <View style={styles.issuerInfo}>
            <View style={styles.issuerHeader}>
              <Text style={styles.issuerName}>{item.company_name}</Text>
              {item.is_default === 1 && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>DEFAULT</Text>
                </View>
              )}
            </View>
            {item.contact_name && (
              <Text style={styles.issuerDetail}>
                <Ionicons name="person-outline" size={12} color={Colors.textSecondary} /> {item.contact_name}
              </Text>
            )}
            {item.email && (
              <Text style={styles.issuerDetail}>
                <Ionicons name="mail-outline" size={12} color={Colors.textSecondary} /> {item.email}
              </Text>
            )}
          </View>
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteIssuer(item)}
          >
            <Ionicons name="trash-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Manage Issuers</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.infoIconContainer}>
          <Ionicons name="information-circle" size={20} color={Colors.white} />
        </View>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Company Details</Text>
          <Text style={styles.infoSubtitle}>Manage your business information that appears on invoices</Text>
        </View>
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
          contentContainerStyle={[
            styles.listContent,
            issuers.length === 0 && styles.emptyContainer
          ]}
          showsVerticalScrollIndicator={false}
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
                <View style={styles.modalTitleContainer}>
                  <View style={styles.modalIcon}>
                    <Ionicons name={editingIssuer ? "create" : "add"} size={20} color={Colors.white} />
                  </View>
                  <Text style={styles.modalTitle}>
                    {editingIssuer ? 'Edit Issuer' : 'New Issuer'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeButton}>
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
                    placeholder="Enter company name"
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

                <TouchableOpacity 
                  style={styles.switchGroup}
                  onPress={() => setIsDefault(!isDefault)}
                  activeOpacity={0.7}
                >
                  <View style={styles.switchLeft}>
                    <Ionicons name="star" size={20} color={isDefault ? Colors.black : Colors.textSecondary} />
                    <Text style={[styles.switchLabel, isDefault && styles.switchLabelActive]}>Set as Default Issuer</Text>
                  </View>
                  <Switch
                    value={isDefault}
                    onValueChange={setIsDefault}
                    trackColor={{ false: Colors.border, true: Colors.black }}
                    thumbColor={Colors.white}
                  />
                </TouchableOpacity>
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
                  <Ionicons name="checkmark" size={18} color={Colors.white} style={{ marginRight: 6 }} />
                  <Text style={styles.saveButtonText}>Save Issuer</Text>
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
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    letterSpacing: -0.5,
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.black,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.md,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.white,
    opacity: 0.7,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  issuerCard: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  defaultIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: Colors.black,
  },
  issuerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  issuerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  issuerIconContainer: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
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
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  defaultBadge: {
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  defaultText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: Typography.weights.bold,
    letterSpacing: 0.5,
  },
  issuerDetail: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  issuerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    borderRadius: BorderRadius.xl,
    width: '90%',
    maxWidth: 400,
    ...Shadow.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  modalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.text,
    backgroundColor: Colors.backgroundSecondary,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    fontWeight: Typography.weights.medium,
  },
  switchLabelActive: {
    color: Colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.lg,
    paddingTop: Spacing.xs,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.white,
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
    ...Shadow.sm,
  },
  saveButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
});