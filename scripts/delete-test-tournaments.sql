-- Delete all test tournaments and their associated data.
-- All child tables (pods, pool_matches, pool_standings, bracket_teams,
-- bracket_matches, tournament_roles) cascade on DELETE from tournaments.

BEGIN;

SELECT id, name, slug, status
FROM tournaments
WHERE is_test = true;

DELETE FROM tournaments
WHERE is_test = true;

COMMIT;
