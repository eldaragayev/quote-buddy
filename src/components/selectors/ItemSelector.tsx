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
import { Item, InvoiceItem } from '../../types/database';
import { ItemModel } from '../../models/ItemModel';
import { formatCurrency } from '../../utils/formatters';

interface ItemSelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (item: InvoiceItem) => void;
  currency?: string;
}

export const ItemSelector: React.FC<ItemSelectorProps> = ({
  isVisible,
  onClose,
  onSelect,
  currency = 'USD',
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemRate, setNewItemRate] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [quantity, setQuantity] = useState('1');

  useEffect(() => {
    if (isVisible) {
      loadItems();
    }
  }, [isVisible]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    } else {
      setFilteredItems(items);
    }
  }, [searchQuery, items]);

  const loadItems = async () => {
    try {
      const data = await ItemModel.getAll();
      setItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    }
  };

  const handleCreateItem = async () => {
    if (!newItemName.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (!newItemRate.trim() || isNaN(parseFloat(newItemRate))) {
      Alert.alert('Error', 'Please enter a valid rate');
      return;
    }

    try {
      const itemId = await ItemModel.create({
        name: newItemName.trim(),
        rate: parseFloat(newItemRate),
        unit: newItemUnit.trim() || undefined,
      });

      const newItem = await ItemModel.getById(itemId);
      if (newItem) {
        const invoiceItem: InvoiceItem = {
          invoice_id: 0,
          item_id: newItem.id,
          name: newItem.name,
          qty: parseFloat(quantity) || 1,
          rate: newItem.rate,
          position: 0,
        };
        onSelect(invoiceItem);
        handleClose();
      }
    } catch (error) {
      console.error('Failed to create item:', error);
      Alert.alert('Error', 'Failed to create item');
    }
  };

  const resetForm = () => {
    setNewItemName('');
    setNewItemRate('');
    setNewItemUnit('');
    setQuantity('1');
    setShowCreateForm(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSelectItem = (item: Item) => {
    const invoiceItem: InvoiceItem = {
      invoice_id: 0,
      item_id: item.id,
      name: item.name,
      qty: parseFloat(quantity) || 1,
      rate: item.rate,
      position: 0,
    };
    onSelect(invoiceItem);
    handleClose();
  };

  const handleDeleteItem = async (item: Item) => {
    Alert.alert(
      'Delete Item',
      `Delete "${item.name}" from saved items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (item.id) {
              try {
                await ItemModel.delete(item.id);
                loadItems();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete item');
              }
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Item }) => {
    return (
      <TouchableOpacity
        style={styles.itemRow}
        onPress={() => handleSelectItem(item)}
        onLongPress={() => handleDeleteItem(item)}
      >
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDetail}>
            {formatCurrency(item.rate, currency)}
            {item.unit ? ` / ${item.unit}` : ''}
          </Text>
        </View>
        <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
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
          <Text style={styles.title}>Select Item</Text>
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
                placeholder="Search items..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder="1"
              />
            </View>

            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              <Text style={styles.createButtonText}>Create New Item</Text>
            </TouchableOpacity>

            {filteredItems.length > 0 && (
              <Text style={styles.hint}>Tap to add • Long press to delete</Text>
            )}

            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id?.toString() || ''}
              renderItem={renderItem}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {searchQuery ? 'No items found' : 'No items yet'}
                  </Text>
                </View>
              }
              contentContainerStyle={styles.listContent}
            />
          </>
        ) : (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>Create New Item</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Item Name *"
              value={newItemName}
              onChangeText={setNewItemName}
              placeholderTextColor={Colors.textLight}
            />
            
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Rate *"
                value={newItemRate}
                onChangeText={setNewItemRate}
                keyboardType="numeric"
                placeholderTextColor={Colors.textLight}
              />
              
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Unit (optional)"
                value={newItemUnit}
                onChangeText={setNewItemUnit}
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
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
                onPress={handleCreateItem}
              >
                <Text style={styles.saveButtonText}>Create & Add</Text>
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
    marginBottom: Spacing.sm,
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  quantityLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    fontSize: Typography.sizes.base,
    color: Colors.text,
    minWidth: 60,
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  itemDetail: {
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
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  halfInput: {
    flex: 1,
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