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
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../styles/theme';
import { InvoiceModel } from '../../models/InvoiceModel';
import { IssuerModel } from '../../models/IssuerModel';
import { SettingsModel } from '../../models/SettingsModel';
import { ClientSelector } from '../../components/selectors/ClientSelector';
import { ItemSelector } from '../../components/selectors/ItemSelector';
import { CurrencySelector } from '../../components/selectors/CurrencySelector';
import { IssuerSelector } from '../../components/selectors/IssuerSelector';
import { DueDatePicker } from '../../components/selectors/DueDatePicker';
import { DatePickerModal } from '../../components/selectors/DatePickerModal';
import { TaxSelector } from '../../components/selectors/TaxSelector';
import { 
  Invoice, 
  InvoiceItem, 
  Client, 
  Issuer, 
  Tax,
  DueOption,
  DiscountType 
} from '../../types/database';
import { formatCurrency, formatDate, getDueText } from '../../utils/formatters';
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
  const [tax, setTax] = useState<Tax | null>(null);
  const [publicNotes, setPublicNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [showIssuerSelector, setShowIssuerSelector] = useState(false);
  const [showTaxSelector, setShowTaxSelector] = useState(false);
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

      // Load default tax for new invoices
      if (!invoiceId) {
        const { TaxModel } = await import('../../models/TaxModel');
        const defaultTax = await TaxModel.getDefault();
        if (defaultTax) {
          setTax(defaultTax);
        }
      }

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
        
        // Load tax data
        if (invoice.tax_id) {
          const { TaxModel } = await import('../../models/TaxModel');
          const taxData = await TaxModel.getById(invoice.tax_id);
          if (taxData) {
            setTax(taxData);
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
        status: isEditMode ? invoiceStatus : 'unpaid',
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

  const handleIssuedDateSelect = (selectedDate: Date) => {
    setIssuedDate(selectedDate);
    
    // Recalculate due date based on current payment terms
    if (dueOption !== 'custom' && dueOption !== 'none') {
      const newDueDate = new Date(selectedDate);
      
      if (dueOption === 'on_receipt') {
        setDueDate(newDueDate);
      } else if (dueOption === 'net_7') {
        newDueDate.setDate(newDueDate.getDate() + 7);
        setDueDate(newDueDate);
      } else if (dueOption === 'net_14') {
        newDueDate.setDate(newDueDate.getDate() + 14);
        setDueDate(newDueDate);
      } else if (dueOption === 'net_30') {
        newDueDate.setDate(newDueDate.getDate() + 30);
        setDueDate(newDueDate);
      }
    }
  };

  const handleDueDateSelect = (days: number | null, customDate?: Date) => {
    if (days !== null) {
      const newDate = new Date(issuedDate);
      newDate.setDate(newDate.getDate() + days);
      setDueDate(newDate);
      
      if (days === 0) setDueOption('on_receipt');
      else if (days === 7) setDueOption('net_7');
      else if (days === 14) setDueOption('net_14');
      else if (days === 30) setDueOption('net_30');
    } else if (customDate) {
      setDueDate(customDate);
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

  // Calculate if invoice is overdue
  const dueStatusText = dueDate && invoiceStatus !== 'paid' 
    ? getDueText(dueDate.toISOString().split('T')[0], invoiceStatus)
    : null;
  const isOverdue = dueStatusText && dueStatusText.includes('Overdue');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            <Text style={styles.fieldLabel}>Invoice Date</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={styles.fieldValue}>{formatDate(issuedDate)}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.field}
            onPress={() => setShowDueDatePicker(true)}
          >
            <View style={styles.fieldLabelContainer}>
              <Text style={styles.fieldLabel}>Payment Terms</Text>
              {isOverdue && (
                <View style={styles.overdueBadge}>
                  <Text style={styles.overdueText}>{dueStatusText}</Text>
                </View>
              )}
            </View>
            <View style={styles.fieldValueContainer}>
              <Text style={[styles.fieldValue, isOverdue && { color: Colors.danger }]}>
                {dueOption === 'net_7' ? 'Net 7' :
                 dueOption === 'net_14' ? 'Net 14' :
                 dueOption === 'net_30' ? 'Net 30' :
                 dueOption === 'on_receipt' ? 'Due on Receipt' :
                 dueOption === 'custom' && dueDate ? formatDate(dueDate) :
                 'Select'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </View>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity style={styles.addItemButton} onPress={() => addItem()}>
              <Ionicons name="add" size={18} color={Colors.white} />
              <Text style={styles.addItemButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          
          {items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <TextInput
                  style={styles.itemNameInput}
                  value={item.name}
                  onChangeText={(text) => updateItem(index, { name: text })}
                  placeholder="Item description"
                  placeholderTextColor={Colors.textLight}
                />
                <TouchableOpacity onPress={() => removeItem(index)} style={styles.deleteButton}>
                  <Ionicons name="close-circle" size={22} color={Colors.textLight} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.itemDetails}>
                <View style={styles.itemDetailField}>
                  <Text style={styles.itemDetailLabel}>Quantity</Text>
                  <TextInput
                    style={styles.itemDetailInput}
                    value={item.qty ? item.qty.toString() : ''}
                    onChangeText={(text) => {
                      const qty = text === '' ? 0 : parseFloat(text) || 0;
                      updateItem(index, { qty });
                    }}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
                
                <View style={styles.itemDetailField}>
                  <Text style={styles.itemDetailLabel}>Rate</Text>
                  <TextInput
                    style={styles.itemDetailInput}
                    value={item.rate ? item.rate.toString() : ''}
                    onChangeText={(text) => {
                      const rate = text === '' ? 0 : parseFloat(text) || 0;
                      updateItem(index, { rate });
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={Colors.textLight}
                  />
                </View>
                
                <View style={styles.itemDetailField}>
                  <Text style={styles.itemDetailLabel}>Total</Text>
                  <View style={styles.itemTotalContainer}>
                    <Text style={styles.itemTotalText}>
                      {formatCurrency(item.qty * item.rate, currency)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
          
          {items.length === 0 && (
            <TouchableOpacity style={styles.emptyItemsButton} onPress={() => addItem()}>
              <Ionicons name="add-circle-outline" size={24} color={Colors.textSecondary} />
              <Text style={styles.emptyItemsText}>Add your first item</Text>
            </TouchableOpacity>
          )}
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

          <TouchableOpacity 
            style={styles.summaryRow}
            onPress={() => setShowTaxSelector(true)}
          >
            <Text style={styles.summaryLabel}>Tax</Text>
            <View style={styles.fieldValueContainer}>
              <Text style={[styles.summaryValue, { marginRight: Spacing.xs }]}>
                {tax ? `${tax.name} (${tax.rate_percent}%)` : 'No tax'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </View>
          </TouchableOpacity>

          {calculation.taxAmount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}></Text>
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
      </KeyboardAvoidingView>

      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Ionicons 
            name={loading ? "hourglass-outline" : isEditMode ? "checkmark" : "add"} 
            size={20} 
            color={Colors.white} 
          />
          <Text style={styles.primaryButtonText}>
            {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Invoice'}
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

      <DatePickerModal
        isVisible={showIssuedDatePicker}
        onClose={() => setShowIssuedDatePicker(false)}
        onSelect={handleIssuedDateSelect}
        currentDate={issuedDate}
        title="Invoice Date"
      />

      <DueDatePicker
        isVisible={showDueDatePicker}
        onClose={() => setShowDueDatePicker(false)}
        onSelect={handleDueDateSelect}
        currentDate={issuedDate}
      />

      <TaxSelector
        isVisible={showTaxSelector}
        onClose={() => setShowTaxSelector(false)}
        onSelect={setTax}
        selectedTax={tax}
      />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 150,
    flexGrow: 1,
  },
  section: {
    backgroundColor: Colors.white,
    marginBottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  fieldLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    flex: 1,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  overdueBadge: {
    backgroundColor: Colors.danger,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  overdueText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldValue: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  fieldValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  fieldInput: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
    textAlign: 'right',
    flex: 1,
  },
  itemCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  itemNameInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  itemDetailField: {
    flex: 1,
  },
  itemDetailLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemDetailInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sizes.base,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemTotalContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemTotalText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    textAlign: 'center',
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
    color: Colors.black,
    fontWeight: Typography.weights.medium,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  addItemButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.white,
    fontWeight: Typography.weights.semibold,
  },
  emptyItemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  emptyItemsText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
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
    position: 'absolute',
    bottom: 0,
    left: Spacing.xl,
    right: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.black,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
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