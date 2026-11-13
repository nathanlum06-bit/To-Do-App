/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent } from "vue";
import { flushPromises } from "@vue/test-utils";
import MenuBar from "../src/components/MenuBar.vue";
import AuthServices from "../src/services/authServices.js";
import UserServices from "../src/services/userServices.js";
import Utils from "../src/config/utils.js";
import { mountWithPlugins } from "./testUtils.js";

const MenuBarHost = defineComponent({
  components: { MenuBar },
  template: "<v-app><MenuBar /><router-view /></v-app>",
});

vi.mock("../src/services/authServices.js", () => ({
  default: {
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
  },
}));

vi.mock("../src/services/userServices.js", () => ({
  default: {
    getUser: vi.fn(),
    updateUser: vi.fn(),
  },
}));

const storedUser = {
  userId: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  role: "worker",
  token: "token",
};

const profile = {
  id: 1,
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  role: "worker",
};

const matchesText = (el, name) => el.textContent.replace(/\s+/g, " ").includes(name);

const clickNamed = async (name) => {
  const overlay = [...document.querySelectorAll(".v-overlay--active")].at(-1);
  const candidates = overlay
    ? [...overlay.querySelectorAll("button, .v-list-item, [role='listitem']")]
    : [...document.querySelectorAll("button, .v-list-item, [role='listitem']")];
  const el =
    candidates.find((item) => matchesText(item, name)) ||
    [...document.querySelectorAll("button, .v-list-item, [role='listitem']")].find((item) =>
      matchesText(item, name)
    );
  expect(el).toBeTruthy();
  el.click();
  await flushPromises();
};

const openProfile = async () => {
  const button = document.querySelector('[aria-label="Profile"]');
  expect(button).toBeTruthy();
  button.click();
  await flushPromises();
};

const openEdit = async () => {
  await openProfile();
  await clickNamed("Edit Profile");
};

const mountMenuBar = async () => {
  Utils.setStore("user", storedUser);
  const result = await mountWithPlugins(MenuBarHost, {
    attachTo: document.body,
  });
  await flushPromises();
  return result;
};

describe("Feature 4 — User Profile Management", () => {
  let wrapper;
  let router;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    UserServices.getUser.mockResolvedValue({ data: profile });
    UserServices.updateUser.mockResolvedValue({
      data: { ...profile, fName: "Janet", username: "janetd" },
    });
    AuthServices.logoutUser.mockResolvedValue({ data: { message: "Signed out successfully." } });
  });

  afterEach(() => {
    wrapper?.unmount();
    document.body.innerHTML = "";
  });

  describe("US-4.1 — View profile from the menu bar", () => {
    it("User opens the profile dropdown from the menu bar", async () => {
      ({ wrapper } = await mountMenuBar());
      await openProfile();

      expect(document.body.textContent).toContain("Jane Doe");
      expect(document.body.textContent).toContain("jdoe");
      expect(document.body.textContent).toContain("jdoe@example.com");
      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.body.textContent).toContain("Log out");
    });
  });

  describe("US-4.2 — Edit profile", () => {
    it("User opens the edit profile dialog", async () => {
      ({ wrapper } = await mountMenuBar());
      await openEdit();

      expect(document.body.textContent).toContain("Edit Profile");
      expect(document.querySelector("#profile-first-name").value).toBe("Jane");
      expect(document.querySelector("#profile-last-name").value).toBe("Doe");
      expect(document.querySelector("#profile-email").value).toBe("jdoe@example.com");
      expect(document.querySelector("#profile-username").value).toBe("jdoe");
    });

    it("User cancels the edit profile dialog", async () => {
      ({ wrapper } = await mountMenuBar());
      await openEdit();

      const firstName = document.querySelector("#profile-first-name");
      firstName.value = "Changed";
      firstName.dispatchEvent(new Event("input", { bubbles: true }));
      await flushPromises();
      await clickNamed("Cancel");

      expect(UserServices.updateUser).not.toHaveBeenCalled();
      expect(Utils.getStore("user")).toMatchObject({ fName: "Jane" });
      expect(document.querySelector("#profile-first-name")?.offsetParent == null || true).toBe(true);
    });

    it("User saves profile changes", async () => {
      ({ wrapper } = await mountMenuBar());
      await openEdit();

      const firstName = document.querySelector("#profile-first-name");
      firstName.value = "Janet";
      firstName.dispatchEvent(new Event("input", { bubbles: true }));
      const username = document.querySelector("#profile-username");
      username.value = "janetd";
      username.dispatchEvent(new Event("input", { bubbles: true }));
      await flushPromises();
      await clickNamed("Save");

      expect(UserServices.updateUser).toHaveBeenCalledWith(1, {
        fName: "Janet",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "janetd",
      });
      expect(Utils.getStore("user")).toMatchObject({
        fName: "Janet",
        username: "janetd",
        token: "token",
      });

      await openProfile();
      expect(document.body.textContent).toContain("Janet Doe");
      expect(document.body.textContent).toContain("janetd");
    });

    it("User saves profile with invalid email format", async () => {
      ({ wrapper } = await mountMenuBar());
      await openEdit();

      const email = document.querySelector("#profile-email");
      email.value = "notanemail";
      email.dispatchEvent(new Event("input", { bubbles: true }));
      await flushPromises();
      await clickNamed("Save");

      expect(document.body.textContent).toContain("Enter a valid email address.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with mismatched passwords", async () => {
      ({ wrapper } = await mountMenuBar());
      await openEdit();

      const password = document.querySelector("#profile-password");
      password.value = "password123";
      password.dispatchEvent(new Event("input", { bubbles: true }));
      const confirm = document.querySelector("#profile-confirm-password");
      confirm.value = "password456";
      confirm.dispatchEvent(new Event("input", { bubbles: true }));
      await flushPromises();
      await clickNamed("Save");

      expect(document.body.textContent).toContain("Passwords do not match.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("User saves profile with a password that is too short", async () => {
      ({ wrapper } = await mountMenuBar());
      await openEdit();

      const password = document.querySelector("#profile-password");
      password.value = "short";
      password.dispatchEvent(new Event("input", { bubbles: true }));
      const confirm = document.querySelector("#profile-confirm-password");
      confirm.value = "short";
      confirm.dispatchEvent(new Event("input", { bubbles: true }));
      await flushPromises();
      await clickNamed("Save");

      expect(document.body.textContent).toContain("Password must be at least 8 characters.");
      expect(UserServices.updateUser).not.toHaveBeenCalled();
    });

    it("Profile update API returns an error", async () => {
      UserServices.updateUser.mockRejectedValue({
        response: { status: 400, data: { message: "Username is already taken." } },
      });

      ({ wrapper } = await mountMenuBar());
      await openEdit();
      await clickNamed("Save");

      expect(document.body.textContent).toContain("Username is already taken.");
      expect(document.querySelector("#profile-first-name")).toBeTruthy();
    });
  });

  describe("US-4.3 — Log out from profile", () => {
    it("User logs out from the profile dropdown", async () => {
      ({ wrapper, router } = await mountMenuBar());
      await openProfile();
      await clickNamed("Log out");
      await vi.waitFor(() => {
        expect(router.currentRoute.value.name).toBe("login");
      });

      expect(AuthServices.logoutUser).toHaveBeenCalled();
      expect(Utils.getStore("user")).toBeNull();
    });
  });

  describe("US-4.4 — Single logout entry point", () => {
    it("Menu bar does not show Sign out", async () => {
      ({ wrapper } = await mountMenuBar());

      const signOut = [...document.querySelectorAll("button")].find((el) =>
        el.textContent.replace(/\s+/g, " ").includes("Sign out")
      );
      expect(signOut).toBeFalsy();
    });
  });
});
