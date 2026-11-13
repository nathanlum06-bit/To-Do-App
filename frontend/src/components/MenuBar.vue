<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const route = useRoute();
const router = useRouter();
const user = ref(Utils.getStore("user"));

const visible = computed(() => !["login", "register"].includes(route.name));
const displayName = computed(() => {
  if (!user.value) {
    return "";
  }

  const fullName = [user.value.fName, user.value.lName].filter(Boolean).join(" ");
  return fullName || user.value.username || "";
});

const refreshUser = () => {
  user.value = Utils.getStore("user");
};

const signOut = async () => {
  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    user.value = null;
    await router.push({ name: "login" });
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
    <span class="px-4">{{ displayName }}</span>
    <v-btn variant="text" class="oc-cta me-2" @click="signOut">Sign out</v-btn>
  </v-app-bar>
</template>
