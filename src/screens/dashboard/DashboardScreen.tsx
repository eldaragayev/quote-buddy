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
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../styles/theme';
import { InvoiceModel } from '../../models/InvoiceModel';
import { SettingsModel } from '../../models/SettingsModel';
import { formatCurrency } from '../../utils/formatters';
import { SimpleLineChart } from '../../components/charts/SimpleLineChart';

type TimeRange = 'week' | 'month' | 'year';

interface KPIData {
  revenue: number;
  pending: number;
  overdue: number;
  invoiceCount: number;
}

export const DashboardScreen = () => {
  const navigation = useNavigation();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [defaultCurrency, setDefaultCurrency] = useState<string>('USD');
  const [kpiData, setKpiData] = useState<KPIData>({
    revenue: 0,
    pending: 0,
    overdue: 0,
    invoiceCount: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
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
      let revenue = 0;
      let pending = 0;
      let overdue = 0;
      let invoiceCount = filteredInvoices.length;

      filteredInvoices.forEach(invoice => {
        const items = invoice.items || [];
        const total = items.reduce((sum: number, item: any) => sum + (item.qty * item.rate), 0);
        
        if (invoice.status === 'paid') {
          revenue += total;
        } else {
          pending += total;
          
          if (invoice.due_date && new Date(invoice.due_date) < new Date()) {
            overdue += total;
          }
        }
      });

      setKpiData({
        revenue,
        pending,
        overdue,
        invoiceCount,
      });

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
    const endDate = new Date();
    const periods: { [key: string]: number } = {};
    const labels: string[] = [];
    
    switch (range) {
      case 'week':
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const label = date.toLocaleDateString('en', { weekday: 'short' });
          labels.push(label);
          periods[label] = 0;
        }
        break;
      case 'month':
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const label = `W${4 - i}`;
          labels.push(label);
          periods[label] = 0;
        }
        break;
      case 'year':
        // Last 12 months (show every 3rd month)
        for (let i = 11; i >= 0; i -= 3) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const label = date.toLocaleDateString('en', { month: 'short' });
          labels.push(label);
          periods[label] = 0;
        }
        break;
    }
    
    // Aggregate invoice data into buckets
    invoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.issued_date);
      const items = invoice.items || [];
      const total = items.reduce((sum: number, item: any) => sum + (item.qty * item.rate), 0);
      
      let bucketLabel = '';
      
      if (range === 'week') {
        bucketLabel = invoiceDate.toLocaleDateString('en', { weekday: 'short' });
      } else if (range === 'month') {
        const weekNumber = Math.floor((endDate.getTime() - invoiceDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weekNumber >= 0 && weekNumber < 4) {
          bucketLabel = `W${4 - weekNumber}`;
        }
      } else if (range === 'year') {
        bucketLabel = invoiceDate.toLocaleDateString('en', { month: 'short' });
      }
      
      if (periods[bucketLabel] !== undefined) {
        periods[bucketLabel] += total;
      }
    });
    
    // Create chart data array
    return labels.map((label, index) => ({
      x: index,
      y: periods[label],
      label: label,
      value: periods[label],
    }));
  };

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const handleCreateInvoice = () => {
    // Navigate to Invoices tab and then to InvoiceDetail
    (navigation as any).navigate('Invoices', {
      screen: 'InvoiceDetail',
      params: {}
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const formatAmount = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {(['week', 'month', 'year'] as TimeRange[]).map(range => (
        <TouchableOpacity
          key={range}
          style={[styles.timeRangeButton, timeRange === range && styles.timeRangeButtonActive]}
          onPress={() => setTimeRange(range)}
        >
          <Text style={[styles.timeRangeText, timeRange === range && styles.timeRangeTextActive]}>
            {range === 'week' ? '7D' : range === 'month' ? '30D' : '1Y'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.title}>Dashboard</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = kpiData.invoiceCount === 0 && recentInvoices.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.textSecondary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Welcome back</Text>
              <Text style={styles.title}>Dashboard</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => (navigation as any).navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          {renderTimeRangeSelector()}
        </View>

        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <Ionicons name="bar-chart-outline" size={48} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No data yet</Text>
              <Text style={styles.emptySubtitle}>Create your first invoice to see analytics</Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateInvoice}>
                <Text style={styles.createButtonText}>Create Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <View style={[styles.kpiCard, styles.kpiCardLarge]}>
                <View style={styles.kpiIcon}>
                  <Ionicons name="trending-up" size={24} color={Colors.black} />
                </View>
                <Text style={styles.kpiLabel}>Revenue</Text>
                <Text style={styles.kpiValue}>${formatAmount(kpiData.revenue)}</Text>
                <Text style={styles.kpiChange}>
                  {kpiData.invoiceCount} invoice{kpiData.invoiceCount !== 1 ? 's' : ''}
                </Text>
              </View>
              
              <View style={styles.kpiCardColumn}>
                <View style={styles.kpiCardSmall}>
                  <Text style={styles.kpiSmallLabel}>Pending</Text>
                  <Text style={styles.kpiSmallValue}>${formatAmount(kpiData.pending)}</Text>
                </View>
                <View style={[styles.kpiCardSmall, kpiData.overdue > 0 && styles.kpiCardDanger]}>
                  <Text style={[styles.kpiSmallLabel, kpiData.overdue > 0 && styles.textDanger]}>
                    Overdue
                  </Text>
                  <Text style={[styles.kpiSmallValue, kpiData.overdue > 0 && styles.textDanger]}>
                    ${formatAmount(kpiData.overdue)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Chart */}
            {chartData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Revenue Overview</Text>
                <SimpleLineChart
                  data={chartData}
                  color={Colors.black}
                  showGrid={true}
                  formatValue={formatAmount}
                />
              </View>
            )}

            {/* Recent Activity */}
            <View style={styles.activitySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity onPress={() => (navigation as any).navigate('Invoices', { screen: 'InvoicesList' })}>
                  <Text style={styles.sectionLink}>View all</Text>
                </TouchableOpacity>
              </View>

              {recentInvoices.map((invoice) => (
                <TouchableOpacity
                  key={invoice.id}
                  style={styles.activityItem}
                  onPress={() => (navigation as any).navigate('Invoices', { 
                    screen: 'InvoiceDetail', 
                    params: { invoiceId: invoice.id }
                  })}
                >
                  <View style={styles.activityIcon}>
                    <Ionicons 
                      name={invoice.status === 'paid' ? 'checkmark-circle' : 'time-outline'} 
                      size={20} 
                      color={invoice.status === 'paid' ? Colors.success : Colors.textSecondary} 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>
                      Invoice #{invoice.number}
                    </Text>
                    <Text style={styles.activitySubtitle}>
                      {(invoice as any).client_name || 'No client'}
                    </Text>
                  </View>
                  <View style={styles.activityRight}>
                    <Text style={styles.activityAmount}>
                      {formatCurrency(
                        invoice.items?.reduce((sum: number, item: any) => 
                          sum + (item.qty * item.rate), 0) || 0,
                        invoice.currency_code
                      )}
                    </Text>
                    <Text style={styles.activityDate}>
                      {new Date(invoice.issued_date).toLocaleDateString('en', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={handleCreateInvoice}
              >
                <Ionicons name="add-circle" size={24} color={Colors.white} />
                <Text style={styles.quickActionText}>New Invoice</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  settingsButton: {
    padding: Spacing.sm,
    marginTop: -Spacing.sm,
    marginRight: -Spacing.sm,
  },
  greeting: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.xxxl,
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
  timeRangeContainer: {
    flexDirection: 'row',
    marginTop: Spacing.lg,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  timeRangeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  timeRangeTextActive: {
    color: Colors.text,
    fontWeight: Typography.weights.semibold,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxxl,
  },
  emptyCard: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  createButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.black,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  createButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  kpiGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiCardLarge: {
    flex: 2,
  },
  kpiCardColumn: {
    flex: 1,
    gap: Spacing.md,
  },
  kpiCardSmall: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kpiCardDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kpiLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  kpiValue: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  kpiChange: {
    fontSize: Typography.sizes.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  kpiSmallLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiSmallValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  textDanger: {
    color: '#DC2626',
  },
  chartCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  activitySection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  sectionLink: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
  },
  activitySubtitle: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  activityRight: {
    alignItems: 'flex-end',
  },
  activityAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  activityDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  quickActionButton: {
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  quickActionText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
});