<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import AuthServices from "../services/authServices.js";
import Utils from "../config/utils.js";
import { emailRules } from "../config/validation.js";

const router = useRouter();
const form = ref(null);
const fName = ref("");
const lName = ref("");
const email = ref("");
const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");

const requiredRule = (label) => (value) => !!value?.trim() || `${label} is required.`;
const fNameRules = [requiredRule("First name")];
const lNameRules = [requiredRule("Last name")];
const usernameRules = [requiredRule("Username")];
const passwordRules = [
  requiredRule("Password"),
  (value) => !value || value.length >= 8 || "Password must be at least 8 characters.",
];
const confirmPasswordRules = [
  requiredRule("Confirm password"),
  (value) => value === password.value || "Passwords do not match.",
];

const createAccount = async () => {
  error.value = "";
  const { valid } = await form.value.validate();

  if (!valid) {
    return;
  }

  loading.value = true;

  try {
    const res = await AuthServices.registerUser({
      fName: fName.value.trim(),
      lName: lName.value.trim(),
      email: email.value.trim(),
      username: username.value.trim(),
      password: password.value,
    });
    Utils.setStore("user", res.data);
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    await router.push({ name: "home" });
  } catch (err) {
    error.value = err.response?.data?.message || "Unable to create account.";
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card class="pa-4" elevation="4">
          <v-card-title class="text-h5">Create account</v-card-title>
          <v-card-text>
            <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
            <v-form ref="form" @submit.prevent="createAccount">
              <v-text-field
                id="register-first-name"
                v-model="fName"
                label="First name"
                autocomplete="given-name"
                :rules="fNameRules"
                class="mb-2"
              />
              <v-text-field
                id="register-last-name"
                v-model="lName"
                label="Last name"
                autocomplete="family-name"
                :rules="lNameRules"
                class="mb-2"
              />
              <v-text-field
                id="register-email"
                v-model="email"
                label="Email"
                type="email"
                autocomplete="email"
                :rules="emailRules"
                class="mb-2"
              />
              <v-text-field
                id="register-username"
                v-model="username"
                label="Username"
                autocomplete="username"
                :rules="usernameRules"
                class="mb-2"
              />
              <v-text-field
                id="register-password"
                v-model="password"
                label="Password"
                type="password"
                autocomplete="new-password"
                :rules="passwordRules"
                class="mb-2"
              />
              <v-text-field
                id="register-confirm-password"
                v-model="confirmPassword"
                label="Confirm password"
                type="password"
                autocomplete="new-password"
                :rules="confirmPasswordRules"
                class="mb-4"
              />
              <v-btn
                type="submit"
                color="primary"
                variant="elevated"
                class="oc-cta"
                :loading="loading"
                block
              >
                Create account
              </v-btn>
            </v-form>
          </v-card-text>
          <v-card-actions class="px-4 pb-4">
            <router-link :to="{ name: 'login' }">Already have an account? Sign in</router-link>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
