-- use or create a database first
CREATE DATABASE IF NOT EXISTS voting_db;
USE voting_db;

-- users table
CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  is_admin TINYINT(1) NOT NULL DEFAULT 0
);

-- elections table
CREATE TABLE elections (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 0
);

-- candidates table
CREATE TABLE candidates (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  election_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
);

-- blockchain (public ledger)
-- vote_data stored as JSON (MySQL JSON type) or TEXT if older MySQL
CREATE TABLE blockchain (
  block_index INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  timestamp DATETIME NOT NULL,
  vote_data JSON NOT NULL,
  previous_hash VARCHAR(255) NOT NULL,
  hash VARCHAR(255) NOT NULL,
  nonce INT NOT NULL
);

-- user_votes (prevent double voting)
CREATE TABLE user_votes (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  election_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_election (user_id, election_id)
);

UPDATE blockchain
SET vote_data = JSON_OBJECT('genesis', TRUE)
WHERE block_index = 1;
