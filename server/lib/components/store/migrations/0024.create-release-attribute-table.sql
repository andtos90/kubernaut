START TRANSACTION;

CREATE TABLE release_attribute (
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  release UUID REFERENCES release ON DELETE CASCADE,
  CONSTRAINT release_attribute__release__name__uniq UNIQUE (release, name)
);

CREATE UNIQUE INDEX release_attribute__release__name__idx ON release_attribute (
  release DESC, name DESC
);

COMMIT;
