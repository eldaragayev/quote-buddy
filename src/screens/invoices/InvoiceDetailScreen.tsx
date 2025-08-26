import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
import { InvoiceModel } from '../../models/InvoiceModel';
import { IssuerModel } from '../../models/IssuerModel';
import { SettingsModel } from '../../models/SettingsModel';
import { ClientSelector } from '../../components/selectors/ClientSelector';
import { ItemSelector } from '../../components/selectors/ItemSelector';
import { CurrencySelector } from '../../components/selectors/CurrencySelector';
import { IssuerSelector } from '../../components/selectors/IssuerSelector';
import { 
  Invoice, 
  InvoiceItem, 
  Client, 
  Issuer, 
  Tax,
  DueOption,
  DiscountType 
} from '../../types/database';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calculateInvoiceTotal } from '../../utils/calculations';

type InvoiceStackParamList = {
  InvoicesList: undefined;
  InvoiceDetail: { invoiceId?: number };
};

type NavigationProp = StackNavigationProp<InvoiceStackParamList, 'InvoiceDetail'>;
type RoutePropType = RouteProp<InvoiceStackParamList, 'InvoiceDetail'>;

export const InvoiceDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const invoiceId = route.params?.invoiceId;
  const isEditMode = !!invoiceId;

  const [loading, setLoading] = useState(false);
  const [issuer, setIssuer] = useState<Issuer | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState(1);
  const [issuedDate, setIssuedDate] = useState(new Date());
  const [dueOption, setDueOption] = useState<DueOption>('net_30');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [currency, setCurrency] = useState('USD');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discountType, setDiscountType] = useState<DiscountType | null>(null);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [tax] = useState<Tax | null>(null);
  const [publicNotes, setPublicNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [showIssuerSelector, setShowIssuerSelector] = useState(false);
  const [showIssuedDatePicker, setShowIssuedDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [invoiceStatus, setInvoiceStatus] = useState<'paid' | 'unpaid'>('unpaid');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const defaultIssuer = await IssuerModel.getDefault();
      if (defaultIssuer) {
        setIssuer(defaultIssuer);
        const nextNumber = await InvoiceModel.getNextInvoiceNumber(defaultIssuer.id!);
        setInvoiceNumber(nextNumber);
      }

      const defaultCurrency = await SettingsModel.getDefaultCurrency();
      setCurrency(defaultCurrency);

      if (invoiceId) {
        await loadInvoice(invoiceId);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const loadInvoice = async (id: number) => {
    try {
      const invoice = await InvoiceModel.getById(id);
      if (invoice) {
        setInvoiceNumber(invoice.number);
        setIssuedDate(new Date(invoice.issued_date));
        setDueOption(invoice.due_option);
        if (invoice.due_date) {
          setDueDate(new Date(invoice.due_date));
        }
        setCurrency(invoice.currency_code);
        setItems(invoice.items || []);
        setDiscountType(invoice.discount_type || null);
        setDiscountValue(invoice.discount_value || 0);
        setPublicNotes(invoice.public_notes || '');
        setTerms(invoice.terms || '');
        setPoNumber(invoice.po_number || '');
        setInvoiceStatus(invoice.status || 'unpaid');
        
        // Load client data
        if (invoice.client_id) {
          const { ClientModel } = await import('../../models/ClientModel');
          const clientData = await ClientModel.getById(invoice.client_id);
          if (clientData) {
            setClient(clientData);
          }
        }
        
        // Load issuer data
        if (invoice.issuer_id) {
          const issuerData = await IssuerModel.getById(invoice.issuer_id);
          if (issuerData) {
            setIssuer(issuerData);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load invoice:', error);
      Alert.alert('Error', 'Failed to load invoice');
    }
  };

  const handleSave = async () => {
    if (!issuer) {
      Alert.alert('Error', 'Please select an issuer');
      return;
    }

    if (!client) {
      Alert.alert('Error', 'Please select a client');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const invoiceData: Omit<Invoice, 'id'> = {
        issuer_id: issuer.id!,
        client_id: client.id!,
        number: invoiceNumber,
        issued_date: issuedDate.toISOString().split('T')[0],
        due_option: dueOption,
        due_date: dueDate ? dueDate.toISOString().split('T')[0] : undefined,
        currency_code: currency,
        status: 'unpaid',
        discount_type: discountType || undefined,
        discount_value: discountValue || undefined,
        tax_id: tax?.id,
        public_notes: publicNotes || undefined,
        terms: terms || undefined,
        po_number: poNumber || undefined,
      };

      if (isEditMode && invoiceId) {
        await InvoiceModel.update(invoiceId, invoiceData);
        
        // Delete existing items and re-add them
        const existingItems = await InvoiceModel.getItemsByInvoiceId(invoiceId);
        for (const item of existingItems) {
          if (item.id) {
            await InvoiceModel.deleteItem(item.id);
          }
        }
        
        // Add updated items
        for (let i = 0; i < items.length; i++) {
          await InvoiceModel.addItem({
            invoice_id: invoiceId,
            item_id: items[i].item_id,
            name: items[i].name,
            qty: items[i].qty,
            rate: items[i].rate,
            position: i,
          });
        }
      } else {
        const newId = await InvoiceModel.create(invoiceData);
        for (let i = 0; i < items.length; i++) {
          await InvoiceModel.addItem({
            invoice_id: newId,
            item_id: items[i].item_id,
            name: items[i].name,
            qty: items[i].qty,
            rate: items[i].rate,
            position: i,
          });
        }
      }

      // Force refresh on the list screen
      navigation.navigate('InvoicesList' as any);
    } catch (error) {
      console.error('Failed to save invoice:', error);
      Alert.alert('Error', 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  const addItem = (item?: InvoiceItem) => {
    if (item) {
      const newItem = { ...item, position: items.length };
      setItems([...items, newItem]);
    } else {
      setShowItemSelector(true);
    }
  };

  const updateItem = (index: number, updates: Partial<InvoiceItem>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...updates };
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleShowActions = () => {
    if (!isEditMode) return;
    
    const actions = [
      { 
        text: invoiceStatus === 'paid' ? 'Mark as Unpaid' : 'Mark as Paid',
        onPress: async () => {
          if (invoiceId) {
            try {
              if (invoiceStatus === 'paid') {
                await InvoiceModel.markUnpaid(invoiceId);
                setInvoiceStatus('unpaid');
              } else {
                await InvoiceModel.markPaid(invoiceId);
                setInvoiceStatus('paid');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to update invoice status');
            }
          }
        }
      },
      {
        text: 'Delete Invoice',
        onPress: () => {
          Alert.alert(
            'Delete Invoice',
            'Are you sure you want to delete this invoice?',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  if (invoiceId) {
                    try {
                      await InvoiceModel.delete(invoiceId);
                      navigation.goBack();
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete invoice');
                    }
                  }
                }
              }
            ]
          );
        },
        style: 'destructive' as const
      },
      { text: 'Cancel', style: 'cancel' as const }
    ];
    
    Alert.alert('Invoice Actions', undefined, actions);
  };

  const handleIssuedDateChange = (_event: any, selectedDate?: Date) => {
    setShowIssuedDatePicker(false);
    if (selectedDate) {
      setIssuedDate(selectedDate);
    }
  };

  const handleDueDateChange = (_event: any, selectedDate?: Date) => {
    setShowDueDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
      setDueOption('custom');
    }
  };

  const handleDueOptionChange = () => {
    const options = ['none', 'on_receipt', 'net_7', 'net_14', 'net_30', 'custom'] as DueOption[];
    const currentIndex = options.indexOf(dueOption);
    const nextIndex = (currentIndex + 1) % options.length;
    const nextOption = options[nextIndex];
    
    setDueOption(nextOption);
    
    if (nextOption === 'custom') {
      setShowDueDatePicker(true);
    } else if (nextOption === 'none') {
      setDueDate(null);
    } else {
      const date = new Date(issuedDate);
      if (nextOption === 'on_receipt') {
        setDueDate(date);
      } else if (nextOption === 'net_7') {
        date.setDate(date.getDate() + 7);
        setDueDate(date);
      } else if (nextOption === 'net_14') {
        date.setDate(date.getDate() + 14);
        setDueDate(date);
      } else if (nextOption === 'net_30') {
        date.setDate(date.getDate() + 30);
        setDueDate(date);
      }
    }
  };

  const calculation = calculateInvoiceTotal(
    items,
    discountType,
    discountValue,
    tax?.rate_percent
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditMode ? `Invoice #${invoiceNumber}` : 'Create Invoice'}
        </Text>
        <TouchableOpacity onPress={handleShowActions}>
          <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Invoice Info</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.field}
            onPress={() => setShowIssuerSelector(true)}
          >
            <Text style={styles.fieldLabel}>Issuer</Text>
            <Text style={styles.fieldValue}>
              {issuer?.company_name || 'Select issuer'}
            </Text>
          </TouchableOpacity>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Number</Text>
            <TextInput
              style={styles.fieldInput}
              value={invoiceNumber.toString()}
              onChangeText={(text) => setInvoiceNumber(parseInt(text) || 1)}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity 
            style={styles.field}
            onPress={() => setShowIssuedDatePicker(true)}
          >
            <Text style={styles.fieldLabel}>Issued</Text>
            <Text style={styles.fieldValue}>{formatDate(issuedDate)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.field}
            onPress={handleDueOptionChange}
            onLongPress={() => dueOption === 'custom' && setShowDueDatePicker(true)}
          >
            <Text style={styles.fieldLabel}>Due</Text>
            <Text style={styles.fieldValue}>
              {dueOption === 'net_7' ? '7 days' :
               dueOption === 'net_14' ? '14 days' :
               dueOption === 'net_30' ? '30 days' :
               dueOption === 'on_receipt' ? 'On receipt' :
               dueOption === 'custom' && dueDate ? formatDate(dueDate) :
               'None'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.field}
            onPress={() => setShowCurrencySelector(true)}
          >
            <Text style={styles.fieldLabel}>Currency</Text>
            <Text style={styles.fieldValue}>{currency}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Client</Text>
          </View>
          <TouchableOpacity 
            style={styles.field}
            onPress={() => setShowClientSelector(true)}
          >
            <Text style={styles.fieldValue}>
              {client?.name || 'Select client'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <TextInput
                style={[styles.itemInput, styles.itemName]}
                value={item.name}
                onChangeText={(text) => updateItem(index, { name: text })}
                placeholder="Item name"
              />
              <TextInput
                style={[styles.itemInput, styles.itemQty]}
                value={item.qty ? item.qty.toString() : ''}
                onChangeText={(text) => {
                  const qty = text === '' ? 0 : parseFloat(text) || 0;
                  updateItem(index, { qty });
                }}
                keyboardType="numeric"
                placeholder="Qty"
              />
              <TextInput
                style={[styles.itemInput, styles.itemRate]}
                value={item.rate ? item.rate.toString() : ''}
                onChangeText={(text) => {
                  const rate = text === '' ? 0 : parseFloat(text) || 0;
                  updateItem(index, { rate });
                }}
                keyboardType="numeric"
                placeholder="Rate"
              />
              <Text style={styles.itemTotal}>
                {formatCurrency(item.qty * item.rate, currency)}
              </Text>
              <TouchableOpacity onPress={() => removeItem(index)}>
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity style={styles.addButton} onPress={() => addItem()}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.addButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Summary</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(calculation.subtotal, currency)}
            </Text>
          </View>

          {calculation.discountAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount</Text>
              <Text style={styles.summaryValue}>
                -{formatCurrency(calculation.discountAmount, currency)}
              </Text>
            </View>
          )}

          {calculation.taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(calculation.taxAmount, currency)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(calculation.total, currency)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notes & Terms</Text>
          </View>
          
          <TextInput
            style={styles.textArea}
            value={publicNotes}
            onChangeText={setPublicNotes}
            placeholder="Public notes (optional)"
            multiline
            numberOfLines={3}
          />
          
          <TextInput
            style={styles.textArea}
            value={terms}
            onChangeText={setTerms}
            placeholder="Terms (optional)"
            multiline
            numberOfLines={3}
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? 'Saving...' : isEditMode ? 'Save' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ClientSelector
        isVisible={showClientSelector}
        onClose={() => setShowClientSelector(false)}
        onSelect={(selectedClient) => {
          setClient(selectedClient);
          setShowClientSelector(false);
        }}
        selectedClient={client}
      />

      <ItemSelector
        isVisible={showItemSelector}
        onClose={() => setShowItemSelector(false)}
        onSelect={(item) => {
          addItem(item);
          setShowItemSelector(false);
        }}
        currency={currency}
      />

      <CurrencySelector
        isVisible={showCurrencySelector}
        onClose={() => setShowCurrencySelector(false)}
        onSelect={(selectedCurrency) => {
          setCurrency(selectedCurrency);
          setShowCurrencySelector(false);
        }}
        selectedCurrency={currency}
      />

      <IssuerSelector
        isVisible={showIssuerSelector}
        onClose={() => setShowIssuerSelector(false)}
        onSelect={(selectedIssuer) => {
          setIssuer(selectedIssuer);
          if (selectedIssuer.id) {
            InvoiceModel.getNextInvoiceNumber(selectedIssuer.id).then(nextNum => {
              setInvoiceNumber(nextNum);
            });
          }
        }}
        selectedIssuer={issuer}
      />

      {showIssuedDatePicker && (
        <DateTimePicker
          value={issuedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleIssuedDateChange}
        />
      )}

      {showDueDatePicker && (
        <DateTimePicker
          value={dueDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDueDateChange}
        />
      )}
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  fieldLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  fieldValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  fieldInput: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  itemInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    fontSize: Typography.sizes.sm,
  },
  itemName: {
    flex: 2,
  },
  itemQty: {
    flex: 0.5,
  },
  itemRate: {
    flex: 1,
  },
  itemTotal: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    textAlign: 'right',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  addButtonText: {
    fontSize: Typography.sizes.base,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  totalLabel: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  totalValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: Typography.sizes.base,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomBar: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});