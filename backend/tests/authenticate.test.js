/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import app from "../server.js";
import { syncTestDatabase, registerUser, Session } from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.3 — Stay signed in across page loads", () => {
    it("API request includes session token", async () => {
      const registered = await registerUser(app);

      const res = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${registered.body.token}`);

      expect(res.status).toBe(200);
    });

    it("Protected API request succeeds with a valid session", async () => {
      const userA = await registerUser(app);
      await registerUser(app, {
        username: "buser",
        email: "buser@example.com",
        fName: "Bob",
      });

      const res = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${userA.body.token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.every((list) => list.userId === userA.body.userId)).toBe(true);
    });

    it("Expired or invalid session token", async () => {
      const registered = await registerUser(app);

      await Session.update(
        { expirationDate: new Date(Date.now() - 1000) },
        { where: { token: registered.body.token } }
      );

      const expired = await request(app)
        .get("/todo/lists")
        .set("Authorization", `Bearer ${registered.body.token}`);

      expect(expired.status).toBe(401);
      expect(expired.body.message).toMatch(/Unauthorized/i);

      const invalid = await request(app)
        .get("/todo/lists")
        .set("Authorization", "Bearer not-a-real-token");

      expect(invalid.status).toBe(401);
      expect(invalid.body.message).toMatch(/Unauthorized/i);
    });
  });

  describe("US-1.5 — Block unauthenticated access", () => {
    it("Unauthenticated user accesses a protected route", async () => {
      const res = await request(app).get("/todo/lists");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
