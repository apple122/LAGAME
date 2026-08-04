-- ===================================================
-- LAPACK-Game Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ===================================================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  cover_image TEXT,
  screenshots JSONB DEFAULT '[]',
  video_url TEXT,
  file_size TEXT,
  system_requirements JSONB DEFAULT '{
    "minimum": {"os":"","cpu":"","ram":"","gpu":"","storage":""},
    "recommended": {"os":"","cpu":"","ram":"","gpu":"","storage":""}
  }',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  category_ids UUID[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Download links table
CREATE TABLE IF NOT EXISTS download_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  cloud_name TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ad settings table
CREATE TABLE IF NOT EXISTS ad_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_url TEXT NOT NULL DEFAULT '',
  countdown_seconds INTEGER NOT NULL DEFAULT 10,
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default ad settings row
INSERT INTO ad_settings (ad_url, countdown_seconds, is_active)
VALUES ('', 10, false)
ON CONFLICT DO NOTHING;

-- Seed some default categories
INSERT INTO categories (name, slug) VALUES
  ('Action', 'action'),
  ('Adventure', 'adventure'),
  ('RPG', 'rpg'),
  ('Strategy', 'strategy'),
  ('Sports', 'sports'),
  ('Racing', 'racing'),
  ('Simulation', 'simulation'),
  ('Horror', 'horror'),
  ('Shooter', 'shooter'),
  ('Fighting', 'fighting'),
  ('Puzzle', 'puzzle'),
  ('Arcade', 'arcade')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (for public read access)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can read games" ON games FOR SELECT USING (true);
CREATE POLICY "Public can read download_links" ON download_links FOR SELECT USING (true);
CREATE POLICY "Public can read ad_settings" ON ad_settings FOR SELECT USING (true);

-- Allow all operations via anon key (admin uses same key — replace with proper auth in production)
CREATE POLICY "Anon full access categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access games" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access download_links" ON download_links FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anon full access ad_settings" ON ad_settings FOR ALL USING (true) WITH CHECK (true);
