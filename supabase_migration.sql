-- =====================================================================
-- ZORVIQUE UNIFIED SUPABASE PRODUCTION SQL MIGRATION SCRIPT
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and click Run.
-- =====================================================================

-- 0. CLEAN UP EXISTING TABLES (Safe Reset)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS hero_slides CASCADE;
DROP TABLE IF EXISTS testimonials CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS discount_codes CASCADE;
DROP TABLE IF EXISTS subscribers CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- 1. PRODUCTS TABLE
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sku TEXT NOT NULL,
  description TEXT,
  fabric TEXT,
  price INTEGER NOT NULL,
  compare_at_price INTEGER,
  badges TEXT[],
  collection_id TEXT,
  colourways JSONB,
  sizes JSONB,
  status TEXT DEFAULT 'draft',
  featured BOOLEAN DEFAULT false,
  show_on_rack BOOLEAN DEFAULT true,
  rack_order INTEGER,
  seo_title TEXT,
  seo_description TEXT,
  is_sample BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_collection_id ON products(collection_id);

-- 2. ORDERS TABLE
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  order_no TEXT UNIQUE NOT NULL,
  customer JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  discount INTEGER DEFAULT 0,
  discount_code TEXT,
  total INTEGER NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT,
  payment_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'new',
  courier TEXT,
  tracking_no TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 3. ORDER_ITEMS TABLE (Foreign Key relationship to orders)
CREATE TABLE order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  colour TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- 4. OTHER SUPPORTING TABLES
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  "order" INTEGER DEFAULT 0,
  visible BOOLEAN DEFAULT true,
  is_sample BOOLEAN DEFAULT false
);

CREATE TABLE hero_slides (
  id TEXT PRIMARY KEY,
  "order" INTEGER DEFAULT 0,
  product_id TEXT,
  colour_name TEXT,
  bg_color TEXT,
  headline TEXT,
  body TEXT,
  cta_label TEXT,
  cta_link TEXT,
  image_url TEXT,
  active BOOLEAN DEFAULT true,
  is_sample BOOLEAN DEFAULT false
);

CREATE TABLE testimonials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT,
  rating INTEGER DEFAULT 5,
  text TEXT,
  visible BOOLEAN DEFAULT true,
  is_sample BOOLEAN DEFAULT false
);

CREATE TABLE pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  visible BOOLEAN DEFAULT true
);

CREATE TABLE discount_codes (
  code TEXT PRIMARY KEY,
  percent INTEGER NOT NULL,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true
);

CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE media (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  storage_path TEXT,
  content_type TEXT,
  size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE admins (
  email TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Products RLS (Select: Public; Insert/Update/Delete: Authenticated)
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Auth insert products" ON products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update products" ON products FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth delete products" ON products FOR DELETE USING (auth.role() = 'authenticated');

-- Orders RLS (Select/Insert: Public or Authenticated; Update: Authenticated)
CREATE POLICY "Public select orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update orders" ON orders FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Order Items RLS
CREATE POLICY "Public select order_items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Public insert order_items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Auth update order_items" ON order_items FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Public read for storefront collections, slides, testimonials, pages, discounts
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Public read hero_slides" ON hero_slides FOR SELECT USING (true);
CREATE POLICY "Public read testimonials" ON testimonials FOR SELECT USING (true);
CREATE POLICY "Public read pages" ON pages FOR SELECT USING (true);
CREATE POLICY "Public read discount_codes" ON discount_codes FOR SELECT USING (true);

-- Admin access for all remaining tables
CREATE POLICY "Auth all collections" ON collections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth all hero_slides" ON hero_slides FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth all testimonials" ON testimonials FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth all pages" ON pages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth all discount_codes" ON discount_codes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth all subscribers" ON subscribers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth all media" ON media FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth all admins" ON admins FOR ALL USING (auth.role() = 'authenticated');
