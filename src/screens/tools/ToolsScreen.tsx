import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  comingSoon?: boolean;
}

const tools: Tool[] = [
  {
    id: 'estimates',
    title: 'Estimates',
    description: 'Create and manage estimates for your clients',
    icon: 'document-text-outline',
    color: Colors.primary,
    comingSoon: true,
  },
  {
    id: 'expenses',
    title: 'Expenses',
    description: 'Track your business expenses and receipts',
    icon: 'receipt-outline',
    color: Colors.warning,
    comingSoon: true,
  },
  {
    id: 'pnl',
    title: 'P&L Statement',
    description: 'View your profit and loss statement',
    icon: 'analytics-outline',
    color: Colors.success,
    comingSoon: true,
  },
  {
    id: 'ai-agent',
    title: 'AI Agent',
    description: 'Ask about anything! Upload photos, record audio, create documents from voice',
    icon: 'chatbubble-ellipses-outline',
    color: Colors.primaryDark,
    comingSoon: true,
  },
];

export const ToolsScreen = () => {
  const handleToolPress = (tool: Tool) => {
    if (tool.comingSoon) {
      Alert.alert(
        'Coming Soon',
        `${tool.title} feature will be available in the next update!`,
        [{ text: 'OK' }]
      );
    }
    // Navigate to tool screen when implemented
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tools</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <View style={styles.grid}>
          {tools.map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => handleToolPress(tool)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${tool.color}20` }]}>
                <Ionicons name={tool.icon as any} size={32} color={tool.color} />
              </View>
              <Text style={styles.toolTitle}>{tool.title}</Text>
              <Text style={styles.toolDescription} numberOfLines={2}>
                {tool.description}
              </Text>
              {tool.comingSoon && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="bulb-outline" size={24} color={Colors.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Pro Tip</Text>
              <Text style={styles.infoText}>
                The AI Agent will help you create invoices, estimates, and track expenses using natural language and voice commands.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  toolCard: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  toolTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  toolDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * 1.4,
  },
  comingSoonBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  comingSoonText: {
    fontSize: Typography.sizes.xs,
    color: Colors.primary,
    fontWeight: Typography.weights.medium,
  },
  infoSection: {
    padding: Spacing.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * 1.5,
  },
});