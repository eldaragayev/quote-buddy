import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../styles/theme';
import { TaxModel } from '../../models/TaxModel';
import { Tax } from '../../types/database';

interface TaxSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (tax: Tax | null) => void;
  selectedTax?: Tax | null;
}

export const TaxSelector: React.FC<TaxSelectorProps> = ({
  isVisible,
  onClose,
  onSelect,
  selectedTax,
}) => {
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVisible) {
      loadTaxes();
    }
  }, [isVisible]);

  const loadTaxes = async () => {
    try {
      const data = await TaxModel.getAll();
      setTaxes(data);
    } catch (error) {
      console.error('Failed to load taxes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTax = (tax: Tax | null) => {
    onSelect(tax);
    onClose();
  };

  const renderTaxItem = ({ item }: { item: Tax }) => (
    <TouchableOpacity
      style={[
        styles.taxItem,
        selectedTax?.id === item.id && styles.selectedTaxItem
      ]}
      onPress={() => handleSelectTax(item)}
      activeOpacity={0.7}
    >
      <View style={styles.taxLeft}>
        <View style={[
          styles.radioOuter,
          selectedTax?.id === item.id && styles.radioSelected
        ]}>
          {selectedTax?.id === item.id && (
            <View style={styles.radioInner} />
          )}
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
          <Text style={styles.taxRate}>{item.rate_percent}% tax rate</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.container}>
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Select Tax</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* No Tax Option */}
          <TouchableOpacity
            style={[
              styles.noTaxItem,
              selectedTax === null && styles.selectedTaxItem
            ]}
            onPress={() => handleSelectTax(null)}
            activeOpacity={0.7}
          >
            <View style={styles.taxLeft}>
              <View style={[
                styles.radioOuter,
                selectedTax === null && styles.radioSelected
              ]}>
                {selectedTax === null && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <View style={styles.taxInfo}>
                <Text style={styles.taxName}>No Tax</Text>
                <Text style={styles.taxRate}>0% tax rate</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading taxes...</Text>
            </View>
          ) : taxes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calculator-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyText}>No taxes configured</Text>
              <Text style={styles.emptySubtext}>Add taxes in settings</Text>
            </View>
          ) : (
            <FlatList
              data={taxes}
              keyExtractor={(item) => item.id?.toString() || ''}
              renderItem={renderTaxItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '75%',
    ...Shadow.lg,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xl,
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
  noTaxItem: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  taxItem: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectedTaxItem: {
    borderColor: Colors.black,
    backgroundColor: Colors.backgroundSecondary,
  },
  taxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  radioSelected: {
    borderColor: Colors.black,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.black,
  },
  taxInfo: {
    flex: 1,
  },
  taxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  taxName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  taxRate: {
    fontSize: Typography.sizes.sm,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  loadingText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});