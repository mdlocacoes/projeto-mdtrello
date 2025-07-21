const db = require("better-sqlite3")("trello.db");

// 🔍 Lista todas as tabelas
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("📁 Tabelas encontradas:");
tables.forEach(t => console.log(" -", t.name));

// 📋 Mostra registros de cada tabela
tables.forEach(t => {
  try {
    const rows = db.prepare(`SELECT * FROM ${t.name}`).all();
    console.log(`\n📦 Dados da tabela "${t.name}":`);
    if (rows.length === 0) {
      console.log("(sem registros)");
    } else {
      rows.forEach(row => console.log(row));
    }
  } catch (err) {
    console.log(`Erro ao consultar tabela ${t.name}:`, err.message);
  }
});