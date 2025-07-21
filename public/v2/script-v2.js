let allProjects = {};
let currentProject = "";

// 🔄 Inicialização
document.addEventListener("DOMContentLoaded", async () => {
  await loadProjects();
  renderCards();
});

// 📦 Carrega projetos reais do banco
async function loadProjects() {
  try {
    const res = await fetch("/api/projects");
    const data = await res.json();
    allProjects = data;

    const select = document.getElementById("projectSelect");
    select.innerHTML = "";

    Object.keys(allProjects).forEach(key => {
      const option = document.createElement("option");
      option.value = key;
      option.textContent = allProjects[key].name || key;
      select.appendChild(option);
    });

    currentProject = Object.keys(allProjects)[0];
    select.value = currentProject;
    document.getElementById("userName").textContent = `Projeto: ${allProjects[currentProject].name}`;
  } catch (err) {
    console.error("Erro ao carregar projetos:", err);
  }
}

// 🧩 Renderiza cartões com ícones e contador
function renderCards() {
  const { cards } = allProjects[currentProject];

  const columns = {
    todo: document.getElementById("todo"),
    inProgress: document.getElementById("in-progress"),
    done: document.getElementById("done")
  };

  Object.keys(columns).forEach(column => {
    columns[column].innerHTML = "";
    const list = cards[column] || [];

    list.forEach(cardData => {
      const card = document.createElement("div");
      card.className = "border-l-4 p-3 mb-2 rounded shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-white";

      const icons = [];
      if (cardData.date) icons.push("<i class='fa-solid fa-calendar-days text-blue-500'></i>");
      if (cardData.comment) icons.push("<i class='fa-solid fa-comment text-green-500'></i>");
      if (cardData.label) icons.push("<i class='fa-solid fa-tag text-yellow-500'></i>");
      if (cardData.file) icons.push("<i class='fa-solid fa-paperclip text-gray-500'></i>");

      card.innerHTML = `
        <div class="flex justify-between items-center">
          <strong>${cardData.text}</strong>
          <div class="flex gap-2">${icons.join(" ")}</div>
        </div>
        ${cardData.label ? `<span class="inline-block w-4 h-4 mt-2 rounded" style="background:${cardData.label}"></span>` : ""}
        ${cardData.comment ? `<div class="text-sm mt-2">${cardData.comment}</div>` : ""}
      `;

      columns[column].appendChild(card);
    });

    const titleMap = {
      todo: "A Fazer",
      inProgress: "Em Progresso",
      done: "Concluído"
    };
    const count = list.length;
    document.querySelector(`[data-column="${column}"] h2`).textContent = `${titleMap[column]} · ${count} item${count !== 1 ? "s" : ""}`;
  });
}

// 📌 Alteração de quadro
document.getElementById("projectSelect").addEventListener("change", e => {
  currentProject = e.target.value;
  document.getElementById("userName").textContent = `Projeto: ${allProjects[currentProject].name}`;
  renderCards();
});

// ➕ Novo quadro
async function createNewProject() {
  const name = prompt("Nome do novo quadro:");
  if (!name) return;
  try {
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    await loadProjects();
    renderCards();
  } catch (err) {
    console.error("Erro ao criar projeto:", err);
  }
}

// ✏️ Renomear quadro
async function renameProject() {
  const name = prompt("Novo nome para o quadro:");
  if (!name) return;
  try {
    await fetch(`/api/projects/${currentProject}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    await loadProjects();
    renderCards();
  } catch (err) {
    console.error("Erro ao renomear projeto:", err);
  }
}

// ❌ Excluir quadro
async function deleteProject() {
  const ok = confirm("Tem certeza que deseja excluir este quadro?");
  if (!ok) return;
  try {
    await fetch(`/api/projects/${currentProject}`, { method: "DELETE" });
    await loadProjects();
    renderCards();
  } catch (err) {
    console.error("Erro ao excluir projeto:", err);
  }
}

// ➕ Adicionar cartão
async function addCard(column) {
  const text = prompt("Texto do cartão:");
  if (!text) return;
  try {
    await fetch(`/api/projects/${currentProject}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ column, text })
    });
    await loadProjects();
    renderCards();
  } catch (err) {
    console.error("Erro ao adicionar cartão:", err);
  }
}

// 🚪 Logout
function logout() {
  fetch("/api/logout").then(() => {
    location.reload();
  });
}