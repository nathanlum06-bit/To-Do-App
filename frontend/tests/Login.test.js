/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Login from "../src/views/Login.vue";
import AuthServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const submit = async (wrapper) => {
  await wrapper.get("form").trigger("submit.prevent");
  await flushPromises();
};

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with invalid password", async () => {
      AuthServices.loginUser.mockRejectedValue({
        response: { data: { message: "Invalid username or password." }, status: 401 },
      });

      const { wrapper } = await mountWithPlugins(Login);
      await wrapper.get("#login-username").setValue("jdoe");
      await wrapper.get("#login-password").setValue("wrong-password");
      await submit(wrapper);

      expect(AuthServices.loginUser).toHaveBeenCalled();
      expect(wrapper.find(".v-alert").exists()).toBe(true);
      expect(wrapper.text()).toContain("Invalid username or password.");
    });

    it("User signs in with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      await wrapper.get("#login-password").setValue("password123");
      await submit(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });

    it("User signs in with missing password", async () => {
      const { wrapper } = await mountWithPlugins(Login);
      await wrapper.get("#login-username").setValue("jdoe");
      await submit(wrapper);

      expect(wrapper.text()).toContain("Password is required.");
      expect(AuthServices.loginUser).not.toHaveBeenCalled();
    });
  });
});
