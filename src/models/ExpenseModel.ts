import { db } from '../database/database';
import { Expense } from '../types/database';

export class ExpenseModel {
  static async create(expense: Omit<Expense, 'id'>): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO expenses (title, description, amount, date, attachment_uri, attachment_mime)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        expense.title,
        expense.description || null,
        expense.amount,
        expense.date,
        expense.attachment_uri || null,
        expense.attachment_mime || null
      ]
    );
    return Number(result.lastInsertRowId);
  }

  static async getAll(startDate?: string, endDate?: string): Promise<Expense[]> {
    let query = 'SELECT * FROM expenses';
    const params: any[] = [];
    
    if (startDate && endDate) {
      query += ' WHERE date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    } else if (startDate) {
      query += ' WHERE date >= ?';
      params.push(startDate);
    } else if (endDate) {
      query += ' WHERE date <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY date DESC';
    
    const expenses = await db.getAllAsync<Expense>(query, params);
    return expenses;
  }

  static async getById(id: number): Promise<Expense | null> {
    const expense = await db.getFirstAsync<Expense>(
      'SELECT * FROM expenses WHERE id = ?',
      [id]
    );
    return expense || null;
  }

  static async update(id: number, expense: Partial<Expense>): Promise<void> {
    const fields = Object.keys(expense)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(expense)
      .filter(key => key !== 'id')
      .map(key => (expense as any)[key]);
    
    values.push(id);
    
    await db.runAsync(
      `UPDATE expenses SET ${fields} WHERE id = ?`,
      values
    );
  }

  static async delete(id: number): Promise<void> {
    await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
  }

  static async getTotalByDateRange(startDate: string, endDate: string): Promise<number> {
    const result = await db.getFirstAsync<{ total: number }>(
      'SELECT SUM(amount) as total FROM expenses WHERE date BETWEEN ? AND ?',
      [startDate, endDate]
    );
    return result?.total || 0;
  }
}