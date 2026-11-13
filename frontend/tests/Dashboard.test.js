/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 *
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { flushPromises } from "@vue/test-utils";
import Dashboard from "../src/views/Dashboard.vue";
import ListServices from "../src/services/listServices.js";
import TodoServices from "../src/services/todoServices.js";
import { mountWithPlugins } from "./testUtils.js";

vi.mock("../src/services/listServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../src/services/todoServices.js", () => ({
  default: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const groceries = { id: 1, name: "Groceries", userId: 1 };
const personal = { id: 2, name: "Personal", userId: 1 };
const work = { id: 3, name: "Work", userId: 1 };
const buyMilk = {
  id: 10,
  listId: 1,
  title: "Buy milk",
  completed: false,
  userId: 1,
};

const mountDashboard = async () => {
  const result = await mountWithPlugins(Dashboard, { attachTo: document.body });
  await flushPromises();
  return result;
};

const matchesButtonText = (el, name) =>
  el.textContent.replace(/\s+/g, " ").includes(name);

const clickNamed = async (name) => {
  const overlay = [...document.querySelectorAll(".v-overlay--active")].at(-1);
  const button =
    (overlay && [...overlay.querySelectorAll("button")].find((el) => matchesButtonText(el, name))) ||
    [...document.querySelectorAll("button")].find((el) => matchesButtonText(el, name));
  expect(button).toBeTruthy();
  button.click();
  await flushPromises();
};

const visibleInput = () => {
  const overlay = [...document.querySelectorAll(".v-overlay--active")].at(-1);
  if (overlay) {
    const overlayInput = overlay.querySelector('input:not([type="checkbox"])');
    if (overlayInput) {
      return overlayInput;
    }
  }

  return (
    [...document.querySelectorAll("input")].find((el) => el.offsetParent !== null) ??
    document.querySelector("input")
  );
};

const clickAria = async (label) => {
  const button = document.querySelector(`[aria-label="${label}"]`);
  expect(button).toBeTruthy();
  button.click();
  await flushPromises();
};

const openItemsFor = async (listName) => {
  await clickAria(`View items for ${listName}`);
};

const cleanup = (wrapper) => {
  wrapper?.unmount();
  document.body.innerHTML = "";
};

describe("Feature 2 — Todo List Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    ListServices.getAll.mockResolvedValue({ data: [] });
    TodoServices.getAll.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    cleanup(wrapper);
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

describe("Feature 3 — Todo List Item Management", () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    ListServices.getAll.mockResolvedValue({ data: [] });
    TodoServices.getAll.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    cleanup(wrapper);
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      ListServices.getAll.mockResolvedValue({ data: [groceries] });
      TodoServices.getAll
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [buyMilk] });
      TodoServices.create.mockResolvedValue({ data: buyMilk });

      ({ wrapper } = await mountDashboard());
      await openItemsFor("Groceries");
      await clickNamed("+ Add Item");

      const input = visibleInput();
      expect(input).toBeTruthy();
      input.value = "Buy milk";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await flushPromises();
      await clickNamed("Add");

      expect(TodoServices.create).toHaveBeenCalledWith(1, { title: "Buy milk" });
      expect(document.body.textContent).toContain("Buy milk");
    });

    it("User adds a todo with an empty title", async () => {
      ListServices.getAll.mockResolvedValue({ data: [groceries] });

      ({ wrapper } = await mountDashboard());
      await openItemsFor("Groceries");
      await clickNamed("+ Add Item");
      await clickNamed("Add");

      expect(document.body.textContent).toContain("Todo title is required.");
      expect(TodoServices.create).not.toHaveBeenCalled();
    });

    it("Add item is only available inside the items dialog", async () => {
      ListServices.getAll.mockResolvedValue({ data: [groceries] });

      ({ wrapper } = await mountDashboard());

      expect(wrapper.text()).not.toContain("+ Add Item");
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("List items dialog shows empty state", async () => {
      ListServices.getAll.mockResolvedValue({ data: [personal] });
      TodoServices.getAll.mockResolvedValue({ data: [] });

      ({ wrapper } = await mountDashboard());
      await openItemsFor("Personal");

      expect(document.body.textContent).toContain("No todos in this list yet.");
    });

    it("User opens items for different lists", async () => {
      ListServices.getAll.mockResolvedValue({ data: [personal, work] });
      TodoServices.getAll
        .mockResolvedValueOnce({
          data: [{ id: 21, listId: 2, title: "Call mom", completed: false, userId: 1 }],
        })
        .mockResolvedValueOnce({
          data: [
            { id: 22, listId: 3, title: "Email client", completed: false, userId: 1 },
            { id: 23, listId: 3, title: "Write report", completed: false, userId: 1 },
          ],
        });

      ({ wrapper } = await mountDashboard());
      await openItemsFor("Personal");

      expect(document.body.textContent).toContain("Call mom");
      expect(document.body.textContent).not.toContain("Email client");
      expect(document.body.textContent).not.toContain("Write report");

      await clickNamed("Close");
      await openItemsFor("Work");

      expect(document.body.textContent).toContain("Email client");
      expect(document.body.textContent).toContain("Write report");
      expect(document.body.textContent).not.toContain("Call mom");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const completed = { ...buyMilk, completed: true };
      ListServices.getAll.mockResolvedValue({ data: [groceries] });
      TodoServices.getAll
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({ data: [completed] });
      TodoServices.update.mockResolvedValue({ data: completed });

      ({ wrapper } = await mountDashboard());
      await openItemsFor("Groceries");

      const overlay = [...document.querySelectorAll(".v-overlay--active")].at(-1);
      const checkbox = overlay.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeTruthy();
      checkbox.click();
      await flushPromises();

      expect(TodoServices.update).toHaveBeenCalledWith(10, { completed: true });
      expect(document.querySelector(".todo-completed")?.textContent).toContain("Buy milk");
    });

    it("User marks a completed todo as incomplete", async () => {
      const completed = { ...buyMilk, completed: true };
      ListServices.getAll.mockResolvedValue({ data: [groceries] });
      TodoServices.getAll
        .mockResolvedValueOnce({ data: [completed] })
        .mockResolvedValueOnce({ data: [buyMilk] });
      TodoServices.update.mockResolvedValue({ data: buyMilk });

      ({ wrapper } = await mountDashboard());
      await openItemsFor("Groceries");

      const overlay = [...document.querySelectorAll(".v-overlay--active")].at(-1);
      const checkbox = overlay.querySelector('input[type="checkbox"]');
      expect(checkbox).toBeTruthy();
      checkbox.click();
      await flushPromises();

      expect(TodoServices.update).toHaveBeenCalledWith(10, { completed: false });
      expect(document.querySelector(".todo-completed")).toBeNull();
      expect(document.body.textContent).toContain("Buy milk");
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const updated = { ...buyMilk, title: "Buy oat milk" };
      ListServices.getAll.mockResolvedValue({ data: [groceries] });
      TodoServices.getAll
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({ data: [updated] });
      TodoServices.update.mockResolvedValue({ data: updated });

      ({ wrapper } = await mountDashboard());
      await openItemsFor("Groceries");
      await clickAria("Edit item");

      const input = visibleInput();
      expect(input).toBeTruthy();
      input.value = "Buy oat milk";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await flushPromises();
      await clickNamed("Save");

      expect(TodoServices.update).toHaveBeenCalledWith(10, { title: "Buy oat milk" });
      expect(document.body.textContent).toContain("Buy oat milk");
    });

    it("User deletes a todo", async () => {
      ListServices.getAll.mockResolvedValue({ data: [groceries] });
      TodoServices.getAll
        .mockResolvedValueOnce({ data: [buyMilk] })
        .mockResolvedValueOnce({ data: [] });
      TodoServices.delete.mockResolvedValue({ status: 200 });

      ({ wrapper } = await mountDashboard());
      await openItemsFor("Groceries");
      await clickAria("Delete item");
      await clickNamed("Delete");

      expect(TodoServices.delete).toHaveBeenCalledWith(10);
      expect(document.body.textContent).toContain("No todos in this list yet.");
    });
  });
});
