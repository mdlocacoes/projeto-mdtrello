let allProjects = {};
let currentProject = "Padrão";

// 🔐 Autenticação e inicialização
fetch("/get-user")
  .then(res => res.json())
  .then(data => {
    if (!data.username) {
      window.location.href = "login.html";
    } else {
      document.getElementById("avatar").textContent = data.username[0].toUpperCase();
      document.getElementById("userName").textContent = data.username;
      loadProjects();
    }
  });

// 🌙 Tema escuro persistente
window.onload = () => {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }
};

function toggleTheme() {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
}

// 🚪 Logout
function logout() {
  window.location.href = "/logout";
}

// 📥 Carrega projetos do backend
function loadProjects() {
  fetch("/get-projects")
    .then(res => res.json())
    .then(data => {
      allProjects = data || {};
      const nomes = Object.keys(allProjects);
      currentProject = nomes[0] || "Padrão";
      renderProjectOptions();
      renderCards();
    });
}

// 🎨 Renderiza seletor de quadros
function renderProjectOptions() {
  const select = document.getElementById("projectSelect");
  select.innerHTML = "";
  for (const name in allProjects) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    if (name === currentProject) option.selected = true;
    select.appendChild(option);
  }
}

// ➕ Cria novo quadro
function createProject() {
  const nome = prompt("Nome do novo quadro:");
  if (!nome || allProjects[nome]) return;
  allProjects[nome] = { todo: [], "in-progress": [], done: [] };
  currentProject = nome;
  renderProjectOptions();
  renderCards();
  saveCards();
}

// ✏️ Renomeia quadro atual
function renameProject() {
  const novoNome = prompt("Novo nome para o quadro:");
  if (!novoNome || allProjects[novoNome]) return;
  allProjects[novoNome] = allProjects[currentProject];
  delete allProjects[currentProject];
  currentProject = novoNome;
  renderProjectOptions();
  renderCards();
  saveCards();
}

// 🗑️ Exclui quadro atual
function deleteProject() {
  if (!confirm("Deseja realmente excluir este quadro?")) return;
  fetch("/delete-project", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: currentProject })
  }).then(() => {
    delete allProjects[currentProject];
    const restantes = Object.keys(allProjects);
    currentProject = restantes[0] || "Padrão";
    renderProjectOptions();
    renderCards();
    saveCards();
  });
}

// 💾 Salva dados completos no backend
function saveCards() {
  fetch("/save-projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projects: allProjects })
  });
}

// 🖼️ Renderiza cartões do quadro atual
function renderCards() {
  ["todo", "in-progress", "done"].forEach(id => {
    const container = document.getElementById(id);
    container.innerHTML = "";
    const cards = allProjects[currentProject]?.[id] || [];

    cards.forEach(cardData => {
      const card = document.createElement("div");
      card.className = "card";
      card.draggable = true;
      card.ondragstart = drag;

      card.innerHTML = `
        <strong class="card-title">${cardData.text}</strong>
        ${cardData.label ? `<div class="card-tag" style="background:${cardData.label}"></div>` : ""}
      `;

      card.ondblclick = () => openModal(cardData, id);
      container.appendChild(card);
    });
  });
}

// ➕ Adiciona novo cartão
function addCard(column) {
  const texto = prompt("Texto do novo cartão:");
  if (!texto) return;
  const novo = { text: texto, comment: "", date: "", label: "", file: "" };
  allProjects[currentProject][column].push(novo);
  renderCards();
  saveCards();
}

// 🔁 Troca de quadro via seletor
document.getElementById("projectSelect").addEventListener("change", function () {
  currentProject = this.value;
  renderCards();
});

// 🧲 Drag & drop
function allowDrop(ev) {
  ev.preventDefault();
}
function drag(ev) {
  ev.dataTransfer.setData("text", ev.target.textContent);
}
function drop(ev) {
  ev.preventDefault();
  const column = ev.target.closest(".column").id;
  const texto = ev.dataTransfer.getData("text");

  for (const col in allProjects[currentProject]) {
    allProjects[currentProject][col] = allProjects[currentProject][col].filter(c => c.text !== texto);
  }

  allProjects[currentProject][column].push({ text: texto, comment: "", date: "", label: "", file: "" });
  renderCards();
  saveCards();
}

// 📝 Modal de edição de cartão
function openModal(data, column) {
  const modal = document.createElement("div");
  modal.className = "card-modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Editar cartão</h3>
      <label>Texto:<input type="text" id="text" value="${data.text}"></label>
      <label>Comentário:<textarea id="comment">${data.comment}</textarea></label>
      <label>Data:<input type="date" id="date" value="${data.date}"></label>
      <label>Etiqueta:
        <select id="label">
          <option value="">Nenhuma</option>
          <option value="#ffc107">Amarela</option>
          <option value="#28a745">Verde</option>
          <option value="#17a2b8">Azul</option>
          <option value="#dc3545">Vermelha</option>
        </select>
      </label>
      <label>Anexo (URL):<input type="text" id="file" value="${data.file}"></label>
      <div class="modal-actions">
        <button id="save">Salvar</button>
        <button id="delete">Excluir</button>
        <button id="close">Fechar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector("#label").value = data.label;

  modal.querySelector("#save").onclick = () => {
    data.text = modal.querySelector("#text").value;
    data.comment = modal.querySelector("#comment").value;
    data.date = modal.querySelector("#date").value;
    data.label = modal.querySelector("#label").value;
    data.file = modal.querySelector("#file").value;
    renderCards();
    saveCards();
    modal.remove();
  };

  modal.querySelector("#delete").onclick = () => {
    allProjects[currentProject][column] = allProjects[currentProject][column].filter(c => c !== data);
    renderCards();
    saveCards();
    modal.remove();
  };

  modal.querySelector("#close").onclick = () => modal.remove();
}