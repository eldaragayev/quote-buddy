import { SettingsModel } from '../models/SettingsModel';
import { IssuerModel } from '../models/IssuerModel';
import { TaxModel } from '../models/TaxModel';

/**
 * Initialize default data for the app
 * This is called only once when the database is first created
 */
export const initializeDefaultData = async () => {
  try {
    // 1. Check and create default settings
    const existingSettings = await SettingsModel.get();
    if (!existingSettings) {
      // Creating default settings
      await SettingsModel.createOrUpdate({
        default_currency_code: 'USD'
      });
    }

    // 2. Check and create default issuer
    const existingIssuers = await IssuerModel.getAll();
    if (existingIssuers.length === 0) {
      // Creating default issuer
      await IssuerModel.create({
        company_name: 'My Company',
        contact_name: 'John Doe',
        email: 'john@mycompany.com',
        phone: '+1 234 567 8900',
        address: '123 Business St\nCity, State 12345',
        is_default: 1
      });
    } else {
      // Ensure at least one issuer is marked as default
      const defaultIssuer = await IssuerModel.getDefault();
      if (!defaultIssuer && existingIssuers.length > 0) {
        // Setting first issuer as default
        const firstIssuer = existingIssuers[0];
        if (firstIssuer.id) {
          await IssuerModel.setDefault(firstIssuer.id);
        }
      }
    }

    // 3. Create some common tax rates if none exist
    const existingTaxes = await TaxModel.getAll();
    if (existingTaxes.length === 0) {
      // Creating default tax rates
      
      // Add common tax rates
      const commonTaxes = [
        { name: 'VAT Standard', rate_percent: 20 },
        { name: 'VAT Reduced', rate_percent: 10 },
        { name: 'Sales Tax', rate_percent: 8.5 },
        { name: 'GST', rate_percent: 5 },
      ];

      for (const tax of commonTaxes) {
        await TaxModel.create(tax);
      }
    }

    // Default data initialized successfully
  } catch (error) {
    // Failed to initialize default data
    throw error;
  }
};

/**
 * Check if this is the first run of the app
 * @returns true if this is the first run, false otherwise
 */
export const isFirstRun = async (): Promise<boolean> => {
  try {
    const settings = await SettingsModel.get();
    const issuers = await IssuerModel.getAll();
    
    // If no settings and no issuers, it's a first run
    return !settings && issuers.length === 0;
  } catch (error) {
    // Failed to check first run status
    return true; // Assume first run on error to ensure initialization
  }
};