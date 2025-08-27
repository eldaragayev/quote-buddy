import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../styles/theme';

interface DueDatePickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (days: number | null, customDate?: Date) => void;
  currentDate: Date;
}

export const DueDatePicker: React.FC<DueDatePickerProps> = ({
  isVisible,
  onClose,
  onSelect,
  currentDate,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(currentDate);

  const presetOptions = [
    { label: 'Due on Receipt', days: 0, icon: 'flash-outline' },
    { label: 'Net 7', days: 7, icon: 'calendar-outline' },
    { label: 'Net 14', days: 14, icon: 'calendar-outline' },
    { label: 'Net 30', days: 30, icon: 'calendar-outline' },
    { label: 'Custom Date', days: null, icon: 'create-outline' },
  ];

  const handlePresetSelect = (days: number | null) => {
    if (days === null) {
      setShowDatePicker(true);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + days);
      onSelect(days, newDate);
      onClose();
    }
  };

  const handleCustomDateSelect = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      if (Platform.OS === 'android') {
        onSelect(null, date);
        onClose();
      }
    }
  };

  const confirmCustomDate = () => {
    onSelect(null, selectedDate);
    onClose();
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment Terms</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.optionsContainer, showDatePicker && { display: 'none' }]}>
          {presetOptions.map((option) => (
            <TouchableOpacity
              key={option.label}
              style={styles.optionCard}
              onPress={() => handlePresetSelect(option.days)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionIcon}>
                  <Ionicons name={option.icon as any} size={24} color={Colors.text} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  {option.days !== null && (
                    <Text style={styles.optionDescription}>
                      {option.days === 0 ? 'Payment due immediately' : `Payment due in ${option.days} days`}
                    </Text>
                  )}
                  {option.days === null && (
                    <Text style={styles.optionDescription}>
                      Select a specific due date
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {showDatePicker && Platform.OS === 'ios' && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handleCustomDateSelect}
              minimumDate={currentDate}
              themeVariant="light"
            />
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={confirmCustomDate}
            >
              <Text style={styles.confirmButtonText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        )}

        {showDatePicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleCustomDateSelect}
            minimumDate={currentDate}
            themeVariant="light"
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.xl,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.semibold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  optionsContainer: {
    paddingVertical: Spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.text,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
  datePickerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  confirmButton: {
    backgroundColor: Colors.black,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  confirmButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
});