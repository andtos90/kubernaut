START TRANSACTION;

TRUNCATE service CASCADE;
TRUNCATE release_template CASCADE;
TRUNCATE release CASCADE;
TRUNCATE release_attribute CASCADE;

COMMIT;
