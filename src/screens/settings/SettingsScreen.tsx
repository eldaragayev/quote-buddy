import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
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
      console.error('Failed to load settings:', error);
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
      console.error('Failed to update currency:', error);
      Alert.alert('Error', 'Failed to update default currency');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingRow = (
    icon: string,
    label: string,
    value?: string,
    onPress?: () => void,
    showArrow = true
  ) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={20} color={Colors.primary} />
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {renderSection('Invoice Defaults', (
          <>
            {renderSettingRow(
              'business',
              'Default Issuer',
              defaultIssuer?.company_name || 'Not set',
              () => navigation.navigate('IssuerSettings' as any)
            )}
            {renderSettingRow(
              'cash-outline',
              'Default Currency',
              defaultCurrency,
              () => setShowCurrencySelector(true)
            )}
          </>
        ))}

        {renderSection('Business', (
          <>
            {renderSettingRow(
              'business-outline',
              'Manage Issuers',
              undefined,
              () => navigation.navigate('IssuerSettings' as any)
            )}
            {renderSettingRow(
              'calculator-outline',
              'Manage Taxes',
              undefined,
              () => navigation.navigate('TaxSettings' as any)
            )}
          </>
        ))}

        {renderSection('Data', (
          <>
            {renderSettingRow(
              'cloud-upload-outline',
              'Export Data',
              undefined,
              () => Alert.alert('Export', 'Export functionality coming soon')
            )}
            {renderSettingRow(
              'cloud-download-outline',
              'Import Data',
              undefined,
              () => Alert.alert('Import', 'Import functionality coming soon')
            )}
            {renderSettingRow(
              'archive-outline',
              'Backup',
              undefined,
              () => Alert.alert('Backup', 'Backup functionality coming soon')
            )}
          </>
        ))}

        {renderSection('About', (
          <>
            {renderSettingRow(
              'information-circle-outline',
              'Version',
              '1.0.0',
              undefined,
              false
            )}
            {renderSettingRow(
              'document-text-outline',
              'Terms & Privacy',
              undefined,
              () => Alert.alert('Terms', 'Terms and Privacy Policy')
            )}
          </>
        ))}
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
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingLabel: {
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settingValue: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
});