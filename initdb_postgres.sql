DROP TABLE IF EXISTS messages;

CREATE TABLE messages (
  id integer NOT NULL,
  message varchar(30) DEFAULT NULL
);

INSERT INTO messages VALUES
  (1,'Hello World')
;
