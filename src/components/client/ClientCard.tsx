import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
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
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={client.company_name ? "business" : "person"} 
          size={24} 
          color={Colors.primary} 
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name}>{client.name}</Text>
        {client.company_name && (
          <Text style={styles.company}>{client.company_name}</Text>
        )}
        <View style={styles.details}>
          {client.email && (
            <View style={styles.detailRow}>
              <Ionicons name="mail-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{client.email}</Text>
            </View>
          )}
          {client.phone && (
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{client.phone}</Text>
            </View>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  company: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  details: {
    marginTop: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  detailText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
  },
});