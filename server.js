const express = require("express");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = 3000;



// 🔧 Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "minha_chave_secreta_aleatoria",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// 🌐 Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔁 Rotas externas
const authRoutes = require("./routers/auth");
const projectRoutes = require("./routers/projects");
const cardRoutes = require("./routers/cards");

app.use("/", authRoutes);
app.use("/", projectRoutes);
app.use("/", cardRoutes);

// 🚀 Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 MD Tasks rodando em http://localhost:${PORT}`);
});

