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
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../styles/theme';
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
      <View style={styles.itemCard}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleSelectItem(item)}
        >
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemMeta}>
              <Text style={styles.itemPrice}>
                {formatCurrency(item.rate, currency)}
              </Text>
              {item.unit && (
                <Text style={styles.itemUnit}>per {item.unit}</Text>
              )}
            </View>
          </View>
          <View style={styles.itemRight}>
            <Text style={styles.itemTotal}>
              {formatCurrency(item.rate * (parseFloat(quantity) || 1), currency)}
            </Text>
            <Text style={styles.itemQuantityText}>
              × {quantity || '1'}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteItem(item)}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
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
            {showCreateForm ? 'Create Item' : 'Select Item'}
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
              <Text style={styles.createButtonText}>Add New Item</Text>
            </TouchableOpacity>

            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.textLight} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search items..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={Colors.textLight}
                />
                {searchQuery !== '' && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={Colors.textLight} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Qty</Text>
                <View style={styles.quantityInputWrapper}>
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => {
                      const qty = parseFloat(quantity) || 1;
                      if (qty > 1) setQuantity((qty - 1).toString());
                    }}
                  >
                    <Ionicons name="remove" size={18} color={Colors.text} />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.quantityInput}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                  <TouchableOpacity 
                    style={styles.quantityButton}
                    onPress={() => {
                      const qty = parseFloat(quantity) || 1;
                      setQuantity((qty + 1).toString());
                    }}
                  >
                    <Ionicons name="add" size={18} color={Colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

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
          <ScrollView style={styles.createForm}>
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
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },
  quantityInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityButton: {
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  quantityInput: {
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.sizes.base,
    color: Colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  itemCard: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemPrice: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  itemUnit: {
    fontSize: Typography.sizes.sm,
    color: Colors.textLight,
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemTotal: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  itemQuantityText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemActions: {
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