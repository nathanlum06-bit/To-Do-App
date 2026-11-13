/**
 * Feature 3 — Todo List Item Management
 * Spec: features/feature-3-todo-list-item-management.md
 */
import request from "supertest";
import app from "../server.js";
import {
  syncTestDatabase,
  registerUser,
  createList,
  createTodo,
  authHeader,
  Todo,
} from "./helpers.js";

const otherUser = {
  username: "buser",
  email: "buser@example.com",
  fName: "Bob",
};

describe("Feature 3 — Todo List Item Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-3.1 — Add tasks to a list", () => {
    it("User adds a todo to a list via dialog", async () => {
      const user = await registerUser(app);
      const list = await createList(app, user.body.token, "Groceries");
      const res = await createTodo(app, user.body.token, list.body.id, "Buy milk");

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        title: "Buy milk",
        completed: false,
        userId: user.body.userId,
        listId: list.body.id,
      });
      expect(res.body.id).toEqual(expect.any(Number));
    });

    it("User adds a todo with an empty title", async () => {
      const user = await registerUser(app);
      const list = await createList(app, user.body.token, "Groceries");
      const res = await createTodo(app, user.body.token, list.body.id, "   ");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Todo title is required." });
      expect(await Todo.count()).toBe(0);
    });
  });

  describe("US-3.2 — View tasks in a list", () => {
    it("User only sees their own todos when opening items", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, otherUser);
      const listA = await createList(app, userA.body.token, "Work");
      const listB = await createList(app, userB.body.token, "Work");
      await createTodo(app, userA.body.token, listA.body.id, "My task");
      await createTodo(app, userB.body.token, listB.body.id, "Their task");

      const res = await request(app)
        .get(`/todo/lists/${listA.body.id}/todos`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((todo) => todo.title)).toEqual(["My task"]);
      expect(res.body.map((todo) => todo.title)).not.toContain("Their task");
    });
  });

  describe("US-3.3 — Complete tasks", () => {
    it("User marks a todo as complete", async () => {
      const user = await registerUser(app);
      const list = await createList(app, user.body.token, "Groceries");
      const created = await createTodo(app, user.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(authHeader(user.body.token))
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: created.body.id,
        title: "Buy milk",
        completed: true,
      });
    });

    it("User marks a completed todo as incomplete", async () => {
      const user = await registerUser(app);
      const list = await createList(app, user.body.token, "Groceries");
      const created = await createTodo(app, user.body.token, list.body.id, "Buy milk");
      await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(authHeader(user.body.token))
        .send({ completed: true });

      const res = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(authHeader(user.body.token))
        .send({ completed: false });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: created.body.id,
        completed: false,
      });
    });
  });

  describe("US-3.4 — Edit and remove tasks", () => {
    it("User edits a todo title", async () => {
      const user = await registerUser(app);
      const list = await createList(app, user.body.token, "Groceries");
      const created = await createTodo(app, user.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .put(`/todo/todos/${created.body.id}`)
        .set(authHeader(user.body.token))
        .send({ title: "Buy oat milk" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: created.body.id,
        title: "Buy oat milk",
      });
    });

    it("User deletes a todo", async () => {
      const user = await registerUser(app);
      const list = await createList(app, user.body.token, "Groceries");
      const created = await createTodo(app, user.body.token, list.body.id, "Buy milk");

      const res = await request(app)
        .delete(`/todo/todos/${created.body.id}`)
        .set(authHeader(user.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await Todo.findByPk(created.body.id)).toBeNull();
    });
  });

  describe("US-3.5 — Private items only", () => {
    it("User cannot read todos in another user's list", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, otherUser);
      const listB = await createList(app, userB.body.token, "Secret");
      await createTodo(app, userB.body.token, listB.body.id, "Hidden task");

      const res = await request(app)
        .get(`/todo/lists/${listB.body.id}/todos`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `List with id=${listB.body.id} not found.` });
      expect(res.body).not.toEqual(expect.objectContaining({ title: "Hidden task" }));
      expect(Array.isArray(res.body)).toBe(false);
    });

    it("User attempts to add a todo to another user's list", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, otherUser);
      const listB = await createList(app, userB.body.token, "Secret");

      const res = await createTodo(app, userA.body.token, listB.body.id, "Intruder task");

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `List with id=${listB.body.id} not found.` });
      expect(await Todo.count({ where: { listId: listB.body.id } })).toBe(0);
    });

    it("User attempts to rename another user's todo", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, otherUser);
      const listB = await createList(app, userB.body.token, "Secret");
      const todoB = await createTodo(app, userB.body.token, listB.body.id, "Hidden task");

      const res = await request(app)
        .put(`/todo/todos/${todoB.body.id}`)
        .set(authHeader(userA.body.token))
        .send({ title: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `Todo with id=${todoB.body.id} not found.` });

      const stored = await Todo.findByPk(todoB.body.id);
      expect(stored.title).toBe("Hidden task");
    });

    it("User attempts to delete another user's todo", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, otherUser);
      const listB = await createList(app, userB.body.token, "Secret");
      const todoB = await createTodo(app, userB.body.token, listB.body.id, "Hidden task");

      const res = await request(app)
        .delete(`/todo/todos/${todoB.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `Todo with id=${todoB.body.id} not found.` });
      expect(await Todo.findByPk(todoB.body.id)).not.toBeNull();
    });

    it("Client cannot assign a todo to another user on create", async () => {
      const userA = await registerUser(app);
      const list = await createList(app, userA.body.token, "Groceries");
      const res = await createTodo(app, userA.body.token, list.body.id, "Buy milk", {
        userId: 999,
      });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(999);

      const stored = await Todo.findByPk(res.body.id);
      expect(stored.userId).toBe(userA.body.userId);
    });

    it("Unauthenticated API request for todos", async () => {
      const res = await request(app).get("/todo/lists/1/todos");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-3.6 — Lists carry their items", () => {
    it("Deleting a list removes its todos", async () => {
      const user = await registerUser(app);
      const list = await createList(app, user.body.token, "Groceries");
      const milk = await createTodo(app, user.body.token, list.body.id, "Buy milk");
      const eggs = await createTodo(app, user.body.token, list.body.id, "Buy eggs");

      const res = await request(app)
        .delete(`/todo/lists/${list.body.id}`)
        .set(authHeader(user.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await Todo.findByPk(milk.body.id)).toBeNull();
      expect(await Todo.findByPk(eggs.body.id)).toBeNull();
    });
  });
});
