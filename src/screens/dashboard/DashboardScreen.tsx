import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
import { FloatingActionButton } from '../../components/common/FloatingActionButton';
import { EmptyState } from '../../components/common/EmptyState';
import { InvoiceModel } from '../../models/InvoiceModel';
import { SettingsModel } from '../../models/SettingsModel';
import { formatCurrency } from '../../utils/formatters';
import { SimpleLineChart } from '../../components/charts/SimpleLineChart';


type TimeRange = 'week' | 'month' | 'quarter' | 'year' | 'custom';
type ChartType = 'invoices' | 'expenses' | 'balance';

interface KPIData {
  paid: number;
  unpaid: number;
  total: number;
  overdue: number;
}

interface ClientSales {
  clientId: number;
  clientName: string;
  amount: number;
  percentage: number;
}

export const DashboardScreen = () => {
  const navigation = useNavigation();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [chartType, setChartType] = useState<ChartType>('invoices');
  const [defaultCurrency, setDefaultCurrency] = useState<string>('USD');
  const [kpiData, setKpiData] = useState<KPIData>({
    paid: 0,
    unpaid: 0,
    total: 0,
    overdue: 0,
  });
  const [topClients, setTopClients] = useState<ClientSales[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any>({ invoices: [], expenses: [], balance: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      // Load default currency from settings
      const currency = await SettingsModel.getDefaultCurrency();
      setDefaultCurrency(currency);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Load all invoices
      const allInvoices = await InvoiceModel.getAll();
      
      // Filter invoices by date range
      const filteredInvoices = allInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.issued_date);
        return invoiceDate >= startDate && invoiceDate <= endDate;
      });

      // Calculate KPIs
      let paid = 0;
      let unpaid = 0;
      let overdue = 0;

      filteredInvoices.forEach(invoice => {
        const items = invoice.items || [];
        const total = items.reduce((sum: number, item: any) => sum + (item.qty * item.rate), 0);
        
        if (invoice.status === 'paid') {
          paid += total;
        } else {
          unpaid += total;
          
          if (invoice.due_date && new Date(invoice.due_date) < new Date()) {
            overdue += total;
          }
        }
      });

      setKpiData({
        paid,
        unpaid,
        total: paid + unpaid,
        overdue,
      });

      // Calculate top clients
      const clientTotals: { [key: string]: { name: string; amount: number } } = {};
      
      filteredInvoices.forEach(invoice => {
        const clientName = (invoice as any).client_name || 'Unknown';
        const items = invoice.items || [];
        const total = items.reduce((sum: number, item: any) => sum + (item.qty * item.rate), 0);
        
        if (!clientTotals[clientName]) {
          clientTotals[clientName] = { name: clientName, amount: 0 };
        }
        clientTotals[clientName].amount += total;
      });

      const sortedClients = Object.values(clientTotals)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map((client, index) => ({
          clientId: index,
          clientName: client.name,
          amount: client.amount,
          percentage: kpiData.total > 0 ? (client.amount / kpiData.total) * 100 : 0,
        }));

      setTopClients(sortedClients);

      // Calculate chart data
      const chartPoints = calculateChartData(filteredInvoices, timeRange);
      setChartData(chartPoints);

      // Get recent invoices (last 5)
      const recent = allInvoices
        .sort((a, b) => new Date(b.issued_date).getTime() - new Date(a.issued_date).getTime())
        .slice(0, 5);
      
      setRecentInvoices(recent);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange]);

  const calculateChartData = (invoices: any[], range: TimeRange) => {
    // Create time buckets based on range
    const endDate = new Date();
    const startDate = new Date();
    const periods: { [key: string]: { invoices: number; expenses: number } } = {};
    const labels: string[] = [];
    
    switch (range) {
      case 'week':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const label = date.toLocaleDateString('en', { weekday: 'short' });
          labels.push(label);
          periods[label] = { invoices: 0, expenses: 0 };
        }
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const label = `Week ${4 - i}`;
          labels.push(label);
          periods[label] = { invoices: 0, expenses: 0 };
        }
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'quarter':
        // Last 3 months
        for (let i = 2; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const label = date.toLocaleDateString('en', { month: 'short' });
          labels.push(label);
          periods[label] = { invoices: 0, expenses: 0 };
        }
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        // Last 12 months
        for (let i = 11; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const label = date.toLocaleDateString('en', { month: 'short' });
          labels.push(label);
          periods[label] = { invoices: 0, expenses: 0 };
        }
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    // Aggregate invoice data into buckets
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.issued_date);
      const items = invoice.items || [];
      const total = items.reduce((sum: number, item: any) => sum + (item.qty * item.rate), 0);
      
      // Find the right bucket based on range
      let bucketLabel = '';
      
      if (range === 'week') {
        // Match to day of week
        bucketLabel = invoiceDate.toLocaleDateString('en', { weekday: 'short' });
      } else if (range === 'month') {
        // Calculate which week the invoice falls into
        const weekNumber = Math.floor((endDate.getTime() - invoiceDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weekNumber >= 0 && weekNumber < 4) {
          bucketLabel = `Week ${4 - weekNumber}`;
        }
      } else if (range === 'quarter' || range === 'year') {
        // Match to month
        bucketLabel = invoiceDate.toLocaleDateString('en', { month: 'short' });
      }
      
      if (periods[bucketLabel]) {
        periods[bucketLabel].invoices += total;
      }
    });
    
    // Create chart data arrays
    const invoiceData = labels.map((label, index) => ({
      x: index,
      y: periods[label].invoices,
      label: label,
      value: periods[label].invoices,
    }));
    
    // Mock expense data (30% of invoices)
    const expenseData = labels.map((label, index) => ({
      x: index,
      y: periods[label].invoices * 0.3,
      label: label,
      value: periods[label].invoices * 0.3,
    }));
    
    // Calculate balance (invoices - expenses)
    const balanceData = labels.map((label, index) => ({
      x: index,
      y: periods[label].invoices * 0.7,
      label: label,
      value: periods[label].invoices * 0.7,
    }));
    
    return { invoices: invoiceData, expenses: expenseData, balance: balanceData };
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const handleCreateInvoice = () => {
    (navigation as any).navigate('InvoiceDetail', {});
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const renderKPICard = (title: string, value: number, icon: string, color: string) => (
    <TouchableOpacity style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <Ionicons name={icon as any} size={20} color={color} />
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={styles.kpiValue}>{formatCurrency(value, defaultCurrency)}</Text>
    </TouchableOpacity>
  );

  const renderTimeRangeChips = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.chipsContainer}
    >
      {(['week', 'month', 'quarter', 'year'] as TimeRange[]).map(range => (
        <TouchableOpacity
          key={range}
          style={[
            styles.chip,
            timeRange === range && styles.chipActive
          ]}
          onPress={() => setTimeRange(range)}
        >
          <Text style={[
            styles.chipText,
            timeRange === range && styles.chipTextActive
          ]}>
            {range === 'week' ? 'This Week' : 
             range === 'month' ? 'This Month' :
             range === 'quarter' ? 'Quarter' : 'Year'}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderChart = () => {
    const currentData = chartData[chartType] || [];
    const chartColor = chartType === 'invoices' ? Colors.primary : 
                       chartType === 'expenses' ? Colors.warning : 
                       Colors.success;
    
    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <View style={styles.chartToggle}>
            {(['invoices', 'expenses', 'balance'] as ChartType[]).map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chartToggleButton,
                  chartType === type && styles.chartToggleButtonActive
                ]}
                onPress={() => setChartType(type)}
              >
                <Text style={[
                  styles.chartToggleText,
                  chartType === type && styles.chartToggleTextActive
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <SimpleLineChart
          data={currentData}
          color={chartColor}
          showGrid={true}
          formatValue={(value) => {
            if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}k`;
            }
            return value.toFixed(0);
          }}
        />
      </View>
    );
  };

  const renderTopClients = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Clients</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Clients')}>
          <Text style={styles.sectionAction}>View all</Text>
        </TouchableOpacity>
      </View>
      {topClients.length === 0 ? (
        <Text style={styles.emptyText}>No client data yet</Text>
      ) : (
        topClients.map((client) => (
          <View key={client.clientId} style={styles.clientRow}>
            <Text style={styles.clientName} numberOfLines={1}>
              {client.clientName}
            </Text>
            <View style={styles.clientStats}>
              <Text style={styles.clientAmount}>
                {formatCurrency(client.amount, defaultCurrency)}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(client.percentage, 100)}%` }
                  ]}
                />
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const renderRecentInvoices = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Invoices</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Invoices')}>
          <Text style={styles.sectionAction}>See all</Text>
        </TouchableOpacity>
      </View>
      {recentInvoices.length === 0 ? (
        <Text style={styles.emptyText}>No invoices yet</Text>
      ) : (
        recentInvoices.map((invoice) => (
          <TouchableOpacity 
            key={invoice.id}
            style={styles.invoiceRow}
            onPress={() => (navigation as any).navigate('InvoiceDetail', { invoiceId: invoice.id })}
          >
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceNumber}>#{invoice.number}</Text>
              <Text style={styles.invoiceClient} numberOfLines={1}>
                {(invoice as any).client_name || 'Unknown'}
              </Text>
            </View>
            <View style={styles.invoiceStats}>
              <Text style={styles.invoiceAmount}>
                {formatCurrency(
                  invoice.items?.reduce((sum: number, item: any) => 
                    sum + (item.qty * item.rate), 0) || 0,
                  invoice.currency_code
                )}
              </Text>
              <View style={[
                styles.statusBadge,
                invoice.status === 'paid' ? styles.statusPaid : styles.statusUnpaid
              ]}>
                <Text style={styles.statusText}>
                  {invoice.status || 'unpaid'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = kpiData.total === 0 && recentInvoices.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <TouchableOpacity onPress={() => (navigation as any).navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
          />
        }
      >
        {renderTimeRangeChips()}

        <View style={styles.kpiContainer}>
          {renderKPICard('Paid', kpiData.paid, 'checkmark-circle', Colors.success)}
          {renderKPICard('Unpaid', kpiData.unpaid, 'time-outline', Colors.warning)}
          {renderKPICard('Total', kpiData.total, 'wallet-outline', Colors.primary)}
        </View>

        {isEmpty ? (
          <EmptyState
            icon="bar-chart-outline"
            title="No activity yet"
            subtitle="Create your first invoice to see analytics"
            actionLabel="Create Invoice"
            onAction={handleCreateInvoice}
          />
        ) : (
          <>
            {renderChart()}
            {renderTopClients()}
            {renderRecentInvoices()}
          </>
        )}
      </ScrollView>

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
  content: {
    flex: 1,
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
  chipsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.backgroundTertiary,
    marginRight: Spacing.sm,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },
  chipTextActive: {
    color: Colors.white,
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  kpiTitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    fontWeight: Typography.weights.medium,
  },
  kpiValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartHeader: {
    marginBottom: Spacing.md,
  },
  chartToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  chartToggleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
  },
  chartToggleButtonActive: {
    backgroundColor: Colors.white,
  },
  chartToggleText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  chartToggleTextActive: {
    color: Colors.primary,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    marginTop: Spacing.md,
    fontSize: Typography.sizes.sm,
    color: Colors.textLight,
  },
  section: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  },
  sectionAction: {
    fontSize: Typography.sizes.sm,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  emptyText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  clientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  clientName: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    marginRight: Spacing.md,
  },
  clientStats: {
    alignItems: 'flex-end',
  },
  clientAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  progressBar: {
    width: 80,
    height: 4,
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  invoiceClient: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  invoiceStats: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusPaid: {
    backgroundColor: `${Colors.success}20`,
  },
  statusUnpaid: {
    backgroundColor: `${Colors.warning}20`,
  },
  statusText: {
    fontSize: Typography.sizes.xs,
    color: Colors.text,
    textTransform: 'capitalize',
  },
});