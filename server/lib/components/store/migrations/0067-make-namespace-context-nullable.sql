START TRANSACTION;

ALTER TABLE namespace ALTER COLUMN context DROP NOT NULL;

COMMIT;
