/**
 * Feature 4 — User Profile Management
 * Spec: features/feature-4-user-profile-management.md
 */
import request from "supertest";
import bcrypt from "bcryptjs";
import app from "../server.js";
import {
  syncTestDatabase,
  registerUser,
  authHeader,
  User,
} from "./helpers.js";

const otherUser = {
  username: "buser",
  email: "buser@example.com",
  fName: "Bob",
  lName: "Smith",
};

const profileFields = (user) => ({
  fName: user.body.fName,
  lName: user.body.lName,
  email: user.body.email,
  username: user.body.username,
});

describe("Feature 4 — User Profile Management", () => {
  beforeEach(async () => {
    await syncTestDatabase();
  });

  describe("US-4.2 — Edit profile", () => {
    it("User saves profile changes", async () => {
      const user = await registerUser(app);

      const res = await request(app)
        .put(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token))
        .send({
          fName: "Janet",
          lName: "Doer",
          email: "janet@example.com",
          username: "janetd",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.body.userId,
        fName: "Janet",
        lName: "Doer",
        email: "janet@example.com",
        username: "janetd",
        role: "worker",
      });
      expect(res.body.password).toBeUndefined();

      const stored = await User.unscoped().findByPk(user.body.userId);
      expect(stored.fName).toBe("Janet");
      expect(await bcrypt.compare("password123", stored.password)).toBe(true);
    });

    it("User fetches their own profile", async () => {
      const user = await registerUser(app);

      const res = await request(app)
        .get(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: user.body.userId,
        fName: "Jane",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "jdoe",
        role: "worker",
      });
      expect(res.body.password).toBeUndefined();
    });

    it("User attempts to fetch another user's profile", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, otherUser);

      const res = await request(app)
        .get(`/todo/users/${userB.body.userId}`)
        .set(authHeader(userA.body.token));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `User with id=${userB.body.userId} not found.`,
      });
    });

    it("User attempts to update another user's profile", async () => {
      const userA = await registerUser(app);
      const userB = await registerUser(app, otherUser);

      const res = await request(app)
        .put(`/todo/users/${userB.body.userId}`)
        .set(authHeader(userA.body.token))
        .send({
          ...profileFields(userB),
          fName: "Hijacked",
        });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        message: `User with id=${userB.body.userId} not found.`,
      });

      const stored = await User.findByPk(userB.body.userId);
      expect(stored.fName).toBe("Bob");
    });

    it("Unauthenticated profile API request", async () => {
      const res = await request(app).get("/todo/users/1");

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });

    it("Profile update rejects a password that is too short", async () => {
      const user = await registerUser(app);

      const res = await request(app)
        .put(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token))
        .send({ password: "short" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Password must be at least 8 characters." });
    });

    it("Profile update rejects missing required fields", async () => {
      const user = await registerUser(app);

      const res = await request(app)
        .put(`/todo/users/${user.body.userId}`)
        .set(authHeader(user.body.token))
        .send({
          fName: "",
          lName: "Doe",
          email: "jdoe@example.com",
          username: "jdoe",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "First name is required." });

      const stored = await User.findByPk(user.body.userId);
      expect(stored.fName).toBe("Jane");
    });

    it("Profile update rejects a duplicate username", async () => {
      const userA = await registerUser(app);
      await registerUser(app, { ...otherUser, username: "userb" });

      const res = await request(app)
        .put(`/todo/users/${userA.body.userId}`)
        .set(authHeader(userA.body.token))
        .send({
          ...profileFields(userA),
          username: "userb",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Username is already taken." });

      const storedB = await User.findOne({ where: { username: "userb" } });
      expect(storedB.email).toBe("buser@example.com");
    });

    it("Profile update rejects a duplicate email", async () => {
      const userA = await registerUser(app);
      await registerUser(app, { ...otherUser, email: "b@example.com" });

      const res = await request(app)
        .put(`/todo/users/${userA.body.userId}`)
        .set(authHeader(userA.body.token))
        .send({
          ...profileFields(userA),
          email: "b@example.com",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email is already registered." });

      const storedB = await User.findOne({ where: { email: "b@example.com" } });
      expect(storedB.username).toBe("buser");
    });

    it("Unauthenticated profile update API request", async () => {
      const res = await request(app).put("/todo/users/1").send({
        fName: "Jane",
        lName: "Doe",
        email: "jdoe@example.com",
        username: "jdoe",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });
  });
});
