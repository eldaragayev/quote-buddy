import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../styles/theme';
import { Client } from '../../types/database';

interface ClientCardProps {
  client: Client;
  onPress: () => void;
  onDelete: () => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onPress, onDelete }) => {
  const handleLongPress = () => {
    Alert.alert(
      'Client Actions',
      undefined,
      [
        { text: 'Edit', onPress },
        { 
          text: 'Delete', 
          onPress: onDelete,
          style: 'destructive'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.nameSection}>
            <Text style={styles.name}>{client.name}</Text>
            {client.company_name && (
              <View style={styles.companyBadge}>
                <Ionicons name="business" size={12} color={Colors.textSecondary} />
                <Text style={styles.company}>{client.company_name}</Text>
              </View>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </View>
        
        <View style={styles.details}>
          {client.email && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="mail-outline" size={16} color={Colors.textSecondary} />
              </View>
              <Text style={styles.detailText} numberOfLines={1}>{client.email}</Text>
            </View>
          )}
          {client.phone && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="call-outline" size={16} color={Colors.textSecondary} />
              </View>
              <Text style={styles.detailText}>{client.phone}</Text>
            </View>
          )}
          {client.address && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
              </View>
              <Text style={styles.detailText} numberOfLines={1}>{client.address}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  nameSection: {
    flex: 1,
  },
  name: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  companyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
  },
  company: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
  details: {
    marginTop: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  detailIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  detailText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    flex: 1,
    letterSpacing: -0.1,
  },
});