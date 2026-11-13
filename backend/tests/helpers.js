import request from "supertest";
import db from "../app/models/index.js";

const { user: User, session: Session, list: List, todo: Todo } = db;

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

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const createList = async (app, token, name, extra = {}) => {
  return request(app)
    .post("/todo/lists")
    .set(authHeader(token))
    .send({ name, ...extra });
};

export const createTodo = async (app, token, listId, title, extra = {}) => {
  return request(app)
    .post(`/todo/lists/${listId}/todos`)
    .set(authHeader(token))
    .send({ title, ...extra });
};

export { User, Session, List, Todo };
