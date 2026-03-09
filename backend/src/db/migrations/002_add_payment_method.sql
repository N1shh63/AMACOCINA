-- Add payment_method to orders (nullable for existing rows)
ALTER TABLE orders ADD COLUMN payment_method TEXT;
