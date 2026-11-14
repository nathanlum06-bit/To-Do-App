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

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const INVALID_DUE_DATE = "Due date must be a valid date in YYYY-MM-DD format.";

const parseDueDate = (raw) => {
  if (raw === undefined) {
    return { omitted: true };
  }

  if (raw === null || raw === "") {
    return { dueDate: null };
  }

  if (typeof raw !== "string" || !DATE_ONLY_REGEX.test(raw)) {
    return { error: INVALID_DUE_DATE };
  }

  const [year, month, day] = raw.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return { error: INVALID_DUE_DATE };
  }

  return { dueDate: raw };
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

    const dueDateResult = parseDueDate(req.body.dueDate);

    if (dueDateResult.error) {
      return res.status(400).send({ message: dueDateResult.error });
    }

    const todo = await Todo.create({
      title,
      completed: false,
      dueDate: dueDateResult.omitted ? null : dueDateResult.dueDate,
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

    if (req.body.dueDate !== undefined) {
      const dueDateResult = parseDueDate(req.body.dueDate);

      if (dueDateResult.error) {
        return res.status(400).send({ message: dueDateResult.error });
      }

      todo.dueDate = dueDateResult.dueDate;
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
