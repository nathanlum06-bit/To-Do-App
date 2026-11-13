/**
 * Feature 1 — User Authentication & Session Management
 * Spec: features/feature-1-user-auth.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import {
  syncTestDatabase,
  validRegisterBody,
  registerUser,
  loginUser,
  User,
  Session,
} from "./helpers.js";

describe("Feature 1 — User Authentication & Session Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-1.1 — Registration", () => {
    it("User registers with valid information", async () => {
      const res = await registerUser(app);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        username: "jdoe",
        email: "jdoe@example.com",
        fName: "Jane",
        lName: "Doe",
        role: "worker",
      });
      expect(res.body.userId).toEqual(expect.any(Number));
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.password).toBeUndefined();

      const stored = await User.unscoped().findByPk(res.body.userId);
      expect(stored).not.toBeNull();
      expect(stored.password).not.toBe("password123");
      expect(await bcrypt.compare("password123", stored.password)).toBe(true);
    });

    it("User submits registration with missing email", async () => {
      const res = await registerUser(app, { email: "" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is required." });
      expect(await User.count()).toBe(0);
    });

    it("User submits registration with password too short", async () => {
      const res = await registerUser(app, { password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password must be at least 8 characters." });
      expect(await User.count()).toBe(0);
    });

    it("User registers with a duplicate username", async () => {
      await registerUser(app);
      const res = await request(app)
        .post("/todo/register")
        .send(validRegisterBody({ email: "other@example.com", username: "jdoe" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });
    });

    it("User registers with a duplicate email", async () => {
      await registerUser(app);
      const res = await request(app)
        .post("/todo/register")
        .send(validRegisterBody({ email: "jdoe@example.com", username: "other" }));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });
    });
  });

  describe("US-1.2 — Sign in", () => {
    it("User signs in with valid credentials", async () => {
      const registered = await registerUser(app);
      const res = await loginUser(app);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        username: "jdoe",
        role: "worker",
      });
      expect(res.body.userId).toEqual(expect.any(Number));
      expect(res.body.token).toBe(registered.body.token);
      expect(res.body.password).toBeUndefined();

      const sessions = await Session.findAll({ where: { userId: res.body.userId } });
      const active = sessions.filter((row) => row.token);
      expect(active.length).toBe(1);
      expect(active[0].token).toBe(res.body.token);
    });

    it("User signs in with invalid password", async () => {
      await registerUser(app);
      const res = await loginUser(app, { password: "wrong-password" });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Invalid username or password." });
    });

    it("User signs in with missing username", async () => {
      const res = await loginUser(app, { username: "" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is required." });
    });

    it("User signs in with missing password", async () => {
      const res = await loginUser(app, { password: "" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password is required." });
    });
  });

  describe("US-1.4 — Sign out", () => {
    it("User signs out", async () => {
      const registered = await registerUser(app);
      const token = registered.body.token;

      const res = await request(app)
        .post("/todo/logout")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);

      const session = await Session.findOne({ where: { userId: registered.body.userId } });
      expect(session.token).toBe("");

      const replay = await request(app)
        .post("/todo/logout")
        .set("Authorization", `Bearer ${token}`);
      expect(replay.status).toBe(401);
    });
  });
});
