# Triple Zed / Fun Toys Shop

Live site: https://zobearislam.github.io/verbose-doodle/shop.html

## Supabase Setup

Project: ENIGMA (dvgtfbkzctnhjlklrehs)

### Run this SQL in the Supabase SQL Editor (after verifying current schema)

```sql
-- Ensure products table supports multi images
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_urls text[] NOT NULL DEFAULT '{}';
-- Keep image_url if it exists for legacy

-- Orders table columns (adjust if already present)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_note text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal numeric NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'Cash on delivery';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Make old columns nullable if they exist
ALTER TABLE orders ALTER COLUMN name DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN phone DROP NOT NULL;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public read products (safe)
DROP POLICY IF EXISTS "Public can read products" ON products;
CREATE POLICY "Public can read products" ON products FOR SELECT USING (true);

-- Public can insert orders (minimal)
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders FOR INSERT WITH CHECK (true);

-- Owner-only read and update orders
-- REPLACE 'YOUR_OWNER_USER_ID' with the actual auth.users id of the shop owner
DROP POLICY IF EXISTS "Owner can read orders" ON orders;
CREATE POLICY "Owner can read orders" ON orders FOR SELECT USING (auth.uid() = 'YOUR_OWNER_USER_ID'::uuid);

DROP POLICY IF EXISTS "Owner can update orders" ON orders;
CREATE POLICY "Owner can update orders" ON orders FOR UPDATE USING (auth.uid() = 'YOUR_OWNER_USER_ID'::uuid);

-- Grants (adjust role if needed)
GRANT SELECT ON products TO anon, authenticated;
GRANT INSERT ON orders TO anon, authenticated;
GRANT SELECT, UPDATE ON orders TO authenticated;
```

**Important:** Replace `YOUR_OWNER_USER_ID` with the UUID of the authenticated owner user (from Supabase Auth > Users). Do not use a broad authenticated policy.

Public visitors can only insert orders and read products. Only the owner can read/update orders.

## Frontend Configuration

- Supabase URL and anon key are in the JS files (public).
- Add products in Supabase `products` table with `name`, `price`, `description`, and `image_urls` (array of strings) or `image_url`.
- For WhatsApp (optional): edit app.js to add a WhatsApp link after successful order if desired (not currently auto-opened).

## Owner Dashboard

Visit /owner.html and sign in with the owner's Auth email/password. Then view and update order statuses.

## Files

- shop.html / app.js : product display + checkout
- owner.html / owner.js : owner dashboard
- index.html, for-you.html, style.css

Hosted on GitHub Pages from main branch.
