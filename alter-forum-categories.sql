-- Run this once if forum_topics already exists with an older ENUM.
-- It keeps existing rows and only expands available categories.

ALTER TABLE forum_topics
  MODIFY category ENUM('general','support','guides','guild','reports','suggestions','announcements')
  NOT NULL DEFAULT 'general';
