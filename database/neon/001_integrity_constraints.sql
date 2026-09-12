BEGIN;

-- Compatibility columns required by the application relationships.
ALTER TABLE bookinginquiries ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE memories ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS route_json TEXT;
ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS stops_json TEXT;
ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS travelers INTEGER DEFAULT 1;
ALTER TABLE routeinquiries ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ON DELETE SET NULL requires a nullable booking tour reference.
ALTER TABLE bookinginquiries ALTER COLUMN tour_id DROP NOT NULL;

-- Remove rows that cannot participate in a primary key.
DELETE FROM users WHERE id IS NULL;
DELETE FROM categories WHERE id IS NULL;
DELETE FROM destinations WHERE id IS NULL;
DELETE FROM tourpackages WHERE id IS NULL;
DELETE FROM memories WHERE id IS NULL;
DELETE FROM mappins WHERE id IS NULL;
DELETE FROM routeinquiries WHERE id IS NULL;
DELETE FROM bookinginquiries WHERE id IS NULL;
DELETE FROM reviews WHERE id IS NULL;

-- Keep one row for duplicate imported IDs before adding primary keys.
DELETE FROM users a USING users b WHERE a.id = b.id AND a.ctid > b.ctid;
DELETE FROM categories a USING categories b WHERE a.id = b.id AND a.ctid > b.ctid;
DELETE FROM destinations a USING destinations b WHERE a.id = b.id AND a.ctid > b.ctid;
DELETE FROM tourpackages a USING tourpackages b WHERE a.id = b.id AND a.ctid > b.ctid;
DELETE FROM memories a USING memories b WHERE a.id = b.id AND a.ctid > b.ctid;
DELETE FROM mappins a USING mappins b WHERE a.id = b.id AND a.ctid > b.ctid;
DELETE FROM routeinquiries a USING routeinquiries b WHERE a.id = b.id AND a.ctid > b.ctid;
DELETE FROM bookinginquiries a USING bookinginquiries b WHERE a.id = b.id AND a.ctid > b.ctid;
DELETE FROM reviews a USING reviews b WHERE a.id = b.id AND a.ctid > b.ctid;

-- Null invalid relationships instead of dropping valid business records.
UPDATE bookinginquiries b SET tour_id = NULL
WHERE b.tour_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM tourpackages t WHERE t.id = b.tour_id);
UPDATE bookinginquiries b SET user_id = NULL
WHERE b.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = b.user_id);
DELETE FROM reviews r
WHERE r.tour_id IS NULL
  OR NOT EXISTS (SELECT 1 FROM tourpackages t WHERE t.id = r.tour_id);
UPDATE reviews r SET user_id = NULL
WHERE r.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = r.user_id);
UPDATE memories m SET user_id = NULL
WHERE m.user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = m.user_id);

-- Add primary keys only when the table does not already have one.
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','categories','destinations','tourpackages','memories','mappins','routeinquiries','bookinginquiries','reviews'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conrelid = table_name::regclass AND contype = 'p'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I_pkey PRIMARY KEY (id)', table_name, table_name);
    END IF;
  END LOOP;
END $$;

-- Ensure every primary key has a usable sequence/default for future inserts.
DO $$
DECLARE
  table_name TEXT;
  sequence_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['users','categories','destinations','tourpackages','memories','mappins','routeinquiries','bookinginquiries','reviews'] LOOP
    sequence_name := pg_get_serial_sequence(table_name, 'id');
    IF sequence_name IS NULL THEN
      sequence_name := table_name || '_id_seq';
      EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I', sequence_name);
      EXECUTE format('ALTER SEQUENCE %I OWNED BY %I.id', sequence_name, table_name);
      EXECUTE format('ALTER TABLE %I ALTER COLUMN id SET DEFAULT nextval(%L)', table_name, sequence_name);
    END IF;
    EXECUTE format(
      'SELECT setval(%L, GREATEST(COALESCE((SELECT MAX(id) FROM %I), 0) + 1, 1), false)',
      sequence_name, table_name
    );
  END LOOP;
END $$;

-- Add requested foreign keys only when an equivalent relationship is absent.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookinginquiries_tour_id_fkey') THEN
    ALTER TABLE bookinginquiries
      ADD CONSTRAINT bookinginquiries_tour_id_fkey
      FOREIGN KEY (tour_id) REFERENCES tourpackages(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookinginquiries_user_id_fkey') THEN
    ALTER TABLE bookinginquiries
      ADD CONSTRAINT bookinginquiries_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_tour_id_fkey') THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_tour_id_fkey
      FOREIGN KEY (tour_id) REFERENCES tourpackages(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_user_id_fkey') THEN
    ALTER TABLE reviews
      ADD CONSTRAINT reviews_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memories_user_id_fkey') THEN
    ALTER TABLE memories
      ADD CONSTRAINT memories_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

COMMIT;
