START TRANSACTION;

CREATE TABLE release_attribute (
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  release TEXT REFERENCES release ON DELETE CASCADE,
  UNIQUE (release, name)
);

CREATE INDEX release_attribute__release__idx ON release_attribute (
  release
);

COMMIT;
