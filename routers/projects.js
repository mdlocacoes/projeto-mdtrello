const express = require("express");
const router = express.Router();
const db = require("better-sqlite3")("trello.db");

// 🧠 Middleware de verificação de sessão
function requireLogin(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }
  next();
}

// 🔍 Listar todos os projetos
router.get("/projects", requireLogin, (req, res) => {
  const stmt = db.prepare("SELECT id, name FROM projects WHERE user_id = ?");
  const projects = stmt.all(req.session.user.id);
  res.json(projects);
});

// ➕ Criar novo projeto
router.post("/projects/create", requireLogin, (req, res) => {
  const name = req.body.name?.trim();
  if (!name) return res.status(400).json({ error: "Nome inválido" });

  const stmt = db.prepare("INSERT INTO projects (name, user_id) VALUES (?, ?)");
  const result = stmt.run(name, req.session.user.id);
  res.status(201).json({ id: result.lastInsertRowid, name });
});

// ✏️ Renomear projeto
router.put("/projects/:id/rename", requireLogin, (req, res) => {
  const id = parseInt(req.params.id);
  const name = req.body.name?.trim();
  if (!name || isNaN(id)) return res.status(400).json({ error: "Dados inválidos" });

  const stmt = db.prepare("UPDATE projects SET name = ? WHERE id = ? AND user_id = ?");
  const result = stmt.run(name, id, req.session.user.id);
  res.json({ success: result.changes > 0 });
});

// ❌ Deletar projeto
router.delete("/projects/:id", requireLogin, (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

  const stmt = db.prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
  const result = stmt.run(id, req.session.user.id);
  res.json({ success: result.changes > 0 });
});

module.exports = router;