import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';
import { popularCurrencies, Currency } from '../../utils/currencies';

interface CurrencySelectorProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (currency: string) => void;
  selectedCurrency: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  isVisible,
  onClose,
  onSelect,
  selectedCurrency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState(popularCurrencies);

  useEffect(() => {
    if (searchQuery) {
      const filtered = popularCurrencies.filter(
        currency =>
          currency.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          currency.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCurrencies(filtered);
    } else {
      setFilteredCurrencies(popularCurrencies);
    }
  }, [searchQuery]);

  const renderCurrency = ({ item }: { item: Currency }) => {
    const isSelected = selectedCurrency === item.code;
    
    return (
      <TouchableOpacity
        style={[styles.currencyItem, isSelected && styles.currencyItemSelected]}
        onPress={() => {
          onSelect(item.code);
          onClose();
        }}
      >
        <View style={styles.currencyInfo}>
          <Text style={styles.currencyCode}>
            {item.code} ({item.symbol})
          </Text>
          <Text style={styles.currencyName}>{item.name}</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Currency</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search currencies..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <FlatList
          data={filteredCurrencies}
          keyExtractor={(item) => item.code}
          renderItem={renderCurrency}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No currencies found</Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    height: '70%',
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundTertiary,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  currencyItemSelected: {
    backgroundColor: Colors.backgroundSecondary,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  currencyName: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  emptyState: {
    padding: Spacing.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
  },
});