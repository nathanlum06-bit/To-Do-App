<script setup>
import { onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";

const lists = ref([]);
const loading = ref(false);
const error = ref("");

const addOpen = ref(false);
const addForm = ref(null);
const addName = ref("");
const addSaving = ref(false);

const renameOpen = ref(false);
const renameForm = ref(null);
const renameName = ref("");
const renameTarget = ref(null);
const renameSaving = ref(false);

const deleteOpen = ref(false);
const deleteTarget = ref(null);
const deleteSaving = ref(false);

const nameRules = [(value) => !!value?.trim() || "List name is required."];

const loadLists = async () => {
  loading.value = true;
  error.value = "";

  try {
    const res = await ListServices.getAll();
    lists.value = res.data;
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load lists.";
  } finally {
    loading.value = false;
  }
};

const openAdd = () => {
  addName.value = "";
  error.value = "";
  addOpen.value = true;
};

const createList = async () => {
  const { valid } = await addForm.value.validate();

  if (!valid) {
    return;
  }

  addSaving.value = true;
  error.value = "";

  try {
    await ListServices.create({ name: addName.value.trim() });
    addOpen.value = false;
    await loadLists();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to create list.";
  } finally {
    addSaving.value = false;
  }
};

const openRename = (list) => {
  renameTarget.value = list;
  renameName.value = list.name;
  error.value = "";
  renameOpen.value = true;
};

const saveRename = async () => {
  const { valid } = await renameForm.value.validate();

  if (!valid) {
    return;
  }

  renameSaving.value = true;
  error.value = "";

  try {
    await ListServices.update(renameTarget.value.id, { name: renameName.value.trim() });
    renameOpen.value = false;
    await loadLists();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to rename list.";
  } finally {
    renameSaving.value = false;
  }
};

const openDelete = (list) => {
  deleteTarget.value = list;
  error.value = "";
  deleteOpen.value = true;
};

const confirmDelete = async () => {
  deleteSaving.value = true;
  error.value = "";

  try {
    await ListServices.delete(deleteTarget.value.id);
    deleteOpen.value = false;
    await loadLists();
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to delete list.";
  } finally {
    deleteSaving.value = false;
  }
};

onMounted(loadLists);
</script>

<template>
  <v-container class="py-8">
    <v-card elevation="4">
      <v-card-item>
        <v-card-title>My Lists</v-card-title>
        <template #append>
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAdd">
            + New List
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-progress-linear v-if="loading" indeterminate class="mb-4" />
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
        <p v-if="!loading && lists.length === 0">No lists yet. Create your first list.</p>

        <v-list v-if="lists.length > 0">
          <v-list-item v-for="list in lists" :key="list.id" :title="list.name">
            <template #append>
              <v-btn
                icon="mdi-pencil"
                size="small"
                variant="text"
                aria-label="Edit list"
                @click="openRename(list)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                aria-label="Delete list"
                @click="openDelete(list)"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-dialog v-model="addOpen" max-width="480">
      <v-card>
        <v-card-title>New list</v-card-title>
        <v-card-text>
          <v-form ref="addForm" @submit.prevent="createList">
            <v-text-field
              v-model="addName"
              label="List name"
              :rules="nameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="addSaving" @click="createList">
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="renameOpen" max-width="480">
      <v-card>
        <v-card-title>Rename list</v-card-title>
        <v-card-text>
          <v-form ref="renameForm" @submit.prevent="saveRename">
            <v-text-field
              v-model="renameName"
              label="List name"
              :rules="nameRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="renameOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="renameSaving" @click="saveRename">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteOpen" max-width="480">
      <v-card>
        <v-card-title>Delete list</v-card-title>
        <v-card-text>
          Delete {{ deleteTarget?.name }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="deleteSaving" @click="confirmDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
