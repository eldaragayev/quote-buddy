import { db } from '../database/database';
import { Tax } from '../types/database';

export class TaxModel {
  static async create(tax: Omit<Tax, 'id'>): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO taxes (name, rate_percent, is_default) VALUES (?, ?, ?)`,
      [tax.name, tax.rate_percent, tax.is_default || 0]
    );
    
    // If this is set as default, update settings
    if (tax.is_default) {
      const taxId = Number(result.lastInsertRowId);
      await this.setDefault(taxId);
    }
    
    return Number(result.lastInsertRowId);
  }

  static async getAll(): Promise<Tax[]> {
    const taxes = await db.getAllAsync<Tax>(
      'SELECT * FROM taxes ORDER BY name'
    );
    return taxes;
  }

  static async getById(id: number): Promise<Tax | null> {
    const tax = await db.getFirstAsync<Tax>(
      'SELECT * FROM taxes WHERE id = ?',
      [id]
    );
    return tax || null;
  }

  static async update(id: number, tax: Partial<Tax>): Promise<void> {
    // Handle is_default separately to avoid conflicts
    const { is_default, ...taxData } = tax;
    
    const fields = Object.keys(taxData)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(taxData)
      .filter(key => key !== 'id')
      .map(key => (taxData as any)[key]);
    
    if (fields) {
      values.push(id);
      await db.runAsync(
        `UPDATE taxes SET ${fields} WHERE id = ?`,
        values
      );
    }
    
    // Handle default setting separately if needed
    if (is_default === 1) {
      await this.setDefault(id);
    } else if (is_default === 0) {
      // If explicitly setting to not default, just update the field
      await db.runAsync('UPDATE taxes SET is_default = 0 WHERE id = ?', [id]);
    }
  }

  static async delete(id: number): Promise<void> {
    await db.runAsync('DELETE FROM taxes WHERE id = ?', [id]);
  }

  static async setDefault(taxId: number): Promise<void> {
    // First, unset all other taxes as default
    await db.runAsync('UPDATE taxes SET is_default = 0 WHERE is_default = 1');
    
    // Set this tax as default
    await db.runAsync('UPDATE taxes SET is_default = 1 WHERE id = ?', [taxId]);
    
    // Update settings with the default tax
    const { SettingsModel } = await import('./SettingsModel');
    const settings = await SettingsModel.get();
    await SettingsModel.createOrUpdate({
      ...settings,
      default_tax_id: taxId
    });
  }

  static async getDefault(): Promise<Tax | null> {
    const tax = await db.getFirstAsync<Tax>(
      'SELECT * FROM taxes WHERE is_default = 1 LIMIT 1'
    );
    return tax || null;
  }
}