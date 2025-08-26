import { db } from '../database/database';
import { Issuer } from '../types/database';

export class IssuerModel {
  static async create(issuer: Omit<Issuer, 'id'>): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO issuers (company_name, contact_name, email, phone, address, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        issuer.company_name || null,
        issuer.contact_name || null,
        issuer.email || null,
        issuer.phone || null,
        issuer.address || null,
        issuer.is_default || 0
      ]
    );
    
    if (issuer.is_default) {
      await db.runAsync(
        'UPDATE issuers SET is_default = 0 WHERE id != ?',
        [result.lastInsertRowId]
      );
    }
    
    return Number(result.lastInsertRowId);
  }

  static async getAll(): Promise<Issuer[]> {
    const issuers = await db.getAllAsync<Issuer>(
      'SELECT * FROM issuers ORDER BY is_default DESC, company_name'
    );
    return issuers;
  }

  static async getById(id: number): Promise<Issuer | null> {
    const issuer = await db.getFirstAsync<Issuer>(
      'SELECT * FROM issuers WHERE id = ?',
      [id]
    );
    return issuer || null;
  }

  static async getDefault(): Promise<Issuer | null> {
    const issuer = await db.getFirstAsync<Issuer>(
      'SELECT * FROM issuers WHERE is_default = 1'
    );
    return issuer || null;
  }

  static async update(id: number, issuer: Partial<Issuer>): Promise<void> {
    const fields = Object.keys(issuer)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(issuer)
      .filter(key => key !== 'id')
      .map(key => (issuer as any)[key]);
    
    values.push(id);
    
    await db.runAsync(
      `UPDATE issuers SET ${fields} WHERE id = ?`,
      values
    );
    
    if (issuer.is_default) {
      await db.runAsync(
        'UPDATE issuers SET is_default = 0 WHERE id != ?',
        [id]
      );
    }
  }

  static async setDefault(id: number): Promise<void> {
    await db.runAsync('UPDATE issuers SET is_default = 0');
    await db.runAsync('UPDATE issuers SET is_default = 1 WHERE id = ?', [id]);
  }

  static async delete(id: number): Promise<void> {
    await db.runAsync('DELETE FROM issuers WHERE id = ?', [id]);
  }
}