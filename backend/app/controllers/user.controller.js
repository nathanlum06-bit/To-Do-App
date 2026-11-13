import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import db from "../models/index.js";
import logger from "../config/logger.js";
import { getAccessibleUserOrNull } from "../authorization/authorization.js";

const { user: User } = db;
const SALT_ROUNDS = 10;
const exports = {};

const parseUserId = (value) => parseInt(value, 10);

const isBlank = (value) => value == null || !String(value).trim();

const toProfile = (user) => {
  const json = user.toJSON();
  delete json.password;
  return json;
};

exports.findOne = async (req, res) => {
  try {
    const id = parseUserId(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const user = await getAccessibleUserOrNull(req, id);

    if (!user) {
      return res.status(404).send({ message: `User with id=${id} not found.` });
    }

    return res.send(toProfile(user));
  } catch (err) {
    logger.error(`users.findOne failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to load profile." });
  }
};

exports.update = async (req, res) => {
  try {
    const id = parseUserId(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).send({ message: "Invalid user id." });
    }

    const password = req.body.password;

    if (password != null && password !== "" && String(password).length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }

    const fName = typeof req.body.fName === "string" ? req.body.fName.trim() : "";
    const lName = typeof req.body.lName === "string" ? req.body.lName.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim() : "";
    const username =
      typeof req.body.username === "string" ? req.body.username.trim().toLowerCase() : "";

    if (isBlank(fName)) {
      return res.status(400).send({ message: "First name is required." });
    }
    if (isBlank(lName)) {
      return res.status(400).send({ message: "Last name is required." });
    }
    if (isBlank(email)) {
      return res.status(400).send({ message: "Email is required." });
    }
    if (isBlank(username)) {
      return res.status(400).send({ message: "Username is required." });
    }

    const user = await getAccessibleUserOrNull(req, id);

    if (!user) {
      return res.status(404).send({ message: `User with id=${id} not found.` });
    }

    const takenUsername = await User.findOne({
      where: { username, id: { [Op.ne]: id } },
    });
    if (takenUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const takenEmail = await User.findOne({
      where: { email, id: { [Op.ne]: id } },
    });
    if (takenEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    user.fName = fName;
    user.lName = lName;
    user.email = email;
    user.username = username;

    if (password) {
      user.password = await bcrypt.hash(password, SALT_ROUNDS);
    }

    await user.save();
    return res.send(toProfile(user));
  } catch (err) {
    logger.error(`users.update failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to update profile." });
  }
};

export default exports;
