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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
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
  const [loading, setLoading] = useState(true);

  const loadTaxes = useCallback(async () => {
    try {
      const data = await TaxModel.getAll();
      setTaxes(data);
    } catch (error) {
      console.error('Failed to load taxes:', error);
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
    setShowAddModal(true);
  };

  const handleEditTax = (tax: Tax) => {
    setEditingTax(tax);
    setTaxName(tax.name);
    setTaxRate(tax.rate_percent.toString());
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
      if (editingTax?.id) {
        await TaxModel.update(editingTax.id, {
          name: taxName.trim(),
          rate_percent: rate,
        });
      } else {
        await TaxModel.create({
          name: taxName.trim(),
          rate_percent: rate,
        });
      }
      setShowAddModal(false);
      loadTaxes();
    } catch (error) {
      Alert.alert('Error', 'Failed to save tax');
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
      style={styles.taxItem}
      onPress={() => handleEditTax(item)}
      onLongPress={() => handleDeleteTax(item)}
    >
      <View style={styles.taxInfo}>
        <Text style={styles.taxName}>{item.name}</Text>
        <Text style={styles.taxRate}>{item.rate_percent}%</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Tax Settings</Text>
        <View style={{ width: 24 }} />
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
  taxItem: {
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
  taxInfo: {
    flex: 1,
  },
  taxName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: 4,
  },
  taxRate: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
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