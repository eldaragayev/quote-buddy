import { db } from '../database/database';
import { Invoice, InvoiceItem, InvoiceWithClient } from '../types/database';

export class InvoiceModel {
  static async create(invoice: Omit<Invoice, 'id'>): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO invoices (
        issuer_id, client_id, number, issued_date, due_option,
        due_date, currency_code, status, discount_type, discount_value,
        tax_id, public_notes, terms, po_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoice.issuer_id,
        invoice.client_id,
        invoice.number,
        invoice.issued_date,
        invoice.due_option,
        invoice.due_date || null,
        invoice.currency_code,
        invoice.status || 'unpaid',
        invoice.discount_type || null,
        invoice.discount_value || null,
        invoice.tax_id || null,
        invoice.public_notes || null,
        invoice.terms || null,
        invoice.po_number || null
      ]
    );
    return Number(result.lastInsertRowId);
  }

  static async getAll(status?: 'paid' | 'unpaid'): Promise<InvoiceWithClient[]> {
    let query = `
      SELECT 
        i.*,
        c.name as client_name,
        c.company_name as client_company_name,
        c.email as client_email,
        iss.company_name as issuer_company_name,
        t.rate_percent as tax_rate
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN issuers iss ON i.issuer_id = iss.id
      LEFT JOIN taxes t ON i.tax_id = t.id
    `;
    
    const params: any[] = [];
    if (status) {
      query += ' WHERE i.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY i.issued_date DESC';
    
    const invoices = await db.getAllAsync<any>(query, params);
    
    // Load items for each invoice
    for (const invoice of invoices) {
      if (invoice.id) {
        invoice.items = await db.getAllAsync<InvoiceItem>(
          'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position',
          [invoice.id]
        );
      }
    }
    
    return invoices;
  }

  static async getById(id: number): Promise<InvoiceWithClient | null> {
    const invoice = await db.getFirstAsync<any>(
      `SELECT 
        i.*,
        c.name as client_name,
        c.company_name as client_company_name,
        c.email as client_email,
        c.phone as client_phone,
        c.billing_address as client_billing_address,
        iss.company_name as issuer_company_name,
        iss.email as issuer_email,
        iss.phone as issuer_phone,
        iss.address as issuer_address,
        t.name as tax_name,
        t.rate_percent as tax_rate
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN issuers iss ON i.issuer_id = iss.id
      LEFT JOIN taxes t ON i.tax_id = t.id
      WHERE i.id = ?`,
      [id]
    );
    
    if (!invoice) return null;
    
    const items = await db.getAllAsync<InvoiceItem>(
      'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position',
      [id]
    );
    
    return { ...invoice, items };
  }

  static async getByClientId(clientId: number): Promise<Invoice[]> {
    const invoices = await db.getAllAsync<Invoice>(
      'SELECT * FROM invoices WHERE client_id = ? ORDER BY issued_date DESC',
      [clientId]
    );
    return invoices;
  }

  static async update(id: number, invoice: Partial<Invoice>): Promise<void> {
    const fields = Object.keys(invoice)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(invoice)
      .filter(key => key !== 'id')
      .map(key => (invoice as any)[key]);
    
    values.push(id);
    
    await db.runAsync(
      `UPDATE invoices SET ${fields} WHERE id = ?`,
      values
    );
  }

  static async markPaid(id: number): Promise<void> {
    await db.runAsync(
      'UPDATE invoices SET status = ? WHERE id = ?',
      ['paid', id]
    );
  }

  static async markUnpaid(id: number): Promise<void> {
    await db.runAsync(
      'UPDATE invoices SET status = ? WHERE id = ?',
      ['unpaid', id]
    );
  }

  static async delete(id: number): Promise<void> {
    await db.runAsync('DELETE FROM invoices WHERE id = ?', [id]);
  }

  static async getNextInvoiceNumber(issuerId: number): Promise<number> {
    const result = await db.getFirstAsync<{ max_number: number }>(
      'SELECT MAX(number) as max_number FROM invoices WHERE issuer_id = ?',
      [issuerId]
    );
    return (result?.max_number || 0) + 1;
  }

  static async addItem(item: Omit<InvoiceItem, 'id'>): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO invoice_items (invoice_id, item_id, name, qty, rate, position)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        item.invoice_id,
        item.item_id || null,
        item.name,
        item.qty,
        item.rate,
        item.position
      ]
    );
    return Number(result.lastInsertRowId);
  }

  static async updateItem(id: number, item: Partial<InvoiceItem>): Promise<void> {
    const fields = Object.keys(item)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(item)
      .filter(key => key !== 'id')
      .map(key => (item as any)[key]);
    
    values.push(id);
    
    await db.runAsync(
      `UPDATE invoice_items SET ${fields} WHERE id = ?`,
      values
    );
  }

  static async deleteItem(id: number): Promise<void> {
    await db.runAsync('DELETE FROM invoice_items WHERE id = ?', [id]);
  }

  static async getItemsByInvoiceId(invoiceId: number): Promise<InvoiceItem[]> {
    const items = await db.getAllAsync<InvoiceItem>(
      'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position',
      [invoiceId]
    );
    return items;
  }

  static async calculateTotal(invoiceId: number): Promise<number> {
    const invoice = await db.getFirstAsync<Invoice>(
      'SELECT * FROM invoices WHERE id = ?',
      [invoiceId]
    );
    
    if (!invoice) return 0;
    
    const items = await this.getItemsByInvoiceId(invoiceId);
    let subtotal = items.reduce((sum, item) => sum + (item.qty * item.rate), 0);
    
    if (invoice.discount_type && invoice.discount_value) {
      if (invoice.discount_type === 'percent') {
        subtotal -= subtotal * (invoice.discount_value / 100);
      } else {
        subtotal -= invoice.discount_value;
      }
    }
    
    if (invoice.tax_id) {
      const tax = await db.getFirstAsync<{ rate_percent: number }>(
        'SELECT rate_percent FROM taxes WHERE id = ?',
        [invoice.tax_id]
      );
      if (tax) {
        subtotal += subtotal * (tax.rate_percent / 100);
      }
    }
    
    return subtotal;
  }
}