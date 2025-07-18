const Database = require("better-sqlite3");
const db = new Database("trello.db");

// 🔧 Cria a tabela de usuários
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`).run();

// 🧠 Cria a tabela de projetos
db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    data TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`).run();

module.exports = db;