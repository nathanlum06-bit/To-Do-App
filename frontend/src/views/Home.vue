<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";

const router = useRouter();
const user = computed(() => Utils.getStore("user"));
const firstName = computed(() => user.value?.fName || "");

const signOut = async () => {
  try {
    await AuthServices.logoutUser();
  } finally {
    Utils.removeItem("user");
    await router.push({ name: "login" });
  }
};
</script>

<template>
  <v-container class="py-10">
    <h1 class="text-h4 mb-6">Welcome, {{ firstName }}</h1>
    <v-btn color="primary" variant="elevated" class="oc-cta" @click="signOut">
      Sign out
    </v-btn>
  </v-container>
</template>
