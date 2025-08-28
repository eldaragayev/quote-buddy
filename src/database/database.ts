import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'quoteBuddy.db';

export const db = SQLite.openDatabaseSync(DATABASE_NAME);

const SCHEMA_VERSION = 2;

const createTables = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      business_name TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      default_currency_code TEXT,
      default_tax_id INTEGER,
      FOREIGN KEY (default_tax_id) REFERENCES taxes(id)
    );

    CREATE TABLE IF NOT EXISTS issuers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      company_name TEXT,
      contact_name TEXT,
      email TEXT,
      phone TEXT,
      billing_address TEXT,
      shipping_address TEXT,
      tags TEXT,
      is_archived INTEGER DEFAULT 0,
      default_currency_code TEXT,
      default_due_option TEXT,
      default_tax_id INTEGER,
      default_discount_type TEXT,
      default_discount_value REAL,
      FOREIGN KEY (default_tax_id) REFERENCES taxes(id)
    );

    CREATE TABLE IF NOT EXISTS client_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS taxes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate_percent REAL NOT NULL,
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate REAL NOT NULL,
      unit TEXT,
      tax_id INTEGER,
      FOREIGN KEY (tax_id) REFERENCES taxes(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issuer_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      number INTEGER NOT NULL,
      issued_date TEXT NOT NULL,
      due_option TEXT NOT NULL,
      due_date TEXT,
      currency_code TEXT NOT NULL,
      status TEXT DEFAULT 'unpaid',
      discount_type TEXT,
      discount_value REAL,
      tax_id INTEGER,
      public_notes TEXT,
      terms TEXT,
      po_number TEXT,
      FOREIGN KEY (issuer_id) REFERENCES issuers(id),
      FOREIGN KEY (client_id) REFERENCES clients(id),
      FOREIGN KEY (tax_id) REFERENCES taxes(id)
    );

    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      item_id INTEGER,
      name TEXT NOT NULL,
      qty REAL NOT NULL,
      rate REAL NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      attachment_uri TEXT,
      attachment_mime TEXT
    );

    CREATE TABLE IF NOT EXISTS estimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS estimate_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      estimate_id INTEGER NOT NULL,
      item_id INTEGER,
      name TEXT NOT NULL,
      qty REAL NOT NULL,
      rate REAL NOT NULL,
      position INTEGER NOT NULL,
      FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS agent_chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT
    );

    CREATE TABLE IF NOT EXISTS agent_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES agent_chats(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS agent_message_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      file_uri TEXT NOT NULL,
      mime_type TEXT,
      FOREIGN KEY (message_id) REFERENCES agent_messages(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    CREATE INDEX IF NOT EXISTS idx_invoices_issuer ON invoices(issuer_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_client_notes_client ON client_notes(client_id);
    CREATE INDEX IF NOT EXISTS idx_clients_archived ON clients(is_archived);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_agent_messages_chat ON agent_messages(chat_id);
  `);
};

const applyMigrations = (fromVersion: number) => {
  // Migration from version 1 to 2: Add tax default fields
  if (fromVersion < 2) {
    try {
      // Add is_default column to taxes table if it doesn't exist
      db.execSync(`
        ALTER TABLE taxes ADD COLUMN is_default INTEGER DEFAULT 0;
      `);
    } catch (error) {
      // Column might already exist, ignore error
      // is_default column might already exist in taxes table
    }
    
    try {
      // Add default_tax_id to settings table if it doesn't exist
      db.execSync(`
        ALTER TABLE settings ADD COLUMN default_tax_id INTEGER REFERENCES taxes(id);
      `);
    } catch (error) {
      // Column might already exist, ignore error
      // default_tax_id column might already exist in settings table
    }
  }
};

const checkAndMigrate = () => {
  const result = db.getFirstSync<{ version: number }>(
    'SELECT version FROM schema_version ORDER BY version DESC LIMIT 1'
  );
  
  const currentVersion = result?.version || 0;
  
  if (currentVersion < SCHEMA_VERSION) {
    if (currentVersion === 0) {
      createTables();
      db.runSync('INSERT INTO schema_version (version) VALUES (?)', SCHEMA_VERSION);
    } else {
      // Apply migrations for existing databases
      applyMigrations(currentVersion);
      db.runSync('INSERT INTO schema_version (version) VALUES (?)', SCHEMA_VERSION);
    }
  }
};

export const initializeDatabase = () => {
  try {
    // Enable foreign key constraints
    db.execSync('PRAGMA foreign_keys = ON;');
    
    // Create schema version table first
    db.execSync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Run migrations
    checkAndMigrate();
    
    // Database schema initialized successfully
    return true;
  } catch (error) {
    // Failed to initialize database
    throw error;
  }
};

export const resetDatabase = () => {
  const tables = [
    'agent_message_attachments',
    'agent_messages',
    'agent_chats',
    'estimate_items',
    'estimates',
    'expenses',
    'invoice_items',
    'invoices',
    'items',
    'taxes',
    'client_notes',
    'clients',
    'issuers',
    'settings',
    'users',
    'schema_version'
  ];
  
  tables.forEach(table => {
    db.execSync(`DROP TABLE IF EXISTS ${table};`);
  });
  
  initializeDatabase();
};