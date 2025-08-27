import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
import { formatCurrency } from '../../utils/formatters';

interface CurrencyTotal {
  currency: string;
  amount: number;
}

interface MultiCurrencyTotalProps {
  totals: CurrencyTotal[];
}

export const MultiCurrencyTotal: React.FC<MultiCurrencyTotalProps> = ({ totals }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Sort totals by amount (descending) and get the main one
  const sortedTotals = [...totals].sort((a, b) => b.amount - a.amount);
  const mainTotal = sortedTotals[0] || { currency: 'USD', amount: 0 };
  const otherTotals = sortedTotals.slice(1).filter(t => t.amount > 0);

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => otherTotals.length > 0 && setExpanded(!expanded)}
      activeOpacity={otherTotals.length > 0 ? 0.7 : 1}
    >
      <View style={styles.mainRow}>
        <Text style={styles.label}>Total:</Text>
        <View style={styles.totalContainer}>
          <Text style={styles.total}>
            {formatCurrency(mainTotal.amount, mainTotal.currency)}
          </Text>
          {otherTotals.length > 0 && (
            <Ionicons 
              name={expanded ? 'chevron-up' : 'chevron-down'} 
              size={16} 
              color={Colors.textSecondary}
            />
          )}
        </View>
      </View>
      
      {expanded && otherTotals.length > 0 && (
        <View style={styles.expandedContent}>
          {otherTotals.map(({ currency, amount }) => (
            <View key={currency} style={styles.currencyRow}>
              <Text style={styles.currencyLabel}>{currency}:</Text>
              <Text style={styles.currencyAmount}>
                {formatCurrency(amount, currency)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.lg,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  total: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  expandedContent: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  currencyLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  currencyAmount: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    letterSpacing: -0.2,
  },
});