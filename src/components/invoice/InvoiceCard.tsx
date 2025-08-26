import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
import { formatCurrency, formatShortDate, getDueText, formatInvoiceNumber } from '../../utils/formatters';
import { InvoiceWithClient } from '../../types/database';

interface InvoiceCardProps {
  invoice: InvoiceWithClient;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onTogglePaid?: () => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onPress, onEdit, onDelete, onTogglePaid }) => {
  const dueText = getDueText(invoice.due_date || null, invoice.status || 'unpaid');
  const isOverdue = dueText && dueText.includes('Overdue');
  const isPaid = invoice.status === 'paid';
  
  const getDueColor = () => {
    if (isPaid) return Colors.paid;
    if (isOverdue) return Colors.overdue;
    return Colors.textSecondary;
  };

  const calculateTotal = () => {
    const subtotal = invoice.items?.reduce((sum, item) => sum + (item.qty * item.rate), 0) || 0;
    
    let total = subtotal;
    
    // Apply discount
    if (invoice.discount_type && invoice.discount_value) {
      if (invoice.discount_type === 'percent') {
        total -= total * (invoice.discount_value / 100);
      } else {
        total -= invoice.discount_value;
      }
    }
    
    // Apply tax
    if ((invoice as any).tax_rate) {
      total += total * ((invoice as any).tax_rate / 100);
    }
    
    return total;
  };
  
  const total = calculateTotal();

  const handleLongPress = () => {
    const actions = [
      { text: 'Edit', onPress: onEdit || onPress },
      { 
        text: isPaid ? 'Mark as Unpaid' : 'Mark as Paid', 
        onPress: onTogglePaid
      },
      { 
        text: 'Delete', 
        onPress: onDelete,
        style: 'destructive' as const
      },
      { text: 'Cancel', style: 'cancel' as const }
    ];
    
    Alert.alert(
      `Invoice ${formatInvoiceNumber(invoice.number)}`,
      'Choose an action',
      actions
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <Text style={styles.clientName}>
          {(invoice as any).client_name || invoice.client?.name || 'No client'}
        </Text>
        <Text style={styles.details}>
          {formatInvoiceNumber(invoice.number)} • {formatShortDate(invoice.issued_date)}
        </Text>
      </View>
      
      <View style={styles.rightContent}>
        <Text style={styles.amount}>{formatCurrency(total, invoice.currency_code)}</Text>
        {dueText && (
          <Text style={[styles.dueText, { color: getDueColor() }]}>
            {dueText}
          </Text>
        )}
      </View>
      
      {isPaid && (
        <View style={styles.paidBadge}>
          <Text style={styles.paidText}>PAID</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leftContent: {
    flex: 1,
    justifyContent: 'center',
  },
  clientName: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  details: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  dueText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
  paidBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.paid,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  paidText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
  },
});