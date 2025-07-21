
let allProjects = {};
let currentProject = "MD Tasks";

// 🔐 Autenticação e inicialização
fetch("/get-user")
  .then(res => res.json())
  .then(data => {
    if (!data.username) {
      window.location.href = "login.html";
    } else {
      const avatar = document.getElementById("avatar");
      if (avatar) avatar.textContent = data.username[0].toUpperCase();

      document.getElementById("userName").textContent = data.username;
      loadProjects();
    }
  });

// 🌙 Tema escuro persistente
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    const icon = document.querySelector(".theme-button i");
    if (icon) icon.className = "fa-solid fa-sun";
  }

  document.querySelectorAll(".column").forEach(col => {
    col.ondrop = drop;
    col.ondragover = allowDrop;
  });
});

function toggleTheme() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", isDark ? "dark" : "light");

  const icon = document.querySelector(".theme-button i");
  if (icon) icon.className = isDark ? "fa-solid fa-sun" : "fa-solid fa-moon";
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
      currentProject = nomes[0] || "MD Tasks";

      if (!allProjects[currentProject]) {
        allProjects[currentProject] = { todo: [], "in-progress": [], done: [] };
      }

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
function createNewProject() {
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
    currentProject = restantes[0] || "MD Tasks";
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
        <div class="card-header">
          <strong class="card-title">${cardData.text}</strong>
          <div class="card-controls">
            <button class="expand-btn"><i class="fa-solid fa-chevron-down"></i></button>
          </div>
        </div>
        ${cardData.label ? `<span class="tag" style="background:${cardData.label}"></span>` : ""}
      `;

      card.querySelector(".expand-btn").onclick = () => {
        card.classList.toggle("expanded");

        if (card.classList.contains("expanded")) {
          const details = document.createElement("div");
          details.className = "card-details";
          details.innerHTML = `
            ${cardData.comment ? `<p><strong>Comentário:</strong> ${cardData.comment}</p>` : ""}
            ${cardData.date ? `<p><strong>Data:</strong> ${cardData.date}</p>` : ""}
            ${cardData.label ? `<p><strong>Etiqueta:</strong> <span class="tag" style="background:${cardData.label}"></span></p>` : ""}
            ${cardData.file ? `<p><strong>Anexo:</strong> <a href="${cardData.file}" target="_blank">Ver</a></p>` : ""}
            <div class="card-actions">
              <button class="edit-btn"><i class="fa-solid fa-pen-to-square"></i></button>
              <button class="delete-btn"><i class="fa-solid fa-trash"></i></button>
              <button class="close-btn"><i class="fa-solid fa-xmark"></i></button>
            </div>
          `;
          card.appendChild(details);

          details.querySelector(".edit-btn").onclick = () => openModal(cardData, id);
          details.querySelector(".delete-btn").onclick = () => {
            allProjects[currentProject][id] = allProjects[currentProject][id].filter(c => c !== cardData);
            renderCards();
            saveCards();
          };
          details.querySelector(".close-btn").onclick = () => {
            card.classList.remove("expanded");
            details.remove();
          };
        } else {
          const details = card.querySelector(".card-details");
          if (details) details.remove();
        }
      };

      container.appendChild(card);
    });
  });
}

// ➕ Adiciona novo cartão — agora funcionando!
function addCard(column) {
  const content = prompt("Conteúdo do cartão:");
  if (!content || !currentProject) return;

  const newCard = {
    text: content,
    comment: "",
    date: "",
    label: "",
    file: ""
  };

  allProjects[currentProject][column].push(newCard);
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
  const column = ev.target.closest(".column")?.getAttribute("data-column");
  if (!column) return;
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
      <label>Anexo (URL):<input type="text" id      
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