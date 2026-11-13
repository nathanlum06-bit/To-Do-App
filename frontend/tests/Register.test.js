/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Register from "../src/views/Register.vue";
import AuthServices from "../src/services/authServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

const validFields = {
  "register-first-name": "Jane",
  "register-last-name": "Doe",
  "register-email": "jdoe@example.com",
  "register-username": "jdoe",
  "register-password": "password123",
  "register-confirm-password": "password123",
};

const fill = async (wrapper, overrides = {}) => {
  const values = { ...validFields, ...overrides };

  for (const [id, value] of Object.entries(values)) {
    await wrapper.get(`#${id}`).setValue(value);
  }
};

const submit = async (wrapper) => {
  await wrapper.get("form").trigger("submit.prevent");
  await flushPromises();
};

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("US-1.1 — Registration", () => {
    it("User submits registration with invalid email format", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fill(wrapper, { "register-email": "notanemail" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Enter a valid email address.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with missing username", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fill(wrapper, { "register-username": "" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Username is required.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with password too short", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fill(wrapper, {
        "register-password": "short",
        "register-confirm-password": "short",
      });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Password must be at least 8 characters.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });

    it("User submits registration with mismatched passwords", async () => {
      const { wrapper } = await mountWithPlugins(Register);
      await fill(wrapper, { "register-confirm-password": "password456" });
      await submit(wrapper);

      expect(wrapper.text()).toContain("Passwords do not match.");
      expect(AuthServices.registerUser).not.toHaveBeenCalled();
    });
  });
});
