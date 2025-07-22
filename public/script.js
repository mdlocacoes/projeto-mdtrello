
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

function logout() {
  window.location.href = "/logout";
}

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

function createNewProject() {
  const nome = prompt("Nome do novo quadro:");
  if (!nome || allProjects[nome]) return;
  allProjects[nome] = { todo: [], "in-progress": [], done: [] };
  currentProject = nome;
  renderProjectOptions();
  renderCards();
  saveCards();
}

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

function saveCards() {
  fetch("/save-projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projects: allProjects })
  });
}

// 🖼️ Renderiza cartões do quadro atual
function renderCards() {
  ["todo", "in-progress", "done"].forEach(columnId => {
    const container = document.getElementById(columnId);
    container.innerHTML = "";
    const cards = allProjects[currentProject]?.[columnId] || [];

    cards.forEach((cardData, index) => {
      const uniqueId = `${columnId}-${index}`;
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

      const expandButton = card.querySelector(".expand-btn");
      if (expandButton) {
        expandButton.onclick = () => {
          console.log("🧠 Expandindo cartão:", cardData.text);
          card.classList.toggle("expanded");

          const existedDetails = card.querySelector(".card-details");
          if (existedDetails) {
            existedDetails.remove();
            return;
          }

          const details = document.createElement("div");
          details.className = "card-details";
          details.innerHTML = `
            <div class="card-form">
              <label>Texto: <input type="text" id="text-${uniqueId}" value="${cardData.text}" /></label>
              <label>Comentário:<textarea id="comment-${uniqueId}">${cardData.comment || ""}</textarea></label>
              <label>Data: <input type="date" id="date-${uniqueId}" value="${cardData.date || ""}" /></label>
              <label>Etiqueta:
                <select id="label-${uniqueId}">
                  <option value="">Nenhuma</option>
                  <option value="#ffc107">Amarela</option>
                  <option value="#28a745">Verde</option>
                  <option value="#17a2b8">Azul</option>
                  <option value="#dc3545">Vermelha</option>
                </select>
              </label>
              <label>Anexo (URL): <input type="text" id="file-${uniqueId}" value="${cardData.file || ""}" /></label>

              <div class="card-actions">
                <button onclick="saveInline('${uniqueId}', '${columnId}', ${index})" class="btn primary">Salvar</button>
                <button onclick="deleteInline('${columnId}', ${index})" class="btn danger">Excluir</button>
                <button onclick="collapseInline(this)" class="btn secondary">Fechar</button>
              </div>
            </div>
          `;
         card.appendChild(details);
          const labelField = document.getElementById(`label-${uniqueId}`);
          if (labelField) labelField.value = cardData.label;
        };
      }

      container.appendChild(card);
    });
  });
}

function saveInline(uid, columnId, index) {
  const text = document.getElementById(`text-${uid}`).value;
  const comment = document.getElementById(`comment-${uid}`).value;
  const date = document.getElementById(`date-${uid}`).value;
  const label = document.getElementById(`label-${uid}`).value;
  const file = document.getElementById(`file-${uid}`).value;

  const cards = allProjects[currentProject][columnId];
  const card = cards[index]; // usa índice direto — mais confiável

  card.text = text;
  card.comment = comment;
  card.date = date;
  card.label = label;
  card.file = file;

  renderCards();
  saveCards();
}

function deleteInline(columnId, index) {
  allProjects[currentProject][columnId].splice(index, 1); // remove usando índice
  renderCards();
  saveCards();
}

function deleteInline(columnId, index) {
  allProjects[currentProject][columnId].splice(index, 1); // remove pelo índice
  renderCards();
  saveCards();
}

function collapseInline(button) {
  const card = button.closest(".card");
  card.classList.remove("expanded");
  const details = card.querySelector(".card-details");
  if (details) details.remove();
}

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

document.getElementById("projectSelect").addEventListener("change", function () {
  currentProject = this.value;
  renderCards();
});

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
