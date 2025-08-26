import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../styles/theme';
import { FilterChips } from '../../components/common/FilterChips';
import { SearchBar } from '../../components/common/SearchBar';
import { EmptyState } from '../../components/common/EmptyState';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { MultiCurrencyTotal } from '../../components/common/MultiCurrencyTotal';
import { InvoiceCard } from '../../components/invoice/InvoiceCard';
import { InvoiceModel } from '../../models/InvoiceModel';
import { InvoiceWithClient } from '../../types/database';
import { calculateInvoiceTotal } from '../../utils/calculations';

type InvoiceStackParamList = {
  InvoicesList: undefined;
  InvoiceDetail: { invoiceId?: number };
};

type NavigationProp = StackNavigationProp<InvoiceStackParamList, 'InvoicesList'>;

export const InvoicesListScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<InvoiceWithClient[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadInvoices = useCallback(async () => {
    try {
      const data = await InvoiceModel.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload invoices when screen comes into focus (after editing)
  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [loadInvoices])
  );

  useEffect(() => {
    let filtered = [...invoices];
    
    if (filter !== 'all') {
      filtered = filtered.filter(inv => inv.status === filter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => 
        (inv as any).client_name?.toLowerCase().includes(query) ||
        inv.number.toString().includes(query)
      );
    }
    
    setFilteredInvoices(filtered);
  }, [invoices, filter, searchQuery]);

  const calculateTotalsByCurrency = () => {
    const totals: { [currency: string]: number } = {};
    
    filteredInvoices.forEach(invoice => {
      const items = invoice.items || [];
      const calc = calculateInvoiceTotal(
        items,
        invoice.discount_type,
        invoice.discount_value,
        (invoice as any).tax_rate || null
      );
      
      const currency = invoice.currency_code || 'USD';
      totals[currency] = (totals[currency] || 0) + calc.total;
    });
    
    return Object.entries(totals)
      .map(([currency, amount]) => ({ currency, amount }))
      .filter(t => t.amount > 0);
  };

  const getFilterCounts = () => {
    const all = invoices.length;
    const unpaid = invoices.filter(inv => inv.status === 'unpaid').length;
    const paid = invoices.filter(inv => inv.status === 'paid').length;
    return { all, unpaid, paid };
  };

  const counts = getFilterCounts();
  const filterChips = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'unpaid', label: 'Unpaid', count: counts.unpaid },
    { id: 'paid', label: 'Paid', count: counts.paid },
  ];

  const handleCreateInvoice = () => {
    navigation.navigate('InvoiceDetail', {});
  };

  const handleInvoicePress = (invoice: InvoiceWithClient) => {
    navigation.navigate('InvoiceDetail', { invoiceId: invoice.id });
  };

  const handleTogglePaid = async (invoice: InvoiceWithClient) => {
    try {
      if (invoice.id) {
        if (invoice.status === 'paid') {
          await InvoiceModel.markUnpaid(invoice.id);
        } else {
          await InvoiceModel.markPaid(invoice.id);
        }
        loadInvoices();
      }
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      Alert.alert('Error', 'Failed to update invoice status');
    }
  };

  const handleDeleteInvoice = async (invoice: InvoiceWithClient) => {
    Alert.alert(
      'Delete Invoice',
      `Are you sure you want to delete invoice #${invoice.number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (invoice.id) {
                await InvoiceModel.delete(invoice.id);
                loadInvoices();
              }
            } catch (error) {
              console.error('Failed to delete invoice:', error);
              Alert.alert('Error', 'Failed to delete invoice');
            }
          }
        }
      ]
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadInvoices();
  };

  const renderHeader = () => (
    <>
      <FilterChips
        chips={filterChips}
        selectedId={filter}
        onSelect={setFilter}
      />
      
      <MultiCurrencyTotal 
        totals={calculateTotalsByCurrency()}
      />
      
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search invoices..."
      />
    </>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Invoices</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings' as any)}>
          <Ionicons name="settings-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.id?.toString() || ''}
        renderItem={({ item }) => (
          <InvoiceCard
            invoice={item}
            onPress={() => handleInvoicePress(item)}
            onEdit={() => handleInvoicePress(item)}
            onDelete={() => handleDeleteInvoice(item)}
            onTogglePaid={() => handleTogglePaid(item)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title="No invoices yet"
            subtitle="Create your first invoice to get started"
            actionLabel="Create Invoice"
            onAction={handleCreateInvoice}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={filteredInvoices.length === 0 && styles.emptyContainer}
      />

      <FloatingActionButton
        onPress={handleCreateInvoice}
        label="Create Invoice"
      />
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
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
  },
  summary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryText: {
    fontSize: Typography.sizes.base,
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
});