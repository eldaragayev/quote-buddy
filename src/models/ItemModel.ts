import { db } from '../database/database';
import { Item } from '../types/database';

export class ItemModel {
  static async create(item: Omit<Item, 'id'>): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO items (name, rate, unit, tax_id)
       VALUES (?, ?, ?, ?)`,
      [
        item.name,
        item.rate,
        item.unit || null,
        item.tax_id || null
      ]
    );
    return Number(result.lastInsertRowId);
  }

  static async getAll(): Promise<Item[]> {
    const items = await db.getAllAsync<Item>(
      'SELECT * FROM items ORDER BY name'
    );
    return items;
  }

  static async getById(id: number): Promise<Item | null> {
    const item = await db.getFirstAsync<Item>(
      'SELECT * FROM items WHERE id = ?',
      [id]
    );
    return item || null;
  }

  static async update(id: number, item: Partial<Item>): Promise<void> {
    const fields = Object.keys(item)
      .filter(key => key !== 'id')
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = Object.keys(item)
      .filter(key => key !== 'id')
      .map(key => (item as any)[key]);
    
    values.push(id);
    
    await db.runAsync(
      `UPDATE items SET ${fields} WHERE id = ?`,
      values
    );
  }

  static async delete(id: number): Promise<void> {
    await db.runAsync('DELETE FROM items WHERE id = ?', [id]);
  }

  static async search(query: string): Promise<Item[]> {
    const searchTerm = `%${query}%`;
    const items = await db.getAllAsync<Item>(
      'SELECT * FROM items WHERE name LIKE ? ORDER BY name',
      [searchTerm]
    );
    return items;
  }
}