-- Required for existing databases that already have the original VARCHAR(500) columns.
-- Run once against chuchicharas_db. This migration preserves all existing image URLs.
USE chuchicharas_db;

ALTER TABLE categories
  MODIFY COLUMN image_url MEDIUMTEXT NULL;

ALTER TABLE product_images
  MODIFY COLUMN image_url MEDIUMTEXT NOT NULL;
