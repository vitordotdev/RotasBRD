<script setup>
import { computed, onMounted, ref } from "vue";
import { db } from "./firebase.js";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
} from "firebase/firestore";

const search = ref("");
const fileInput = ref(null);
const locais = ref([]);

const hasDatabase = computed(() => locais.value.length > 0);

const formMode = ref(null); // null | "add" | "edit"
const editingId = ref(null);

const form = ref({
  nome: "",
  endereco: "",
  referencia: "",
});

const filteredLocais = computed(() => {
  if (!locais.value || !Array.isArray(locais.value)) return [];

  const term = search.value.trim().toLowerCase();

  if (!term) return locais.value;

  return locais.value.filter((local) => {
    return (
      local.nome.toLowerCase().includes(term) ||
      local.endereco.toLowerCase().includes(term) ||
      local.referencia.toLowerCase().includes(term)
    );
  });
});

async function loadLocaisFromFirestore() {
  try {
    const locaisCollection = collection(db, "locais");
    const localSnapshot = await getDocs(locaisCollection);
    const locaisList = localSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    locais.value = locaisList;
    console.log("Locais carregados do Firestore com sucesso!");
  } catch (error) {
    console.error("Erro ao carregar locais do Firestore:", error);
    alert("Erro ao carregar dados do Firebase.");
    locais.value = [];
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

    if (!parsed || !Array.isArray(parsed.locais)) {
      alert(
        "Arquivo JSON inválido ou formato inesperado. Esperado um objeto com array 'locais'.",
      );
      return;
    }

    const locaisCollection = collection(db, "locais");

    for (const local of parsed.locais) {
      await setDoc(doc(locaisCollection, local.id), {
        nome: local.nome,
        endereco: local.endereco,
        referencia: local.referencia,
        createdAt: local.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    await loadLocaisFromFirestore();
    cancelForm();
    alert("Banco importado para o Firebase com sucesso.");
  } catch (error) {
    console.error(error);
    alert("Erro ao importar o banco para o Firebase.");
  }

  event.target.value = "";
}

function handleExport() {
  try {
    if (!hasDatabase.value) {
      alert("Nenhum banco disponível para exportar.");
      return;
    }

    const dataToExport = {
      version: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: "Vitor",
      locais: locais.value,
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
  const nome = form.value.nome.trim();
  const endereco = form.value.endereco.trim();
  const referencia = form.value.referencia.trim();

  if (!nome || !endereco || !referencia) {
    alert("Preencha todos os campos.");
    return;
  }

  try {
    if (formMode.value === "add") {
      const newLocal = {
        nome,
        endereco,
        referencia,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addDoc(collection(db, "locais"), newLocal);
      alert("Local adicionado com sucesso!");
    }

    if (formMode.value === "edit") {
      if (!editingId.value) return;

      const localRef = doc(db, "locais", editingId.value);
      await updateDoc(localRef, {
        nome,
        endereco,
        referencia,
        updatedAt: new Date().toISOString(),
      });
      alert("Local atualizado com sucesso!");
    }

    await loadLocaisFromFirestore();
    cancelForm();
  } catch (error) {
    console.error("Erro ao salvar local no Firestore:", error);
    alert("Erro ao salvar dados no Firebase.");
  }
}

async function handleDelete(localId) {
  const confirmed = confirm("Deseja realmente excluir este local?");
  if (!confirmed) return;

  try {
    await deleteDoc(doc(db, "locais", localId));
    alert("Local excluído com sucesso!");

    if (editingId.value === localId) {
      cancelForm();
    }

    await loadLocaisFromFirestore();
  } catch (error) {
    console.error("Erro ao excluir local do Firestore:", error);
    alert("Erro ao excluir dados do Firebase.");
  }
}

onMounted(async () => {
  await loadLocaisFromFirestore();
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

        <button class="action-button" @click="startAdd">Adicionar local</button>

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
      <h2 class="section-title">Nenhum local encontrado no Firebase</h2>
      <p class="empty-state">
        Adicione um novo local ou importe um arquivo JSON para o Firebase.
      </p>
      <button class="action-button" @click="startAdd">
        Adicionar Primeiro Local
      </button>
      <button class="action-button" @click="triggerImport">
        Importar banco JSON
      </button>
    </section>

    <template v-else>
      <section v-if="formMode === 'add'" class="edit-block">
        <h2 class="section-title">Adicionar local</h2>

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
          Nenhum endereço encontrado para sua busca.
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

            <div
              v-if="formMode === 'edit' && editingId === local.id"
              class="edit-inline-block"
            >
              <h2 class="section-title">Editar local</h2>

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
                <button class="action-button" @click="cancelForm">
                  Cancelar
                </button>
              </div>
            </div>

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
