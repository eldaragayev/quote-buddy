import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../styles/theme';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient?: string[];
  comingSoon?: boolean;
  badge?: string;
}

const tools: Tool[] = [
  {
    id: 'ai-agent',
    title: 'AI Assistant',
    description: 'Create invoices, track expenses, and manage your business with voice and natural language',
    icon: 'sparkles',
    gradient: ['#000000', '#333333'],
    badge: 'NEW',
    comingSoon: true,
  },
  {
    id: 'estimates',
    title: 'Estimates',
    description: 'Create professional estimates and convert them to invoices',
    icon: 'document-text-outline',
    comingSoon: true,
  },
  {
    id: 'expenses',
    title: 'Expenses',
    description: 'Track expenses with receipt scanning and categorization',
    icon: 'receipt-outline',
    comingSoon: true,
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Financial insights, P&L statements, and analytics',
    icon: 'trending-up-outline',
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Tools</Text>
        <Text style={styles.subtitle}>Powerful features for your business</Text>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Tool */}
        {tools[0] && (
          <TouchableOpacity
            style={styles.featuredCard}
            onPress={() => handleToolPress(tools[0])}
            activeOpacity={0.7}
          >
            <View style={styles.featuredGradient}>
              <View style={styles.featuredHeader}>
                <Ionicons name={tools[0].icon as any} size={32} color={Colors.white} />
                {tools[0].badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{tools[0].badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.featuredTitle}>{tools[0].title}</Text>
              <Text style={styles.featuredDescription}>
                {tools[0].description}
              </Text>
              {tools[0].comingSoon && (
                <View style={styles.featuredComingSoon}>
                  <Ionicons name="time-outline" size={16} color={Colors.white} />
                  <Text style={styles.featuredComingSoonText}>Coming Soon</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Regular Tools Grid */}
        <View style={styles.grid}>
          {tools.slice(1).map((tool) => (
            <TouchableOpacity
              key={tool.id}
              style={styles.toolCard}
              onPress={() => handleToolPress(tool)}
              activeOpacity={0.7}
            >
              <View style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name={tool.icon as any} size={24} color={Colors.text} />
                </View>
                <View style={styles.toolInfo}>
                  <Text style={styles.toolTitle}>{tool.title}</Text>
                  <Text style={styles.toolDescription} numberOfLines={2}>
                    {tool.description}
                  </Text>
                </View>
                {tool.comingSoon && (
                  <View style={styles.comingSoonLabel}>
                    <Text style={styles.comingSoonText}>Soon</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  featuredCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadow.lg,
  },
  featuredGradient: {
    backgroundColor: Colors.black,
    padding: Spacing.xl,
  },
  featuredHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  badge: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.md,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.black,
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    color: Colors.white,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  featuredDescription: {
    fontSize: Typography.sizes.base,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: Typography.sizes.base * 1.5,
  },
  featuredComingSoon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  featuredComingSoonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.white,
    opacity: 0.8,
  },
  grid: {
    paddingHorizontal: Spacing.lg,
  },
  toolCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    position: 'relative',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  toolInfo: {
    flex: 1,
  },
  toolTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.2,
  },
  toolDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * 1.4,
  },
  comingSoonLabel: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  comingSoonText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weights.medium,
  },
});