<script setup>
import { computed, ref } from "vue";

const search = ref("");

const locais = ref([
  { id: 1, nome: "Codetran", endereco: "Rua tal", referencia: "A" },
  { id: 2, nome: "Cal - Zelinda", endereco: "Rua tal x", referencia: "B" },
  { id: 3, nome: "Centro Pop", endereco: "Rua tal a", referencia: "C" },
  { id: 4, nome: "Zen Tower", endereco: "Rua tal B", referencia: "D" },
  { id: 5, nome: "Inis - CEA", endereco: "Rua tal C", referencia: "E" },
]);

const filteredLocais = computed(() => {
  const term = search.value.trim().toUpperCase();

  if (!term) {
    return locais.value;
  }

  return locais.value.filter((local) => {
    const nome = local.nome.toUpperCase();
    const endereco = local.endereco.toUpperCase();
    const bloco = local.referencia.toUpperCase();

    return (
      nome.startsWith(term) ||
      endereco.startsWith(term) ||
      bloco.startsWith(term)
    );
  });
});

function handleImport() {
  alert("Importar banco: vamos ligar isso já já.");
}

function handleExport() {
  alert("Exportar banco: vamos ligar isso já já.");
}
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
        />
      </div>

      <div class="actions-block">
        <button class="action-button" @click="handleImport">
          Importar banco
        </button>
        <button class="action-button" @click="handleExport">
          Exportar banco
        </button>
      </div>
    </section>

    <section class="results-block">
      <div v-if="filteredLocais.length === 0" class="empty-state">
        Nenhum endereço encontrado.
      </div>

      <div v-else class="results-list">
        <button
          v-for="local in filteredLocais"
          :key="local.id"
          class="result-item"
        >
          <span class="result-name">{{ local.nome }}</span>
          <span class="result-address">{{ local.endereco }}</span>
          <span class="result-block">Referência {{ local.referencia }}</span>
        </button>
      </div>
    </section>
  </main>
</template>
