import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../styles/theme';
import { SettingsModel } from '../../models/SettingsModel';
import { IssuerModel } from '../../models/IssuerModel';
import { Settings, Issuer } from '../../types/database';
import { CurrencySelector } from '../../components/selectors/CurrencySelector';

type SettingsStackParamList = {
  Settings: undefined;
  TaxSettings: undefined;
  IssuerSettings: undefined;
  DefaultIssuer: undefined;
};

type NavigationProp = StackNavigationProp<SettingsStackParamList, 'Settings'>;

export const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [defaultIssuer, setDefaultIssuer] = useState<Issuer | null>(null);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await SettingsModel.get();
      if (settingsData) {
        setSettings(settingsData);
        setDefaultCurrency(settingsData.default_currency_code || 'USD');
      }

      const issuer = await IssuerModel.getDefault();
      setDefaultIssuer(issuer);
    } catch (error) {
      // Failed to load settings
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    try {
      await SettingsModel.createOrUpdate({
        default_currency_code: currency
      });
      setDefaultCurrency(currency);
      setShowCurrencySelector(false);
      // Reload settings to confirm the change was saved
      await loadSettings();
    } catch (error) {
      Alert.alert('Error', 'Failed to update default currency');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderSettingItem = (
    icon: string,
    label: string,
    value?: string,
    onPress?: () => void,
    color?: string,
    showArrow = true
  ) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, color && { backgroundColor: color + '15' }]}>
          <Ionicons name={icon as any} size={22} color={color || Colors.text} />
        </View>
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {value && <Text style={styles.settingValue}>{value}</Text>}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Settings Card */}
        <View style={styles.quickSettingsCard}>
          <Text style={styles.quickSettingsTitle}>Quick Settings</Text>
          
          <TouchableOpacity 
            style={styles.quickSettingItem}
            onPress={() => setShowCurrencySelector(true)}
          >
            <View style={styles.quickSettingInfo}>
              <Text style={styles.quickSettingLabel}>Default Currency</Text>
              <Text style={styles.quickSettingValue}>{defaultCurrency}</Text>
            </View>
            <View style={styles.quickSettingIcon}>
              <Ionicons name="cash-outline" size={20} color={Colors.text} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickSettingItem}
            onPress={() => navigation.navigate('IssuerSettings' as any)}
          >
            <View style={styles.quickSettingInfo}>
              <Text style={styles.quickSettingLabel}>Default Issuer</Text>
              <Text style={styles.quickSettingValue}>
                {defaultIssuer?.company_name || 'Not set'}
              </Text>
            </View>
            <View style={styles.quickSettingIcon}>
              <Ionicons name="business-outline" size={20} color={Colors.text} />
            </View>
          </TouchableOpacity>
        </View>

        {renderSection('Business', (
          <>
            {renderSettingItem(
              'business',
              'Manage Issuers',
              undefined,
              () => navigation.navigate('IssuerSettings' as any),
              Colors.text
            )}
            {renderSettingItem(
              'calculator',
              'Tax Settings',
              undefined,
              () => navigation.navigate('TaxSettings' as any),
              Colors.text
            )}
          </>
        ))}

        {renderSection('Data & Backup', (
          <>
            {renderSettingItem(
              'cloud-upload',
              'Export Data',
              undefined,
              () => Alert.alert('Coming Soon', 'Export functionality will be available soon'),
              '#10B981'
            )}
            {renderSettingItem(
              'cloud-download',
              'Import Data',
              undefined,
              () => Alert.alert('Coming Soon', 'Import functionality will be available soon'),
              '#3B82F6'
            )}
            {renderSettingItem(
              'shield-checkmark',
              'Backup',
              undefined,
              () => Alert.alert('Coming Soon', 'Backup functionality will be available soon'),
              '#8B5CF6'
            )}
          </>
        ))}

        {renderSection('Support', (
          <>
            {renderSettingItem(
              'help-circle',
              'Help & FAQ',
              undefined,
              () => Alert.alert('Help', 'Help documentation coming soon'),
              '#F59E0B'
            )}
            {renderSettingItem(
              'mail',
              'Contact Support',
              undefined,
              () => Alert.alert('Support', 'support@quotebuddy.app'),
              '#06B6D4'
            )}
          </>
        ))}

        {renderSection('About', (
          <>
            {renderSettingItem(
              'information-circle',
              'App Version',
              '1.0.0',
              undefined,
              Colors.textSecondary,
              false
            )}
            {renderSettingItem(
              'document-text',
              'Terms & Privacy',
              undefined,
              () => Alert.alert('Legal', 'Terms and Privacy Policy'),
              Colors.textSecondary
            )}
            {renderSettingItem(
              'star',
              'Rate App',
              undefined,
              () => Alert.alert('Rate Us', 'Thank you for your support!'),
              '#FBBF24'
            )}
          </>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Quote Buddy</Text>
          <Text style={styles.footerSubtext}>Made with ❤️ from London, UK</Text>
        </View>
      </ScrollView>

      <CurrencySelector
        isVisible={showCurrencySelector}
        onClose={() => setShowCurrencySelector(false)}
        onSelect={handleCurrencyChange}
        selectedCurrency={defaultCurrency}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
    paddingBottom: Spacing.xxxl,
  },
  quickSettingsCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.black,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.lg,
  },
  quickSettingsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  quickSettingInfo: {
    flex: 1,
  },
  quickSettingLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.white,
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  quickSettingValue: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  quickSettingIcon: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  sectionContent: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
    fontWeight: Typography.weights.medium,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settingValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  footerText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  footerSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
});