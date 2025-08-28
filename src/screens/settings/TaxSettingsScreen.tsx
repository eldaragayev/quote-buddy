import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../styles/theme';
import { TaxModel } from '../../models/TaxModel';
import { Tax } from '../../types/database';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { EmptyState } from '../../components/common/EmptyState';

export const TaxSettingsScreen = () => {
  const navigation = useNavigation();
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [taxName, setTaxName] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTaxes = useCallback(async () => {
    try {
      const data = await TaxModel.getAll();
      setTaxes(data);
    } catch (error) {
      // Failed to load taxes
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTaxes();
    }, [loadTaxes])
  );

  const handleAddTax = () => {
    setEditingTax(null);
    setTaxName('');
    setTaxRate('');
    setIsDefault(taxes.length === 0); // First tax is default by default
    setShowAddModal(true);
  };

  const handleEditTax = (tax: Tax) => {
    setEditingTax(tax);
    setTaxName(tax.name);
    setTaxRate(tax.rate_percent.toString());
    setIsDefault(tax.is_default === 1);
    setShowAddModal(true);
  };

  const handleSaveTax = async () => {
    if (!taxName.trim()) {
      Alert.alert('Error', 'Please enter a tax name');
      return;
    }

    const rate = parseFloat(taxRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      Alert.alert('Error', 'Please enter a valid tax rate (0-100)');
      return;
    }

    try {
      const taxData = {
        name: taxName.trim(),
        rate_percent: rate,
        is_default: isDefault ? 1 : 0,
      };

      if (editingTax?.id) {
        // Update handles is_default internally now
        await TaxModel.update(editingTax.id, taxData);
      } else {
        await TaxModel.create(taxData);
      }
      setShowAddModal(false);
      loadTaxes();
    } catch (error) {
      Alert.alert('Error', 'Failed to save tax');
    }
  };

  const handleSetDefault = async (tax: Tax) => {
    if (tax.id && tax.is_default !== 1) {
      try {
        await TaxModel.setDefault(tax.id);
        loadTaxes();
      } catch (error) {
        Alert.alert('Error', 'Failed to set default tax');
      }
    }
  };

  const handleDeleteTax = (tax: Tax) => {
    Alert.alert(
      'Delete Tax',
      `Are you sure you want to delete "${tax.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (tax.id) {
              try {
                await TaxModel.delete(tax.id);
                loadTaxes();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete tax');
              }
            }
          },
        },
      ]
    );
  };

  const renderTaxItem = ({ item }: { item: Tax }) => (
    <TouchableOpacity
      style={styles.taxCard}
      onPress={() => handleEditTax(item)}
      activeOpacity={0.7}
    >
      {item.is_default === 1 && (
        <View style={styles.defaultIndicator} />
      )}
      <View style={styles.taxContent}>
        <View style={styles.taxLeft}>
          <View style={styles.taxIconContainer}>
            <Ionicons name="calculator" size={20} color={Colors.text} />
          </View>
          <View style={styles.taxInfo}>
            <View style={styles.taxHeader}>
              <Text style={styles.taxName}>{item.name}</Text>
              {item.is_default === 1 && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>DEFAULT</Text>
                </View>
              )}
            </View>
            <Text style={styles.taxRate}>Tax rate: {item.rate_percent}%</Text>
          </View>
        </View>
        <View style={styles.taxActions}>
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
            onPress={() => handleDeleteTax(item)}
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
        <Text style={styles.title}>Tax Rates</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={taxes}
          keyExtractor={(item) => item.id?.toString() || ''}
          renderItem={renderTaxItem}
          ListEmptyComponent={
            <EmptyState
              icon="calculator-outline"
              title="No taxes configured"
              subtitle="Add your first tax rate to get started"
              actionLabel="Add Tax"
              onAction={handleAddTax}
            />
          }
          contentContainerStyle={taxes.length === 0 && styles.emptyContainer}
        />
      )}

      <FloatingActionButton
        onPress={handleAddTax}
        label="Add Tax"
      />

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTax ? 'Edit Tax' : 'Add Tax'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tax Name</Text>
                <TextInput
                  style={styles.input}
                  value={taxName}
                  onChangeText={setTaxName}
                  placeholder="e.g., VAT, GST, Sales Tax"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Rate (%)</Text>
                <TextInput
                  style={styles.input}
                  value={taxRate}
                  onChangeText={setTaxRate}
                  placeholder="e.g., 10"
                  keyboardType="decimal-pad"
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
                  <Text style={[styles.switchLabel, isDefault && styles.switchLabelActive]}>Set as Default Tax</Text>
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
                onPress={handleSaveTax}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  emptyContainer: {
    flexGrow: 1,
  },
  taxCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
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
  taxContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  taxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taxIconContainer: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  taxInfo: {
    flex: 1,
  },
  taxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  taxName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  taxRate: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
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
  taxActions: {
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
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