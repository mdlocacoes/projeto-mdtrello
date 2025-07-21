const express = require("express");
const router = express.Router();
const db = require("better-sqlite3")("trello.db");

// Lista cartões por projeto
router.get("/cards/:projectId", (req, res) => {
  const projectId = parseInt(req.params.projectId);
  if (isNaN(projectId)) return res.status(400).json({ error: "ID inválido" });

  const stmt = db.prepare("SELECT id, content, column FROM cards WHERE project_id = ?");
  const cards = stmt.all(projectId);
  res.json(cards);
});

// Adiciona um cartão
router.post("/cards", (req, res) => {
  const { content, column, projectId } = req.body;
  if (!content || !column || !projectId) return res.status(400).json({ error: "Dados incompletos" });

  const stmt = db.prepare("INSERT INTO cards (content, column, project_id) VALUES (?, ?, ?)");
  const result = stmt.run(content, column, projectId);
  res.status(201).json({ id: result.lastInsertRowid });
});

// Atualiza coluna (mover cartão)
router.put("/cards/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { column } = req.body;
  const stmt = db.prepare("UPDATE cards SET column = ? WHERE id = ?");
  const result = stmt.run(column, id);
  res.json({ success: result.changes > 0 });
});

// Exclui cartão
router.delete("/cards/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const stmt = db.prepare("DELETE FROM cards WHERE id = ?");
  const result = stmt.run(id);
  res.json({ success: result.changes > 0 });
});

module.exports = router;