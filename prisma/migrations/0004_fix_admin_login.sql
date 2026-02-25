-- Ensure admin account exists with default credentials (admin/admin)
INSERT INTO "Admin" ("id", "username", "passwordHash")
VALUES ('admin_seed_001', 'admin', '$2a$10$1JxfamUsHeULz8t0tXKl7O5A5E/vWtk0sNfuW1YXsImMaxK7O3uNK')
ON CONFLICT("username") DO UPDATE
SET "passwordHash" = excluded."passwordHash";

-- Clear any stale auth lockouts for admin after credential repair
DELETE FROM "AuthRateLimit"
WHERE "key" LIKE '%:admin';
