import { db } from '../database/database';
import { Client, ClientWithBalance } from '../types/database';

export class ClientModel {
  static async create(client: Omit<Client, 'id'>): Promise<number> {
    // Validate required fields
    if (!client.name || client.name.trim().length === 0) {
      throw new Error('Client name is required');
    }
    
    const result = await db.runAsync(
      `INSERT INTO clients (
        name, company_name, contact_name, email, phone, 
        billing_address, shipping_address, tags, is_archived,
        default_currency_code, default_due_option, default_tax_id,
        default_discount_type, default_discount_value
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client.name.trim(),
        client.company_name?.trim() || null,
        client.contact_name?.trim() || null,
        client.email?.trim() || null,
        client.phone?.trim() || null,
        client.billing_address?.trim() || null,
        client.shipping_address?.trim() || null,
        client.tags?.trim() || null,
        client.is_archived || 0,
        client.default_currency_code || null,
        client.default_due_option || null,
        client.default_tax_id || null,
        client.default_discount_type || null,
        client.default_discount_value || null
      ]
    );
    return Number(result.lastInsertRowId);
  }

  static async getAll(includeArchived = false): Promise<Client[]> {
    const query = includeArchived 
      ? 'SELECT * FROM clients ORDER BY name'
      : 'SELECT * FROM clients WHERE is_archived = 0 ORDER BY name';
    
    const clients = await db.getAllAsync<Client>(query);
    return clients;
  }

  static async getById(id: number): Promise<Client | null> {
    const client = await db.getFirstAsync<Client>(
      'SELECT * FROM clients WHERE id = ?',
      [id]
    );
    return client || null;
  }

  static async getWithBalance(id: number): Promise<ClientWithBalance | null> {
    const client = await db.getFirstAsync<ClientWithBalance>(
      `SELECT 
        c.*,
        COALESCE(SUM(CASE WHEN i.status = 'unpaid' THEN 
          (SELECT SUM(ii.qty * ii.rate) FROM invoice_items ii WHERE ii.invoice_id = i.id)
        ELSE 0 END), 0) as outstanding,
        COALESCE(SUM(
          (SELECT SUM(ii.qty * ii.rate) FROM invoice_items ii WHERE ii.invoice_id = i.id)
        ), 0) as total_billed,
        MAX(i.issued_date) as last_invoice_date,
        SUM(CASE 
          WHEN i.status = 'unpaid' AND i.due_date < date('now') THEN 1 
          ELSE 0 
        END) as overdue_count
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.client_id
      WHERE c.id = ?
      GROUP BY c.id`,
      [id]
    );
    return client || null;
  }

  static async update(id: number, client: Partial<Client>): Promise<void> {
    // Define allowed fields to prevent SQL injection
    const allowedFields = [
      'name', 'company_name', 'contact_name', 'email', 'phone', 
      'billing_address', 'shipping_address', 'tags', 'is_archived',
      'default_currency_code', 'default_due_option', 'default_tax_id',
      'default_discount_type', 'default_discount_value'
    ];
    
    const validKeys = Object.keys(client).filter(key => 
      key !== 'id' && allowedFields.includes(key)
    );
    
    if (validKeys.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    const fields = validKeys.map(key => `${key} = ?`).join(', ');
    const values = validKeys.map(key => (client as any)[key]);
    values.push(id);
    
    await db.runAsync(
      `UPDATE clients SET ${fields} WHERE id = ?`,
      values
    );
  }

  static async archive(id: number): Promise<void> {
    await db.runAsync(
      'UPDATE clients SET is_archived = 1 WHERE id = ?',
      [id]
    );
  }

  static async unarchive(id: number): Promise<void> {
    await db.runAsync(
      'UPDATE clients SET is_archived = 0 WHERE id = ?',
      [id]
    );
  }

  static async delete(id: number): Promise<void> {
    await db.runAsync('DELETE FROM clients WHERE id = ?', [id]);
  }

  static async search(query: string): Promise<Client[]> {
    const searchTerm = `%${query}%`;
    const clients = await db.getAllAsync<Client>(
      `SELECT * FROM clients 
       WHERE (name LIKE ? OR company_name LIKE ? OR email LIKE ?) 
       AND is_archived = 0 
       ORDER BY name`,
      [searchTerm, searchTerm, searchTerm]
    );
    return clients;
  }
}