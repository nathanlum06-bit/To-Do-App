/**
 * Feature 2 — Todo List Management
 * Spec: features/feature-2-todo-list-management.md
 */
import request from "supertest";
import app from "../server.js";
import {
  syncTestDatabase,
  registerUser,
  createList,
  authHeader,
  List,
} from "./helpers.js";

describe("Feature 2 — Todo List Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-2.1 — Create todo lists", () => {
    it("User creates a new list", async () => {
      const user = await registerUser(app);
      const res = await createList(app, user.body.token, "Groceries");

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: "Groceries",
        userId: user.body.userId,
      });
      expect(res.body.id).toEqual(expect.any(Number));
    });

    it("User creates a list with an empty name", async () => {
      const user = await registerUser(app);
      const res = await createList(app, user.body.token, "   ");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "List name is required." });
      expect(await List.count()).toBe(0);
    });

    it("User creates a list with a name that is too long", async () => {
      const user = await registerUser(app);
      const res = await createList(app, user.body.token, "a".repeat(101));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "List name must be 100 characters or fewer." });
      expect(await List.count()).toBe(0);
    });
  });

  describe("US-2.2 — View my lists", () => {
    it("Dashboard loads with existing lists", async () => {
      const user = await registerUser(app);
      await createList(app, user.body.token, "Work");
      await createList(app, user.body.token, "Personal");

      const res = await request(app)
        .get("/todo/lists")
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(res.body.map((list) => list.name)).toEqual(["Personal", "Work"]);
    });

    it("User cannot see another user's lists", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        username: "buser",
        email: "buser@example.com",
        fName: "Bob",
      });
      await createList(app, userA.body.token, "Mine");
      await createList(app, userB.body.token, "Secret Project");

      const res = await request(app)
        .get("/todo/lists")
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(200);
      expect(res.body.every((list) => list.userId === userA.body.userId)).toBe(true);
      expect(res.body.map((list) => list.name)).not.toContain("Secret Project");
    });
  });

  describe("US-2.4 — Rename and delete lists", () => {
    it("User renames a list", async () => {
      const user = await registerUser(app);
      const created = await createList(app, user.body.token, "Groceries");

      const res = await request(app)
        .put(`/todo/lists/${created.body.id}`)
        .set(authHeader(user.body.token))
        .send({ name: "Shopping" });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: created.body.id,
        name: "Shopping",
        userId: user.body.userId,
      });
    });

    it("User deletes a list", async () => {
      const user = await registerUser(app);
      const created = await createList(app, user.body.token, "Groceries");

      const res = await request(app)
        .delete(`/todo/lists/${created.body.id}`)
        .set(authHeader(user.body.token));

      expect([200, 204]).toContain(res.status);
      expect(await List.findByPk(created.body.id)).toBeNull();
    });
  });

  describe("US-2.5 — Private lists only", () => {
    it("User attempts to rename another user's list", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        username: "buser",
        email: "buser@example.com",
        fName: "Bob",
      });
      const ownedByB = await createList(app, userB.body.token, "Secret Project");

      const res = await request(app)
        .put(`/todo/lists/${ownedByB.body.id}`)
        .set(authHeader(userA.body.token))
        .send({ name: "Hijacked" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `List with id=${ownedByB.body.id} not found.` });

      const stored = await List.findByPk(ownedByB.body.id);
      expect(stored.name).toBe("Secret Project");
    });

    it("User attempts to delete another user's list", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, {
        username: "buser",
        email: "buser@example.com",
        fName: "Bob",
      });
      const ownedByB = await createList(app, userB.body.token, "Secret Project");

      const res = await request(app)
        .delete(`/todo/lists/${ownedByB.body.id}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: `List with id=${ownedByB.body.id} not found.` });
      expect(await List.findByPk(ownedByB.body.id)).not.toBeNull();
    });

    it("Client cannot assign a list to another user on create", async () => {
      const userA = await registerUser(app);
      const res = await createList(app, userA.body.token, "Groceries", { userId: 999 });

      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(userA.body.userId);
      expect(res.body.userId).not.toBe(999);

      const stored = await List.findByPk(res.body.id);
      expect(stored.userId).toBe(userA.body.userId);
    });

    it("Unauthenticated API request to lists", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
