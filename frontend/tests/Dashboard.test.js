/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import ListServices from "../src/services/listServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 1 };

const mountDashboard = async () => {
  const result = await mountWithPlugins(Dashboard, { attachTo: document.body });
  await flushPromises();
  return result;
};

const clickNamed = async (name) => {
  const button = [...document.querySelectorAll("button")].find((el) =>
    el.textContent.replace(/\s+/g, " ").includes(name)
  );
  expect(button).toBeTruthy();
  button.click();
  await flushPromises();
};

const visibleInput = () =>
  [...document.querySelectorAll("input")].find((el) => el.offsetParent !== null) ??
  document.querySelector("input");

describe("Feature 2 — Todo List Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    ListServices.getAll.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      ListServices.getAll
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [groceries] });
      ListServices.create.mockResolvedValue({ data: groceries });

      ({ wrapper } = await mountDashboard());
      await clickNamed("+ New List");

      const input = visibleInput();
      expect(input).toBeTruthy();
      input.value = "Groceries";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await flushPromises();
      await clickNamed("Create");

      expect(ListServices.create).toHaveBeenCalledWith({ name: "Groceries" });
      expect(wrapper.text()).toContain("Groceries");
    });

    it("User creates a list with an empty name", async () => {
      ({ wrapper } = await mountDashboard());
      await clickNamed("+ New List");
      await clickNamed("Create");

      expect(document.body.textContent).toContain("List name is required.");
      expect(ListServices.create).not.toHaveBeenCalled();
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      ListServices.getAll.mockResolvedValue({
        data: [
          { id: 1, name: "Personal", userId: 1 },
          { id: 2, name: "Work", userId: 1 },
        ],
      });

      ({ wrapper } = await mountDashboard());

      expect(wrapper.text()).toContain("Personal");
      expect(wrapper.text()).toContain("Work");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });

    it("User has no lists", async () => {
      ({ wrapper } = await mountDashboard());

      expect(wrapper.text()).toContain("No lists yet. Create your first list.");
    });
  });

  describe("US-2.3 — Manage list rows", () => {
    it("List rows show edit and delete actions", async () => {
      ListServices.getAll.mockResolvedValue({ data: [groceries] });
      ({ wrapper } = await mountDashboard());

      expect(wrapper.text()).toContain("Groceries");
      expect(wrapper.find('[aria-label="Edit list"]').exists()).toBe(true);
      expect(wrapper.find('[aria-label="Delete list"]').exists()).toBe(true);
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      ListServices.getAll
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [{ id: 1, name: "Shopping", userId: 1 }] });
      ListServices.update.mockResolvedValue({ data: { id: 1, name: "Shopping", userId: 1 } });

      ({ wrapper } = await mountDashboard());
      await wrapper.get('[aria-label="Edit list"]').trigger("click");
      await flushPromises();

      const input = visibleInput();
      expect(input).toBeTruthy();
      input.value = "Shopping";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await flushPromises();
      await clickNamed("Save");

      expect(ListServices.update).toHaveBeenCalledWith(1, { name: "Shopping" });
      expect(wrapper.text()).toContain("Shopping");
      expect(wrapper.text()).not.toContain("Groceries");
    });

    it("User deletes a list", async () => {
      ListServices.getAll
        .mockResolvedValueOnce({ data: [groceries] })
        .mockResolvedValueOnce({ data: [] });
      ListServices.delete.mockResolvedValue({ status: 200 });

      ({ wrapper } = await mountDashboard());
      await wrapper.get('[aria-label="Delete list"]').trigger("click");
      await flushPromises();
      await clickNamed("Delete");

      expect(ListServices.delete).toHaveBeenCalledWith(1);
      expect(wrapper.text()).not.toContain("Groceries");
    });
  });
});
