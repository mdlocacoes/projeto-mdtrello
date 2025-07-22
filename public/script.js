
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

function renderCards() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  const columns = Object.keys(allProjects[currentProject] || {});
  columns.forEach((columnId) => {
    const column = document.createElement("div");
    column.className = "column";
    column.dataset.column = columnId;

    // 🖊️ Título da coluna com edição
    const titleWrapper = document.createElement("div");
    titleWrapper.className = "column-title-wrapper";

    const titleText = document.createElement("h2");
    titleText.textContent = columnId;
    titleText.className = "column-title";
    titleText.onclick = () => makeTitleEditable(titleText, columnId);

    titleWrapper.appendChild(titleText);
    column.appendChild(titleWrapper);

    const cardList = document.createElement("div");
    cardList.className = "card-list";
    cardList.id = columnId;
    column.appendChild(cardList);

    // Botão para excluir coluna
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Excluir Coluna";
    deleteBtn.className = "btn danger";
    deleteBtn.onclick = () => deleteColumn(columnId);
    column.appendChild(deleteBtn);

    const cards = allProjects[currentProject][columnId];
    cards.forEach((cardData, index) => {
      const card = document.createElement("div");
      card.className = "card";
      card.draggable = true;
      card.ondragstart = drag;

      const cardHeader = document.createElement("div");
      cardHeader.className = "card-header";

      // 📋 Título editável inline
      const titleSpan = document.createElement("strong");
      titleSpan.className = "card-title";
      titleSpan.textContent = cardData.text;

      titleSpan.onclick = () => {
        const input = document.createElement("input");
        input.value = cardData.text;
        input.className = "card-title-input";

        const save = document.createElement("button");
        save.textContent = "💾";
        save.className = "save-card-title";

        titleSpan.replaceWith(input);
        cardHeader.insertBefore(save, cardHeader.querySelector(".card-controls"));

        save.onclick = () => {
          cardData.text = input.value.trim();
          renderCards();
          saveCards();
        };

        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") save.click();
        });
      };

      const controls = document.createElement("div");
      controls.className = "card-controls";
      controls.innerHTML = `<button class="expand-btn"><i class="fa-solid fa-chevron-down"></i></button>`;

      cardHeader.appendChild(titleSpan);
      cardHeader.appendChild(controls);
      card.appendChild(cardHeader);

      if (cardData.label) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.style.background = cardData.label;
        card.appendChild(tag);
      }

      if (cardData.file) {
        const fileLink = document.createElement("div");
        fileLink.className = "card-attachment";
        fileLink.innerHTML = `<a href="${cardData.file}" target="_blank">📎 Ver Anexo</a>`;
        card.appendChild(fileLink);
      }

      // Pré-visualização se for imagem
        const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
        const isImage = imageExtensions.some(ext => cardData.file.toLowerCase().endsWith(ext));

        if (isImage) {
          const preview = document.createElement("img");
          preview.src = cardData.file;
          preview.className = "file-preview";
          card.appendChild(preview);
        }

      cardList.appendChild(card);

      const expandButton = card.querySelector(".expand-btn");
      if (expandButton) {
        expandButton.onclick = () => {
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
              <label>Texto:
                <input type="text" id="text-${columnId}-${index}" value="${cardData.text}" />
              </label>
              <label>Comentário:
                <textarea id="comment-${columnId}-${index}">${cardData.comment || ""}</textarea>
              </label>
              <label>Data:
                <input type="date" id="date-${columnId}-${index}" value="${cardData.date || ""}" />
              </label>
              <label>Etiqueta:
                <select id="label-${columnId}-${index}">
                  <option value="">Nenhuma</option>
                  <option value="#ffc107">Amarela</option>
                  <option value="#28a745">Verde</option>
                  <option value="#17a2b8">Azul</option>
                  <option value="#dc3545">Vermelha</option>
                </select>
              </label>
              <label>Anexo:
                <div class="file-wrapper">
                  <label class="file-button" for="file-${columnId}-${index}">📁 Selecionar documento</label>
                  <input type="file" id="file-${columnId}-${index}" style="display:none;" />
                </div>
                ${cardData.file ? `
                  <div class="card-attachment">
                    <a href="${cardData.file}" target="_blank">📎 Ver Anexo</a>
                    <button type="button" class="remove-file" onclick="removeFile('${columnId}', ${index})">❌ Remover</button>
                  </div>` : ""}
              </label>

              <div class="card-actions">
                <button onclick="saveInline('${columnId}', ${index})" class="btn primary">Salvar</button>
                <button onclick="deleteInline('${columnId}', ${index})" class="btn danger">Excluir</button>
                <button onclick="collapseInline(this)" class="btn secondary">Fechar</button>
              </div>
            </div>
          `;

          card.appendChild(details);
          document.getElementById(`label-${columnId}-${index}`).value = cardData.label;
        };
      }
    });

    const addButton = document.createElement("button");
    addButton.textContent = "+ Adicionar Cartão";
    addButton.className = "btn secondary";
    addButton.onclick = () => addCard(columnId);
    column.appendChild(addButton);

    board.appendChild(column);
  });

  positionFloatingButton();
}

function saveInline(columnId, index) {
  const card = allProjects[currentProject][columnId][index];
  card.text = document.getElementById(`text-${columnId}-${index}`).value;
  card.comment = document.getElementById(`comment-${columnId}-${index}`).value;
  card.date = document.getElementById(`date-${columnId}-${index}`).value;
  card.label = document.getElementById(`label-${columnId}-${index}`).value;

  const fileInput = document.getElementById(`file-${columnId}-${index}`);
  const file = fileInput?.files[0];

  if (file) {
    card.file = URL.createObjectURL(file);
  }

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

function removeFile(columnId, index) {
  allProjects[currentProject][columnId][index].file = "";
  renderCards();
  saveCards();
}

const board = document.getElementById("board");

function addColumn() {
  const input = document.getElementById("newColumnName");
  const name = input.value.trim();
  if (!name || allProjects[currentProject][name]) return;

  allProjects[currentProject][name] = [];
  input.value = "";
  renderCards();
  saveCards();
}
function positionFloatingButton() {
  const board = document.getElementById("board");
  const button = document.querySelector(".floating-column-button");
  if (!board || !button) return;

  const columns = board.querySelectorAll(".column");
  if (columns.length === 0) return;

  const lastColumn = columns[columns.length - 1];
  const scrollLeft = board.scrollLeft;
  const lastLeft = lastColumn.offsetLeft;
  const lastWidth = lastColumn.offsetWidth;

  const offsetX = lastLeft + lastWidth - scrollLeft + 20;
  button.style.left = offsetX + "px";

  const wrapperRect = board.parentElement.getBoundingClientRect();
  button.style.top = (wrapperRect.top + window.scrollY + 10) + "px";
}

function deleteColumn(columnId) {
  const confirmado = confirm(`Tem certeza que deseja excluir a coluna "${columnId}"?`);
  if (!confirmado) return;

  delete allProjects[currentProject][columnId];
  renderCards();
  saveCards();
}

function makeTitleEditable(titleElement, columnId) {
  const wrapper = titleElement.parentElement;

  const input = document.createElement("input");
  input.type = "text";
  input.value = columnId;
  input.className = "title-input";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "💾";
  saveBtn.className = "save-title-btn";

  // Remove o antigo título
  titleElement.remove();

  // Adiciona o campo de edição
  wrapper.appendChild(input);
  wrapper.appendChild(saveBtn);

  saveBtn.onclick = () => {
    const newName = input.value.trim();

    if (!newName || newName === columnId) {
      renderCards();
      return;
    }

    if (newName in allProjects[currentProject]) {
      alert("Já existe uma coluna com esse nome.");
      return;
    }

    // Atualiza e salva
    const colData = allProjects[currentProject][columnId];
    delete allProjects[currentProject][columnId];
    allProjects[currentProject][newName] = colData;

    renderCards();
    saveCards();
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveBtn.click();
  });
}