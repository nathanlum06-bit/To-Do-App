import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleListOrNull } from "../authorization/authorization.js";

const { list: List } = db;
const exports = {};

const parseListId = (value) => parseInt(value, 10);

const validateName = (raw) => {
  const name = typeof raw === "string" ? raw.trim() : "";

  if (!name) {
    return { error: "List name is required." };
  }

  if (name.length > 100) {
    return { error: "List name must be 100 characters or fewer." };
  }

  return { name };
};

exports.findAll = async (req, res) => {
  try {
    const lists = await List.findAll({
      where: { userId: req.user.id },
      order: [["name", "ASC"]],
    });
    return res.send(lists);
  } catch (err) {
    logger.error(`lists.findAll failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to load lists." });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, error } = validateName(req.body.name);

    if (error) {
      return res.status(400).send({ message: error });
    }

    const list = await List.create({
      name,
      userId: req.user.id,
    });

    return res.status(201).send(list);
  } catch (err) {
    logger.error(`lists.create failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to create list." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseListId(req.params.listId);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const { name, error } = validateName(req.body.name);

    if (error) {
      return res.status(400).send({ message: error });
    }

    const list = await getAccessibleListOrNull(req, id);

    if (!list) {
      return res.status(404).send({ message: `List with id=${id} not found.` });
    }

    list.name = name;
    await list.save();
    return res.send(list);
  } catch (err) {
    logger.error(`lists.update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to rename list." });
  }
};

exports.delete = async (req, res) => {
  try {
    const id = parseListId(req.params.listId);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Invalid list id." });
    }

    const list = await getAccessibleListOrNull(req, id);

    if (!list) {
      return res.status(404).send({ message: `List with id=${id} not found.` });
    }

    await list.destroy();
    return res.send({ message: `List with id=${id} deleted.` });
  } catch (err) {
    logger.error(`lists.delete failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to delete list." });
  }
};

export default exports;
