-- Clients are auto-created on first intake (plan §8) — a web-form lead may
-- arrive with only an email. organization_name must be nullable.

ALTER TABLE clients ALTER COLUMN organization_name DROP NOT NULL;