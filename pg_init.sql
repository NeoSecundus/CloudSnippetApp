DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS snippets;

CREATE TABLE snippets (
  id INT PRIMARY KEY,
  name VARCHAR NOT NULL,
  description VARCHAR,
  author VARCHAR NOT NULL,
  language VARCHAR NOT NULL,
  code VARCHAR NOT NULL
);

CREATE TABLE tags (
  fk_table INT REFERENCES snippets(id) ON DELETE CASCADE ON UPDATE CASCADE,
  tag VARCHAR,
  PRIMARY KEY(fk_table, tag)
);

INSERT INTO snippets VALUES(0, 
  'demo', 
  'Just a demo',
  'Teuschl',
  'python',
  'print("This is a demo!")');

INSERT INTO tags VALUES(0, 'simple');
INSERT INTO tags VALUES(0, 'demo');

