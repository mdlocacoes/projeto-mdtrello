const express = require("express");
const path = require("path");
const router = express.Router();
const db = require("../db");

function exigirLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(403).json({ error: "Usuário não autenticado" });
  }
  next();
}

// 📝 Cadastro
router.post("/register", (req, res) => {
  const { username, password } = req.body;
  try {
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, password);
    const user = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    db.prepare("INSERT INTO projects (user_id, name, data) VALUES (?, ?, ?)").run(
      user.id,
      "Padrão",
      JSON.stringify({ todo: [], "in-progress": [], done: [] })
    );
    req.session.user = username;
    console.log("Novo usuário cadastrado:", username);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: "Usuário já existe." });
  }
});

// 🔐 Login
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
  if (user) {
    req.session.user = username;
    console.log("Login bem-sucedido para:", username);
    res.json({ success: true });
  } else {
    res.json({ success: false, message: "Usuário ou senha incorretos." });
  }
});

// 🧑 Obter usuário atual
router.get("/get-user", (req, res) => {
  res.json({ username: req.session.user || null });
});

// 🚪 Logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

// 💾 Salvar quadros (com dados completos dos cartões)
router.post("/save-projects", exigirLogin, (req, res) => {
  const { projects } = req.body;
  const username = req.session.user;
  const user = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (!user || !projects || typeof projects !== "object") {
    return res.status(400).json({ success: false, message: "Dados inválidos." });
  }

  console.log("🔄 Salvando quadros para:", username);
  try {
    db.prepare("DELETE FROM projects WHERE user_id = ?").run(user.id);
    for (const [name, data] of Object.entries(projects)) {
      const serialized = JSON.stringify(data);
      db.prepare("INSERT INTO projects (user_id, name, data) VALUES (?, ?, ?)").run(user.id, name, serialized);
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Erro ao salvar quadros:", err);
    res.status(500).json({ success: false });
  }
});

// 📥 Carregar quadros
router.get("/get-projects", exigirLogin, (req, res) => {
  const username = req.session.user;
  const user = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (!user) return res.json({});

  const rows = db.prepare("SELECT name, data FROM projects WHERE user_id = ?").all(user.id);
  const projects = {};
  rows.forEach(row => {
    projects[row.name] = JSON.parse(row.data);
  });

  res.json(projects);
});

// 🗑️ Excluir quadro
router.post("/delete-project", exigirLogin, (req, res) => {
  const { name } = req.body;
  const user = db.prepare("SELECT id FROM users WHERE username = ?").get(req.session.user);
  if (!user) return res.status(401).json({ success: false });

  db.prepare("DELETE FROM projects WHERE user_id = ? AND name = ?").run(user.id, name);
  res.json({ success: true });
});

module.exports = router;