INSERT INTO "Admin" ("id", "username", "passwordHash")
VALUES ('admin_seed_001', 'admin', '$2a$10$QG5n/k3wHyA5oQpGZQbUtOfLLQus8ZqFYhQCbSO14xUkbUXCWBd9Va')
ON CONFLICT("username") DO UPDATE
SET "passwordHash" = excluded."passwordHash";
