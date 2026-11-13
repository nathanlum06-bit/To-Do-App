import db from "../models/index.js";
import logger from "../config/logger.js";

const { session: Session, user: User, list: List, todo: Todo } = db;

const getBearerToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const value = Array.isArray(header) ? header[0] : header;

  if (!value.startsWith("Bearer ")) {
    return null;
  }

  const token = value.slice("Bearer ".length).trim();
  return token || null;
};

export const authenticate = async (req, res, next) => {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).send({ message: "Unauthorized! No token provided." });
    }

    const session = await Session.findOne({
      where: { token },
      include: [{ model: User, as: "user" }],
    });

    if (!session || !session.user) {
      return res.status(401).send({ message: "Unauthorized! Invalid token." });
    }

    if (new Date(session.expirationDate).getTime() < Date.now()) {
      return res.status(401).send({ message: "Unauthorized! Token has expired." });
    }

    req.user = { id: session.user.id, role: session.user.role };
    return next();
  } catch (err) {
    logger.error(`authenticate failed: ${err.message}`);
    return res.status(401).send({ message: "Unauthorized! Invalid token." });
  }
};

export const getAccessibleListOrNull = async (req, listId) => {
  const row = await List.findOne({ where: { id: listId, userId: req.user.id } });
  return row ?? null;
};

export const getAccessibleTodoOrNull = async (req, todoId) => {
  const row = await Todo.findOne({ where: { id: todoId, userId: req.user.id } });
  return row ?? null;
};
