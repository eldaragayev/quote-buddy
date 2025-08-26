import { db } from '../database/database';
import { Tax } from '../types/database';

export class TaxModel {
  static async create(tax: Omit<Tax, 'id'>): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO taxes (name, rate_percent) VALUES (?, ?)`,
      [tax.name, tax.rate_percent]
    );
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
    const fields = Object.keys(tax)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(tax)
      .filter(key => key !== 'id')
      .map(key => (tax as any)[key]);
    
    values.push(id);
    
    await db.runAsync(
      `UPDATE taxes SET ${fields} WHERE id = ?`,
      values
    );
  }

  static async delete(id: number): Promise<void> {
    await db.runAsync('DELETE FROM taxes WHERE id = ?', [id]);
  }
}