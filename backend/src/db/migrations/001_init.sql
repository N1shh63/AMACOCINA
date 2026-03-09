-- AmaCocina - initial schema (orders + order_items)

CREATE TABLE IF NOT EXISTS schema_migrations (
  name TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,

  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_notes TEXT,

  currency TEXT NOT NULL,
  subtotal INTEGER NOT NULL,
  total INTEGER NOT NULL,

  order_status TEXT NOT NULL,
  payment_status TEXT NOT NULL,

  mp_external_reference TEXT,
  mp_preference_id TEXT,
  mp_payment_id TEXT,
  mp_merchant_order_id TEXT,
  mp_status TEXT,

  wa_to TEXT,
  wa_message TEXT,
  wa_sent_at TEXT,

  source TEXT NOT NULL,
  client_user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_mp_external_reference ON orders(mp_external_reference);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  line_total INTEGER NOT NULL,

  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

