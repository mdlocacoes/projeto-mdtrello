const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = 3000;

// 🔧 Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ✅ necessário para formulários HTML

// ✅ Corrigido: serve arquivos estáticos corretamente
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  secret: "minha_chave_secreta_aleatoria", // 🔐 substitua por algo seguro
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// 🌐 Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔁 Rotas externas
const authRoutes = require("./routers/auth"); // ✅ certifique-se de que está usando a pasta correta
app.use("/", authRoutes);

// 🚀 Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Mini Trello rodando em http://localhost:${PORT}`);
});