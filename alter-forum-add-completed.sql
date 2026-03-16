-- Add completed flag so staff can mark a topic as resolved/completed.

SET @has_completed := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'forum_topics'
    AND COLUMN_NAME = 'completed'
);

SET @sql := IF(
  @has_completed = 0,
  'ALTER TABLE forum_topics ADD COLUMN completed TINYINT(1) NOT NULL DEFAULT 0 AFTER locked',
  'SELECT "completed ya existe"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
