import { db } from '../database/database';
import { Settings, User } from '../types/database';

export class SettingsModel {
  static async get(): Promise<Settings | null> {
    const settings = await db.getFirstAsync<Settings>(
      'SELECT * FROM settings LIMIT 1'
    );
    return settings || null;
  }

  static async createOrUpdate(settings: Omit<Settings, 'id'>): Promise<void> {
    const existing = await this.get();
    
    if (existing && existing.id) {
      await db.runAsync(
        'UPDATE settings SET default_currency_code = ? WHERE id = ?',
        [settings.default_currency_code || null, existing.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO settings (default_currency_code) VALUES (?)',
        [settings.default_currency_code || null]
      );
    }
  }

  static async getDefaultCurrency(): Promise<string> {
    const settings = await this.get();
    return settings?.default_currency_code || 'USD';
  }
}

export class UserModel {
  static async get(): Promise<User | null> {
    const user = await db.getFirstAsync<User>(
      'SELECT * FROM users LIMIT 1'
    );
    return user || null;
  }

  static async createOrUpdate(user: Omit<User, 'id'>): Promise<void> {
    const existing = await this.get();
    
    if (existing && existing.id) {
      await db.runAsync(
        'UPDATE users SET name = ?, business_name = ? WHERE id = ?',
        [user.name || null, user.business_name || null, existing.id]
      );
    } else {
      await db.runAsync(
        'INSERT INTO users (name, business_name) VALUES (?, ?)',
        [user.name || null, user.business_name || null]
      );
    }
  }
}