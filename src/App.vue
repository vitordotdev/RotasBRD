<script setup>
import { computed, onMounted, ref } from "vue";
import { loadDatabase, saveDatabase } from "./services/db";

const search = ref("");
const fileInput = ref(null);

const hasDatabase = ref(false);
const db = ref(null);

const formMode = ref(null); // null | "add" | "edit"
const editingId = ref(null);

const form = ref({
  nome: "",
  endereco: "",
  referencia: "",
});

function createEmptyDatabase() {
  return {
    version: 1,
    updatedAt: null,
    updatedBy: "Admin",
    locais: [],
  };
}

const filteredLocais = computed(() => {
  if (!db.value || !Array.isArray(db.value.locais)) return [];

  const term = search.value.trim().toLowerCase();

  if (!term) return db.value.locais;

  return db.value.locais.filter((local) => {
    return (
      local.nome.toLowerCase().startsWith(term) ||
      local.endereco.toLowerCase().startsWith(term) ||
      local.referencia.toLowerCase().startsWith(term)
    );
  });
});

function validateDatabase(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.locais)) return false;

  for (const local of data.locais) {
    if (typeof local !== "object") return false;
    if (typeof local.id !== "string") return false;
    if (typeof local.nome !== "string") return false;
    if (typeof local.endereco !== "string") return false;
    if (typeof local.referencia !== "string") return false;
  }

  return true;
}

function touchDatabase() {
  if (!db.value) return;
  db.value.updatedAt = new Date().toISOString();
  db.value.updatedBy = "Vitor";
}

async function hydrateFromIndexedDB() {
  try {
    const savedDatabase = await loadDatabase();

    if (!savedDatabase || !validateDatabase(savedDatabase)) {
      hasDatabase.value = false;
      db.value = createEmptyDatabase();
      return;
    }

    db.value = savedDatabase;
    hasDatabase.value = true;
  } catch (error) {
    console.error("Erro ao carregar IndexedDB:", error);
    hasDatabase.value = false;
    db.value = createEmptyDatabase();
  }
}

async function persistDatabase() {
  try {
    if (!db.value) return;

    const cleanData = JSON.parse(JSON.stringify(db.value));

    await saveDatabase(cleanData);

    console.log("Banco salvo no IndexedDB com sucesso");
  } catch (error) {
    console.error("Erro real ao salvar no IndexedDB:", error);
    alert("Erro ao salvar dados localmente.");
  }
}

function triggerImport() {
  fileInput.value?.click();
}

async function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!validateDatabase(parsed)) {
      alert("Arquivo JSON inválido.");
      return;
    }

    await saveDatabase(parsed);
    await hydrateFromIndexedDB();

    cancelForm();
    alert("Banco importado com sucesso.");
  } catch (error) {
    console.error(error);
    alert("Erro ao importar o banco.");
  }

  event.target.value = "";
}

function handleExport() {
  try {
    if (!db.value) {
      alert("Nenhum banco disponível para exportar.");
      return;
    }

    const dataToExport = {
      ...db.value,
      updatedAt: new Date().toISOString(),
      updatedBy: "Vitor",
    };

    const json = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "rotasbrd.json";
    link.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    alert("Erro ao exportar o banco.");
  }
}

function handleGoTo(local) {
  const query = encodeURIComponent(local.endereco);
  const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
  window.location.href = url;
}

function startAdd() {
  formMode.value = "add";
  editingId.value = null;
  form.value = {
    nome: "",
    endereco: "",
    referencia: "",
  };
}

function startEdit(local) {
  formMode.value = "edit";
  editingId.value = local.id;
  form.value = {
    nome: local.nome,
    endereco: local.endereco,
    referencia: local.referencia,
  };
}

function cancelForm() {
  formMode.value = null;
  editingId.value = null;
  form.value = {
    nome: "",
    endereco: "",
    referencia: "",
  };
}

async function saveForm() {
  if (!db.value) return;

  const nome = form.value.nome.trim();
  const endereco = form.value.endereco.trim();
  const referencia = form.value.referencia.trim();

  if (!nome || !endereco || !referencia) {
    alert("Preencha todos os campos.");
    return;
  }

  if (formMode.value === "add") {
    db.value.locais.push({
      id: crypto.randomUUID(),
      nome,
      endereco,
      referencia,
    });
  }

  if (formMode.value === "edit") {
    const local = db.value.locais.find((item) => item.id === editingId.value);
    if (!local) return;

    local.nome = nome;
    local.endereco = endereco;
    local.referencia = referencia;
  }

  touchDatabase();
  await persistDatabase();
  cancelForm();
}

async function handleDelete(localId) {
  if (!db.value) return;

  const confirmed = confirm("Deseja realmente excluir este local?");
  if (!confirmed) return;

  db.value.locais = db.value.locais.filter((local) => local.id !== localId);

  if (editingId.value === localId) {
    cancelForm();
  }

  touchDatabase();
  await persistDatabase();
}

onMounted(async () => {
  await hydrateFromIndexedDB();
});
</script>

<template>
  <main class="app-container">
    <h1 class="app-title">Rotas BRD</h1>

    <section class="top-bar">
      <div class="search-block">
        <input
          v-model="search"
          type="text"
          class="search-input"
          placeholder="Digite para buscar endereços..."
          :disabled="!hasDatabase"
        />
      </div>

      <div class="actions-block">
        <button class="action-button" @click="triggerImport">
          Importar banco
        </button>

        <button
          class="action-button"
          @click="handleExport"
          :disabled="!hasDatabase"
        >
          Exportar banco
        </button>

        <button
          class="action-button"
          @click="startAdd"
          :disabled="!hasDatabase"
        >
          Adicionar local
        </button>

        <input
          ref="fileInput"
          type="file"
          accept=".json,application/json"
          style="display: none"
          @change="handleImport"
        />
      </div>
    </section>

    <section v-if="!hasDatabase" class="empty-db-block">
      <h2 class="section-title">Nenhum banco encontrado</h2>
      <p class="empty-state">
        Importe um arquivo JSON para começar a usar o Rotas BRD.
      </p>
      <button class="action-button" @click="triggerImport">
        Importar banco
      </button>
    </section>

    <template v-else>
      <section v-if="formMode" class="edit-block">
        <h2 class="section-title">
          {{ formMode === "add" ? "Adicionar local" : "Editar local" }}
        </h2>

        <div class="form-grid">
          <input
            v-model="form.nome"
            type="text"
            class="search-input"
            placeholder="Nome"
          />
          <input
            v-model="form.endereco"
            type="text"
            class="search-input"
            placeholder="Endereço"
          />
          <input
            v-model="form.referencia"
            type="text"
            class="search-input"
            placeholder="Ponto de referência"
          />
        </div>

        <div class="result-actions">
          <button class="action-button" @click="saveForm">Salvar</button>
          <button class="action-button" @click="cancelForm">Cancelar</button>
        </div>
      </section>

      <section class="results-block">
        <div v-if="filteredLocais.length === 0" class="empty-state">
          Nenhum endereço encontrado.
        </div>

        <div v-else class="results-list">
          <div
            v-for="local in filteredLocais"
            :key="local.id"
            class="result-item"
          >
            <span class="result-name">{{ local.nome }}</span>
            <span class="result-address">Endereço: {{ local.endereco }}</span>
            <span class="result-block">
              Ponto de Referência: {{ local.referencia }}
            </span>

            <div class="result-actions">
              <button class="action-button" @click="handleGoTo(local)">
                Rotas
              </button>
              <button class="action-button" @click="startEdit(local)">
                Editar
              </button>
              <button
                class="action-button delete-button"
                @click="handleDelete(local.id)"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>
