let allProjects = {};
let currentProject = "MD Tasks";

// 🔐 Autenticação
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

  // 🌙 Tema escuro e cor de fundo
  window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.body.classList.add("dark-mode");
      const themeSelect = document.getElementById("themeToggle");
      if (themeSelect) themeSelect.value = "dark";
    }

  const savedBg = localStorage.getItem("bgColor");
  if (savedBg) {
    document.body.style.backgroundColor = savedBg;
    const bgPicker = document.getElementById("bgColorPicker");
    if (bgPicker) bgPicker.value = savedBg;
  }

  const themeSelect = document.getElementById("themeToggle");
  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      const theme = e.target.value;
      document.body.classList.toggle("dark-mode", theme === "dark");
      localStorage.setItem("theme", theme);
    });
  }

  const bgPicker = document.getElementById("bgColorPicker");
  if (bgPicker) {
    bgPicker.addEventListener("input", (e) => {
      const color = e.target.value;
      document.body.style.backgroundColor = color;
      localStorage.setItem("bgColor", color);
    });
  }

  document.getElementById("userNameLabel").textContent = data.username;
if (data.avatarUrl) {
  document.getElementById("userPhoto").src = data.avatarUrl;
} else {
  document.getElementById("userPhoto").src = "default-avatar.png"; // imagem padrão
}

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

  const columnKeys = Object.keys(allProjects[currentProject] || {});
  columnKeys.forEach((columnId, index) => {
    const column = document.createElement("div");
    column.className = "column";
    column.dataset.column = columnId;
    column.dataset.index = index;

    const titleWrapper = document.createElement("div");
    titleWrapper.className = "column-title-wrapper";

    const cardCount = allProjects[currentProject][columnId].length;
    let countColor = "#28a745";
    if (cardCount >= 6) countColor = "#dc3545";
    else if (cardCount >= 3) countColor = "#ffc107";

    const titleText = document.createElement("h2");
    titleText.textContent = columnId;
    titleText.className = "column-title";
    titleText.onclick = () => makeTitleEditable(titleText, columnId);

    const counter = document.createElement("span");
    counter.className = "card-counter";
    counter.innerHTML = `<i class="fa-solid fa-chart-bar"></i> ${cardCount}`;
    counter.style.color = countColor;

    titleWrapper.appendChild(titleText);
    titleWrapper.appendChild(counter);
    column.appendChild(titleWrapper);

    const cardList = document.createElement("div");
    cardList.className = "card-list";
    cardList.id = columnId;

    // Zona de drop mesmo quando vazia
    cardList.ondragover = (e) => e.preventDefault();
cardList.ondrop = (e) => {
  e.preventDefault();
  const cardId = e.dataTransfer.getData("text/plain");
  const draggedCard = document.querySelector(`[data-id="${cardId}"]`);
  if (!draggedCard) return;

  const targetColumn = e.currentTarget.id;
  const sourceColumn = draggedCard.dataset.column;
  const cardIndex = parseInt(draggedCard.dataset.index);
  const cardData = allProjects[currentProject][sourceColumn][cardIndex];

  // Se for na mesma coluna, remove antes de calcular a posição
  if (sourceColumn === targetColumn) {
    allProjects[currentProject][sourceColumn].splice(cardIndex, 1);
  }

  const children = [...cardList.children].filter(el => el.classList.contains("card") && el !== draggedCard);
  let insertIndex = children.length;

  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    if (e.clientY < midpoint) {
      insertIndex = i;
      break;
    }
  }

  allProjects[currentProject][targetColumn].splice(insertIndex, 0, cardData);

  renderCards();
  saveCards();
};

    column.appendChild(cardList);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️ Excluir Coluna";
    deleteBtn.className = "btn danger";
    deleteBtn.onclick = () => deleteColumn(columnId);
    column.appendChild(deleteBtn);

    const cards = allProjects[currentProject][columnId];

    if (cards.length === 0) {
      // Placeholder visual em colunas vazias
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "empty-placeholder";
      emptyMessage.textContent = "🧺 Arraste cartões aqui";
      cardList.appendChild(emptyMessage);
    }

    cards.forEach((cardData, cardIndex) => {
      const card = document.createElement("div");
      card.className = "card";
      card.draggable = true;
      card.dataset.index = cardIndex;
      card.dataset.column = columnId;
      card.dataset.id = `${columnId}-${cardIndex}`;

      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", card.dataset.id);
      });

      const cardHeader = document.createElement("div");
      cardHeader.className = "card-header";

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
      controls.innerHTML = `<button class="expand-btn"><i class="fa-solid fa-angle-down"></i></button>`;

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

        const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
        const isImage = imageExtensions.some(ext => cardData.file.toLowerCase().endsWith(ext));
        if (isImage) {
          const preview = document.createElement("img");
          preview.src = cardData.file;
          preview.className = "file-preview";
          card.appendChild(preview);
        }
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
                <input type="text" id="text-${columnId}-${cardIndex}" value="${cardData.text}" />
              </label>
              <label>Comentário:
                <textarea id="comment-${columnId}-${cardIndex}">${cardData.comment || ""}</textarea>
              </label>
              <label>Data:
                <input type="date" id="date-${columnId}-${cardIndex}" value="${cardData.date || ""}" />
              </label>
              <label>Etiqueta:
                <select id="label-${columnId}-${cardIndex}">
                  <option value="">Nenhuma</option>
                  <option value="#ffc107">Amarela</option>
                  <option value="#28a745">Verde</option>
                  <option value="#17a2b8">Azul</option>
                  <option value="#dc3545">Vermelha</option>
                </select>
              </label>
              <label>Anexo:
                <div class="file-wrapper">
                  <label class="file-button" for="file-${columnId}-${cardIndex}">📁 Selecionar documento</label>
                  <input type="file" id="file-${columnId}-${cardIndex}" style="display:none;" />
                </div>
                ${cardData.file ? `
                  <div class="card-attachment">
                    <a href="${cardData.file}" target="_blank">📎 Ver Anexo</a>
                    <button type="button" class="remove-file" onclick="removeFile('${columnId}', ${cardIndex})">❌ Remover</button>
                  </div>` : ""}
              </label>
              <label>Tags (separadas por vírgula):
                <input type="text" id="tags-${columnId}-${index}" value="${(cardData.tags || []).join(', ')}" />
              </label>
              <div class="card-actions">
                <button onclick="saveInline('${columnId}', ${cardIndex})" class="btn primary">Salvar</button>
                <button onclick="deleteInline('${columnId}', ${cardIndex})" class="btn danger">Excluir</button>
                <button onclick="collapseInline(this)" class="btn secondary">Fechar</button>
              </div>
            </div>
          `;
          card.appendChild(details);
          document.getElementById(`label-${columnId}-${cardIndex}`).value = cardData.label;
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


function addCard(column) {
  const content = prompt("Conteúdo do cartão:");
  if (!content || !currentProject) return;

  const newCard = {
    text: content,
    comment: "",
    date: "",
    label: "",
    file: "",
    tags: []
  };

  allProjects[currentProject][column].push(newCard);
  renderCards();
  saveCards();
}

function deleteInline(columnId, index) {
  allProjects[currentProject][columnId].splice(index, 1);
  renderCards();
  saveCards();
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

  const tagInput = document.getElementById(`tags-${columnId}-${index}`);
  if (tagInput) {
    card.tags = tagInput.value
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  renderCards();
  saveCards();
}

function collapseInline(button) {
  const card = button.closest(".card");
  card.classList.remove("expanded");
  const details = card.querySelector(".card-details");
  if (details) details.remove();
}

function removeFile(columnId, index) {
  allProjects[currentProject][columnId][index].file = "";
  renderCards();
  saveCards();
}
// 🎯 Filtro por texto
function filterCards(query) {
  const searchText = query.trim().toLowerCase();
  const columns = document.querySelectorAll(".column");

  columns.forEach(col => {
    const columnId = col.dataset.column;
    const cards = col.querySelectorAll(".card");
    const cardDataList = allProjects[currentProject][columnId];
    let hasVisibleCard = false;

    cards.forEach((card, index) => {
      const data = cardDataList[index];
      const text = (data.text || "").toLowerCase();
      const comment = (data.comment || "").toLowerCase();
      const dateVariants = formatDateVariants(data.date || "").toLowerCase();
      const label = (data.label || "").toLowerCase();
      const file = (data.file || "").toLowerCase();
      const content = `${text} ${comment} ${dateVariants} ${label} ${file}`;
      const isMatch = content.includes(searchText) || searchText === "";

      card.style.display = isMatch ? "" : "none";
      if (isMatch) hasVisibleCard = true;
    });

    col.style.display = hasVisibleCard ? "" : "none";
  });
}

// 📆 Variações de data para busca
function formatDateVariants(dateStr) {
  if (!dateStr || !dateStr.includes("-")) return "";
  const [year, month, day] = dateStr.split("-");
  return `${year}-${month}-${day} ${day}/${month}/${year} ${day}-${month}-${year}`;
}

// 🏷️ Filtro por tags
function filterByTag(tagName) {
  const allCards = document.querySelectorAll(".card");
  allCards.forEach(card => {
    const tags = card.querySelectorAll(".card-tag");
    const match = Array.from(tags).some(t => t.textContent.toLowerCase() === tagName.toLowerCase());
    card.style.display = match ? "" : "none";
  });
}

// 📝 Edita título da coluna
function makeTitleEditable(titleElement, columnId) {
  const wrapper = titleElement.parentElement;

  const input = document.createElement("input");
  input.type = "text";
  input.value = columnId;
  input.className = "title-input";

  const saveBtn = document.createElement("button");
  saveBtn.textContent = "💾";
  saveBtn.className = "save-title-btn";

  titleElement.remove();
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

// ➕ Adiciona nova coluna
function addColumn() {
  const input = document.getElementById("newColumnName");
  const name = input.value.trim();
  if (!name || allProjects[currentProject][name]) return;

  allProjects[currentProject][name] = [];
  input.value = "";
  renderCards();
  saveCards();
}

// 🧭 Posiciona botão flutuante
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

// 🗑️ Exclui coluna
function deleteColumn(columnId) {
  const confirmado = confirm(`Tem certeza que deseja excluir a coluna "${columnId}"?`);
  if (!confirmado) return;

  delete allProjects[currentProject][columnId];
  renderCards();
  saveCards();
}

// 🔄 Troca de projeto via <select>
document.getElementById("projectSelect").addEventListener("change", function () {
  currentProject = this.value;
  renderCards();
});

document.getElementById("cardSearch").addEventListener("input", function (e) {
  const query = e.target.value;
  filterCards(query);
});
