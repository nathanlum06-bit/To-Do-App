<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import UserServices from "../services/userServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const route = useRoute();
const router = useRouter();
const user = ref(Utils.getStore("user"));

const editOpen = ref(false);
const editForm = ref(null);
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const saving = ref(false);
const error = ref("");

const visible = computed(() => !["login", "register"].includes(route.name));
const fullName = computed(() => {
  if (!user.value) {
    return "";
  }

  return [user.value.fName, user.value.lName].filter(Boolean).join(" ");
});

const requiredRule = (label) => (value) => !!value?.trim() || `${label} is required.`;
const fNameRules = [requiredRule("First name")];
const lNameRules = [requiredRule("Last name")];
const usernameRules = [requiredRule("Username")];
const passwordRules = [
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  (value) => {
    if (!password.value && !value) {
      return true;
    }

    return value === password.value || "Passwords do not match.";
  },
];

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

const logOut = async () => {
  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    user.value = null;
    await router.push({ name: "login" });
  }
};

const fillFromUser = (source) => {
  fName.value = source?.fName || "";
  lName.value = source?.lName || "";
  email.value = source?.email || "";
  username.value = source?.username || "";
  password.value = "";
  confirmPassword.value = "";
};

const openEdit = async () => {
  error.value = "";
  fillFromUser(user.value);
  editOpen.value = true;

  const userId = user.value?.userId;
  if (!userId) {
    return;
  }

  try {
    const res = await UserServices.getUser(userId);
    fillFromUser(res.data);
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to load profile.";
  }
};

const cancelEdit = () => {
  editOpen.value = false;
};

const saveProfile = async () => {
  error.value = "";
  const { valid } = await editForm.value.validate();

  if (!valid) {
    return;
  }

  saving.value = true;

  try {
    const payload = {
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
    };

    if (password.value) {
      payload.password = password.value;
    }

    const res = await UserServices.updateUser(user.value.userId, payload);
    const current = Utils.getStore("user") || {};
    Utils.setStore("user", {
      ...current,
      userId: res.data.id ?? current.userId,
      fName: res.data.fName,
      lName: res.data.lName,
      email: res.data.email,
      username: res.data.username,
      role: res.data.role ?? current.role,
    });
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    editOpen.value = false;
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to update profile.";
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  window.addEventListener("user-logged-in", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("user-logged-in", refreshUser);
});
</script>

<template>
  <v-app-bar v-if="visible" color="primary" density="comfortable">
    <v-app-bar-title>Todo</v-app-bar-title>
    <v-spacer />
    <v-menu location="bottom end">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon="mdi-account-circle"
          variant="text"
          aria-label="Profile"
          class="me-2"
        />
      </template>
      <v-card min-width="280">
        <v-list>
          <v-list-item :title="fullName">
            <v-list-item-subtitle>{{ user?.username }}</v-list-item-subtitle>
            <v-list-item-subtitle>{{ user?.email }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-card-actions class="px-4 pb-2">
          <v-btn color="primary" variant="elevated" class="oc-cta" @click="openEdit">
            Edit Profile
          </v-btn>
        </v-card-actions>
        <v-list>
          <v-list-item title="Log out" @click="logOut" />
        </v-list>
      </v-card>
    </v-menu>
  </v-app-bar>

  <v-dialog v-model="editOpen" max-width="480">
    <v-card>
      <v-card-title>Edit Profile</v-card-title>
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
        <v-form ref="editForm" @submit.prevent="saveProfile">
          <v-text-field
            id="profile-first-name"
            v-model="fName"
            label="First name"
            :rules="fNameRules"
          />
          <v-text-field
            id="profile-last-name"
            v-model="lName"
            label="Last name"
            :rules="lNameRules"
          />
          <v-text-field
            id="profile-email"
            v-model="email"
            label="Email"
            type="email"
            :rules="emailRules"
          />
          <v-text-field
            id="profile-username"
            v-model="username"
            label="Username"
            :rules="usernameRules"
          />
          <v-text-field
            id="profile-password"
            v-model="password"
            label="New password"
            type="password"
            :rules="passwordRules"
          />
          <v-text-field
            id="profile-confirm-password"
            v-model="confirmPassword"
            label="Confirm password"
            type="password"
            :rules="confirmPasswordRules"
          />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="secondary" variant="text" @click="cancelEdit">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          class="oc-cta"
          :loading="saving"
          @click="saveProfile"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
