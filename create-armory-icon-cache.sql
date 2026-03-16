-- Persistent cache for Armory item icons.
-- Optional: the API can auto-create this table, but keeping SQL helps for controlled deployments.

CREATE TABLE IF NOT EXISTS armory_item_icon_cache (
  item_entry INT UNSIGNED NOT NULL,
  icon VARCHAR(128) NULL,
  expires_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  fail_count SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  last_error VARCHAR(255) NULL,
  PRIMARY KEY (item_entry),
  KEY idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
