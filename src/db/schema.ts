import Database from '@tauri-apps/plugin-sql';

export interface Customer {
  id: string;
  name: string;
  address: string;
  gstin: string;
  phone: string;
  createdAt: number;
  updatedAt: number;
}

export interface Item {
  id: string;
  name: string;
  hsn: string;
  rate: number;
  createdAt: number;
  updatedAt: number;
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  date: number;
  customerId: string;
  customerName: string;      // Snapshot for historical preservation
  customerPhone: string;     // Snapshot for historical preservation
  customerVillage: string;   // Snapshot for historical preservation
  taxableAmount: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  status: 'draft' | 'finalized' | 'cancelled';
}

export interface BillItem {
  id: string;
  billId: string;
  itemId: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  dbInstance = await Database.load('sqlite:billora.db');
  return dbInstance;
}

export async function initDb() {
  const db = await getDb();
  
  // Create tables if they don't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      gstin TEXT,
      phone TEXT,
      createdAt INTEGER,
      updatedAt INTEGER
    );
  `);
  
  await db.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hsn TEXT,
      rate REAL,
      createdAt INTEGER,
      updatedAt INTEGER
    );
  `);

  // Using a try/catch block to alter the bills table if it already exists from earlier phases, 
  // or create it with the new snapshot columns if it doesn't.
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      invoiceNumber TEXT,
      date INTEGER,
      customerId TEXT,
      taxableAmount REAL,
      cgst REAL,
      sgst REAL,
      grandTotal REAL,
      status TEXT
    );
  `);
  
  // Safely add new snapshot columns if they are missing
  try { await db.execute(`ALTER TABLE bills ADD COLUMN customerName TEXT;`); } catch (e) {}
  try { await db.execute(`ALTER TABLE bills ADD COLUMN customerPhone TEXT;`); } catch (e) {}
  try { await db.execute(`ALTER TABLE bills ADD COLUMN customerVillage TEXT;`); } catch (e) {}

  await db.execute(`
    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      billId TEXT,
      itemId TEXT,
      description TEXT,
      quantity INTEGER,
      rate REAL,
      amount REAL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS drafts (
      id TEXT PRIMARY KEY,
      data TEXT,
      updatedAt INTEGER
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      payload TEXT,
      createdAt INTEGER
    );
  `);
}

export const db = {
  async getCustomers(): Promise<Customer[]> {
    const database = await getDb();
    return database.select<Customer[]>('SELECT * FROM customers');
  },
  
  async saveCustomer(customer: Customer): Promise<void> {
    const database = await getDb();
    await database.execute(
      'INSERT INTO customers (id, name, address, gstin, phone, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [customer.id, customer.name, customer.address, customer.gstin, customer.phone, customer.createdAt, customer.updatedAt]
    );
    await this.enqueueSync('customer', customer);
  },
  
  async getItems(): Promise<Item[]> {
    const database = await getDb();
    return database.select<Item[]>('SELECT * FROM items');
  },
  
  async saveItem(item: Item): Promise<void> {
    const database = await getDb();
    await database.execute(
      'INSERT INTO items (id, name, hsn, rate, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6)',
      [item.id, item.name, item.hsn, item.rate, item.createdAt, item.updatedAt]
    );
    await this.enqueueSync('item', item);
  },
  
  async saveBill(bill: Bill, billItems: BillItem[]): Promise<void> {
    const database = await getDb();
    // Insert with snapshot fields
    await database.execute(
      'INSERT INTO bills (id, invoiceNumber, date, customerId, customerName, customerPhone, customerVillage, taxableAmount, cgst, sgst, grandTotal, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
      [bill.id, bill.invoiceNumber, bill.date, bill.customerId, bill.customerName, bill.customerPhone, bill.customerVillage, bill.taxableAmount, bill.cgst, bill.sgst, bill.grandTotal, bill.status]
    );
    for (const item of billItems) {
      await database.execute(
        'INSERT INTO bill_items (id, billId, itemId, description, quantity, rate, amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [item.id, item.billId, item.itemId, item.description, item.quantity, item.rate, item.amount]
      );
    }
    await this.enqueueSync('bill', { bill, items: billItems });
  },

  async getDraft(): Promise<string | null> {
    const database = await getDb();
    const rows = await database.select<{data: string}[]>('SELECT data FROM drafts WHERE id = $1', ['current_draft']);
    if (rows && rows.length > 0) {
      return rows[0].data;
    }
    return null;
  },

  async saveDraft(data: string): Promise<void> {
    const database = await getDb();
    await database.execute(
      'INSERT OR REPLACE INTO drafts (id, data, updatedAt) VALUES ($1, $2, $3)',
      ['current_draft', data, Date.now()]
    );
  },
  
  async clearDraft(): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM drafts WHERE id = $1', ['current_draft']);
  },

  async getBills(): Promise<Bill[]> {
    const database = await getDb();
    return database.select<Bill[]>('SELECT * FROM bills ORDER BY date DESC');
  },

  async getBillItems(billId: string): Promise<BillItem[]> {
    const database = await getDb();
    return database.select<BillItem[]>('SELECT * FROM bill_items WHERE billId = $1', [billId]);
  },

  async getNextInvoiceNumberPreview(): Promise<string> {
    const database = await getDb();
    const rows = await database.select<{value: string}[]>('SELECT value FROM app_settings WHERE key = $1', ['invoice_counter']);
    const counter = rows && rows.length > 0 ? parseInt(rows[0].value, 10) : 1;
    return `INV-${counter.toString().padStart(4, '0')}`;
  },

  async consumeNextInvoiceNumber(): Promise<string> {
    const database = await getDb();
    const rows = await database.select<{value: string}[]>('SELECT value FROM app_settings WHERE key = $1', ['invoice_counter']);
    const counter = rows && rows.length > 0 ? parseInt(rows[0].value, 10) : 1;
    const invNum = `INV-${counter.toString().padStart(4, '0')}`;
    await database.execute(
      'INSERT OR REPLACE INTO app_settings (key, value) VALUES ($1, $2)',
      ['invoice_counter', (counter + 1).toString()]
    );
    return invNum;
  },

  async exportAllData(): Promise<string> {
    const database = await getDb();
    const customers = await database.select('SELECT * FROM customers');
    const items = await database.select('SELECT * FROM items');
    const bills = await database.select('SELECT * FROM bills');
    const billItems = await database.select('SELECT * FROM bill_items');
    const appSettings = await database.select('SELECT * FROM app_settings');
    
    return JSON.stringify({
      version: 1,
      timestamp: Date.now(),
      customers,
      items,
      bills,
      billItems,
      appSettings
    });
  },

  async importAllData(jsonString: string): Promise<void> {
    const database = await getDb();
    const data = JSON.parse(jsonString);
    
    if (!data.version || !data.customers || !data.bills) {
      throw new Error("Invalid backup file format.");
    }

    // Auto-backup current state before wiping
    const currentBackup = await this.exportAllData();
    await database.execute(
      'INSERT OR REPLACE INTO drafts (id, data, updatedAt) VALUES ($1, $2, $3)',
      [`auto_bak_${Date.now()}`, currentBackup, Date.now()]
    );

    // Truncate tables
    await database.execute('DELETE FROM customers');
    await database.execute('DELETE FROM items');
    await database.execute('DELETE FROM bills');
    await database.execute('DELETE FROM bill_items');
    await database.execute('DELETE FROM app_settings');

    // Re-insert data
    for (const c of data.customers) {
      await database.execute(
        'INSERT INTO customers (id, name, address, gstin, phone, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [c.id, c.name, c.address, c.gstin, c.phone, c.createdAt, c.updatedAt]
      );
    }
    for (const i of data.items) {
      await database.execute(
        'INSERT INTO items (id, name, hsn, rate, createdAt, updatedAt) VALUES ($1, $2, $3, $4, $5, $6)',
        [i.id, i.name, i.hsn, i.rate, i.createdAt, i.updatedAt]
      );
    }
    for (const b of data.bills) {
      await database.execute(
        'INSERT INTO bills (id, invoiceNumber, date, customerId, customerName, customerPhone, customerVillage, taxableAmount, cgst, sgst, grandTotal, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
        [b.id, b.invoiceNumber, b.date, b.customerId, b.customerName, b.customerPhone, b.customerVillage, b.taxableAmount, b.cgst, b.sgst, b.grandTotal, b.status]
      );
    }
    for (const bi of data.billItems) {
      await database.execute(
        'INSERT INTO bill_items (id, billId, itemId, description, quantity, rate, amount) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [bi.id, bi.billId, bi.itemId, bi.description, bi.quantity, bi.rate, bi.amount]
      );
    }
    for (const s of data.appSettings) {
      await database.execute(
        'INSERT INTO app_settings (key, value) VALUES ($1, $2)',
        [s.key, s.value]
      );
    }
  },

  async enqueueSync(entity: string, data: any): Promise<void> {
    const database = await getDb();
    await database.execute(
      'INSERT INTO sync_queue (id, payload, createdAt) VALUES ($1, $2, $3)',
      [crypto.randomUUID(), JSON.stringify({ entity, data }), Date.now()]
    );
  },

  async getPendingSyncs(): Promise<{id: string, payload: string}[]> {
    const database = await getDb();
    return database.select<{id: string, payload: string}[]>('SELECT id, payload FROM sync_queue ORDER BY createdAt ASC');
  },

  async markSyncComplete(id: string): Promise<void> {
    const database = await getDb();
    await database.execute('DELETE FROM sync_queue WHERE id = $1', [id]);
  }
};
