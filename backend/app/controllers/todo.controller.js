import db from "../models/index.js";
import logger from "../config/logger.js";
import {
  getAccessibleListOrNull,
  getAccessibleTodoOrNull,
} from "../authorization/authorization.js";

const { todo: Todo } = db;
const exports = {};

const parseId = (value) => parseInt(value, 10);

const validateTitle = (raw) => {
  const title = typeof raw === "string" ? raw.trim() : "";

  if (!title) {
    return { error: "Todo title is required." };
  }

  if (title.length > 255) {
    return { error: "Todo title must be 255 characters or fewer." };
  }

  return { title };
};

exports.findAll = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);

    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const todos = await Todo.findAll({
      where: { listId, userId: req.user.id },
      order: [
        ["completed", "ASC"],
        ["createdAt", "ASC"],
      ],
    });

    return res.send(todos);
  } catch (err) {
    logger.error(`todos.findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to load todos." });
  }
};

exports.create = async (req, res) => {
  try {
    const listId = parseId(req.params.listId);

    if (Number.isNaN(listId)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, listId);

    if (!list) {
      return res.status(404).send({ message: `List with id=${listId} not found.` });
    }

    const { title, error } = validateTitle(req.body.title);

    if (error) {
      return res.status(400).send({ message: error });
    }

    const todo = await Todo.create({
      title,
      completed: false,
      listId,
      userId: req.user.id,
    });

    return res.status(201).send(todo);
  } catch (err) {
    logger.error(`todos.create failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create todo." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, id);

    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${id} not found.` });
    }

    if (req.body.title !== undefined) {
      const { title, error } = validateTitle(req.body.title);

      if (error) {
        return res.status(400).send({ message: error });
      }

      todo.title = title;
    }

    if (req.body.completed !== undefined) {
      todo.completed = Boolean(req.body.completed);
    }

    await todo.save();
    return res.send(todo);
  } catch (err) {
    logger.error(`todos.update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update todo." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseId(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Invalid todo id." });
    }

    const todo = await getAccessibleTodoOrNull(req, id);

    if (!todo) {
      return res.status(404).send({ message: `Todo with id=${id} not found.` });
    }

    await todo.destroy();
    return res.send({ message: `Todo with id=${id} deleted.` });
  } catch (err) {
    logger.error(`todos.delete failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete todo." });
  }
};

export default exports;
