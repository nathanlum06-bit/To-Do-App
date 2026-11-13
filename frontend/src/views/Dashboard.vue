<script setup>
import { onMounted, ref } from "vue";
import ListServices from "../services/listServices.js";
import TodoServices from "../services/todoServices.js";

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

const itemsOpen = ref(false);
const itemsList = ref(null);
const todos = ref([]);
const todosLoading = ref(false);
const todosError = ref("");

const addItemOpen = ref(false);
const addItemForm = ref(null);
const addItemTitle = ref("");
const addItemSaving = ref(false);

const editItemOpen = ref(false);
const editItemForm = ref(null);
const editItemTitle = ref("");
const editItemTarget = ref(null);
const editItemSaving = ref(false);

const deleteItemOpen = ref(false);
const deleteItemTarget = ref(null);
const deleteItemSaving = ref(false);

const nameRules = [(value) => !!value?.trim() || "List name is required."];
const titleRules = [(value) => !!value?.trim() || "Todo title is required."];

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

const loadTodos = async () => {
  if (!itemsList.value) {
    return;
  }

  todosLoading.value = true;
  todosError.value = "";

  try {
    const res = await TodoServices.getAll(itemsList.value.id);
    todos.value = res.data;
  } catch (err) {
    todosError.value = err.response?.data?.message || "Unable to load todos.";
  } finally {
    todosLoading.value = false;
  }
};

const openItems = (list) => {
  itemsList.value = list;
  todos.value = [];
  todosError.value = "";
  itemsOpen.value = true;
  loadTodos();
};

const openAddItem = () => {
  addItemTitle.value = "";
  todosError.value = "";
  addItemOpen.value = true;
};

const createItem = async () => {
  const { valid } = await addItemForm.value.validate();

  if (!valid) {
    return;
  }

  addItemSaving.value = true;
  todosError.value = "";

  try {
    await TodoServices.create(itemsList.value.id, { title: addItemTitle.value.trim() });
    addItemOpen.value = false;
    await loadTodos();
  } catch (err) {
    todosError.value = err.response?.data?.message || "Unable to create todo.";
  } finally {
    addItemSaving.value = false;
  }
};

const toggleComplete = async (todo, completed) => {
  todosError.value = "";

  try {
    await TodoServices.update(todo.id, { completed: Boolean(completed) });
    await loadTodos();
  } catch (err) {
    todosError.value = err.response?.data?.message || "Unable to update todo.";
  }
};

const openEditItem = (todo) => {
  editItemTarget.value = todo;
  editItemTitle.value = todo.title;
  todosError.value = "";
  editItemOpen.value = true;
};

const saveEditItem = async () => {
  const { valid } = await editItemForm.value.validate();

  if (!valid) {
    return;
  }

  editItemSaving.value = true;
  todosError.value = "";

  try {
    await TodoServices.update(editItemTarget.value.id, { title: editItemTitle.value.trim() });
    editItemOpen.value = false;
    await loadTodos();
  } catch (err) {
    todosError.value = err.response?.data?.message || "Unable to update todo.";
  } finally {
    editItemSaving.value = false;
  }
};

const openDeleteItem = (todo) => {
  deleteItemTarget.value = todo;
  todosError.value = "";
  deleteItemOpen.value = true;
};

const confirmDeleteItem = async () => {
  deleteItemSaving.value = true;
  todosError.value = "";

  try {
    await TodoServices.delete(deleteItemTarget.value.id);
    deleteItemOpen.value = false;
    await loadTodos();
  } catch (err) {
    todosError.value = err.response?.data?.message || "Unable to delete todo.";
  } finally {
    deleteItemSaving.value = false;
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
                icon="mdi-format-list-bulleted"
                size="small"
                variant="text"
                :aria-label="`View items for ${list.name}`"
                @click="openItems(list)"
              />
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

    <v-dialog v-model="itemsOpen" max-width="640">
      <v-card>
        <v-card-item>
          <v-card-title>{{ itemsList?.name }} — Items</v-card-title>
          <template #append>
            <v-btn color="primary" variant="elevated" class="oc-cta" @click="openAddItem">
              + Add Item
            </v-btn>
          </template>
        </v-card-item>

        <v-card-text>
          <v-progress-linear v-if="todosLoading" indeterminate class="mb-4" />
          <v-alert v-if="todosError" type="error" class="mb-4">{{ todosError }}</v-alert>
          <p v-if="!todosLoading && todos.length === 0">No todos in this list yet.</p>

          <v-list v-if="todos.length > 0">
            <v-list-item v-for="todo in todos" :key="todo.id">
              <template #prepend>
                <v-checkbox
                  :model-value="todo.completed"
                  hide-details
                  density="compact"
                  :aria-label="`Toggle ${todo.title}`"
                  @update:model-value="(value) => toggleComplete(todo, value)"
                />
              </template>
              <v-list-item-title
                :class="{ 'todo-completed': todo.completed }"
              >
                {{ todo.title }}
              </v-list-item-title>
              <template #append>
                <v-btn
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  aria-label="Edit item"
                  @click="openEditItem(todo)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  aria-label="Delete item"
                  @click="openDeleteItem(todo)"
                />
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="itemsOpen = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="addItemOpen" max-width="480">
      <v-card>
        <v-card-title>Add item</v-card-title>
        <v-card-text>
          <v-form ref="addItemForm" @submit.prevent="createItem">
            <v-text-field
              v-model="addItemTitle"
              label="Todo title"
              :rules="titleRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="addItemOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="addItemSaving" @click="createItem">
            Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editItemOpen" max-width="480">
      <v-card>
        <v-card-title>Edit item</v-card-title>
        <v-card-text>
          <v-form ref="editItemForm" @submit.prevent="saveEditItem">
            <v-text-field
              v-model="editItemTitle"
              label="Todo title"
              :rules="titleRules"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="editItemOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="editItemSaving" @click="saveEditItem">
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteItemOpen" max-width="480">
      <v-card>
        <v-card-title>Delete item</v-card-title>
        <v-card-text>
          Delete {{ deleteItemTarget?.title }}? This cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="secondary" variant="text" @click="deleteItemOpen = false">Cancel</v-btn>
          <v-btn color="primary" variant="elevated" class="oc-cta" :loading="deleteItemSaving" @click="confirmDeleteItem">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.todo-completed {
  text-decoration: line-through;
  opacity: 0.7;
}
</style>
