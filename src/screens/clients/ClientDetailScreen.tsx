import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../../styles/theme';
import { ClientModel } from '../../models/ClientModel';
import { Client } from '../../types/database';

type ClientStackParamList = {
  ClientsList: undefined;
  ClientDetail: { clientId?: number };
};

type NavigationProp = StackNavigationProp<ClientStackParamList, 'ClientDetail'>;
type RoutePropType = RouteProp<ClientStackParamList, 'ClientDetail'>;

export const ClientDetailScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const clientId = route.params?.clientId;
  const isEditMode = !!clientId;

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (clientId) {
      loadClient(clientId);
    }
  }, [clientId]);

  const loadClient = async (id: number) => {
    try {
      const client = await ClientModel.getById(id);
      if (client) {
        setName(client.name);
        setCompanyName(client.company_name || '');
        setContactName(client.contact_name || '');
        setEmail(client.email || '');
        setPhone(client.phone || '');
        setBillingAddress(client.billing_address || '');
        setShippingAddress(client.shipping_address || '');
        setTags(client.tags || '');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load client');
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    setLoading(true);
    try {
      const clientData: Omit<Client, 'id'> = {
        name: name.trim(),
        company_name: companyName.trim() || undefined,
        contact_name: contactName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        billing_address: billingAddress.trim() || undefined,
        shipping_address: shippingAddress.trim() || undefined,
        tags: tags.trim() || undefined,
      };

      if (isEditMode && clientId) {
        await ClientModel.update(clientId, clientData);
      } else {
        await ClientModel.create(clientData);
      }

      navigation.navigate('ClientsList' as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  const handleShowActions = () => {
    if (!isEditMode) return;
    
    Alert.alert(
      'Client Actions',
      undefined,
      [
        {
          text: 'Delete Client',
          onPress: () => {
            Alert.alert(
              'Delete Client',
              'Are you sure you want to delete this client?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    if (clientId) {
                      try {
                        await ClientModel.delete(clientId);
                        navigation.goBack();
                      } catch (error) {
                        Alert.alert('Error', 'Failed to delete client');
                      }
                    }
                  }
                }
              ]
            );
          },
          style: 'destructive'
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEditMode ? 'Edit Client' : 'New Client'}
        </Text>
        {isEditMode && (
          <TouchableOpacity onPress={handleShowActions}>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.text} />
          </TouchableOpacity>
        )}
        {!isEditMode && <View style={{ width: 24 }} />}
      </View>

      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Client name"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Company</Text>
              <TextInput
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                placeholder="Company name (optional)"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Contact Name</Text>
              <TextInput
                style={styles.input}
                value={contactName}
                onChangeText={setContactName}
                placeholder="Contact person (optional)"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="client@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+1 234 567 8900"
                keyboardType="phone-pad"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Addresses</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Billing Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={billingAddress}
                onChangeText={setBillingAddress}
                placeholder="Enter billing address"
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Shipping Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={shippingAddress}
                onChangeText={setShippingAddress}
                placeholder="Enter shipping address"
                multiline
                numberOfLines={3}
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            
            <View style={styles.field}>
              <Text style={styles.label}>Tags</Text>
              <TextInput
                style={styles.input}
                value={tags}
                onChangeText={setTags}
                placeholder="Tags (comma-separated)"
                placeholderTextColor={Colors.textLight}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Ionicons 
              name={loading ? "hourglass-outline" : isEditMode ? "checkmark" : "add"} 
              size={20} 
              color={Colors.white} 
            />
            <Text style={styles.primaryButtonText}>
              {loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Client'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
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
    paddingBottom: 120,
  },
  section: {
    backgroundColor: Colors.white,
    marginBottom: 0,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.sizes.sm,
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontWeight: Typography.weights.medium,
  },
  input: {
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.sizes.base,
    color: Colors.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: Spacing.xl,
    right: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Colors.black,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  primaryButtonText: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});