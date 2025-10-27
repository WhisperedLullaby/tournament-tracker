-- Clean up any existing tables and start fresh
-- Run this in Supabase SQL Editor if there are schema conflicts

-- Drop all existing tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS bracket_matches CASCADE;
DROP TABLE IF EXISTS bracket_teams CASCADE;
DROP TABLE IF EXISTS pool_standings CASCADE;
DROP TABLE IF EXISTS pool_matches CASCADE;
DROP TABLE IF EXISTS pods CASCADE;
DROP TABLE IF EXISTS todos CASCADE;

-- Drop enums
DROP TYPE IF EXISTS match_status CASCADE;
DROP TYPE IF EXISTS bracket_type CASCADE;
