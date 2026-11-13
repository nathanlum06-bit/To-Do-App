import request from "supertest";
import db from "../app/models/index.js";

const { user: User, session: Session } = db;

export const syncTestDatabase = async () => {
  await db.sequelize.sync({ force: true });
};

export const validRegisterBody = (overrides = {}) => ({
  fName: "Jane",
  lName: "Doe",
  email: "jdoe@example.com",
  username: "jdoe",
  password: "password123",
  ...overrides,
});

export const registerUser = async (app, overrides = {}) => {
  return request(app).post("/todo/register").send(validRegisterBody(overrides));
};

export const loginUser = async (app, overrides = {}) => {
  const body = {
    username: "jdoe",
    password: "password123",
    ...overrides,
  };
  return request(app).post("/todo/login").send(body);
};

export { User, Session };
