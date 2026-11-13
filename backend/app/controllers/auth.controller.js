import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import db from "../models/index.js";
import authConfig from "../config/auth.config.js";
import logger from "../config/logger.js";

const { user: User, session: Session } = db;
const SALT_ROUNDS = 10;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const exports = {};

const isBlank = (value) => !value || !String(value).trim();

const authPayload = (user, token) => ({
  userId: user.id,
  username: user.username,
  email: user.email,
  fName: user.fName,
  lName: user.lName,
  role: user.role,
  token,
});

const getBearerToken = (req) => {
  const header = req.headers.authorization || req.headers.Authorization || "";
  const value = Array.isArray(header) ? header[0] : header;

  if (!value.startsWith("Bearer ")) {
    return null;
  }

  return value.slice("Bearer ".length).trim() || null;
};

const issueSessionToken = async (user) => {
  const existing = await Session.findOne({
    where: {
      userId: user.id,
      email: user.email,
      expirationDate: { [Op.gte]: new Date() },
      token: { [Op.ne]: "" },
    },
  });

  if (existing) {
    return existing.token;
  }

  const token = jwt.sign({ id: user.id }, authConfig.secret, { expiresIn: 86400 });
  await Session.create({
    token,
    email: user.email,
    expirationDate: new Date(Date.now() + SESSION_TTL_MS),
    userId: user.id,
  });

  return token;
};

exports.register = async (req, res) => {
  try {
    const fName = req.body.fName?.trim();
    const lName = req.body.lName?.trim();
    const email = req.body.email?.trim();
    const username = req.body.username?.trim().toLowerCase();
    const password = req.body.password;

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
    if (isBlank(password)) {
      return res.status(400).send({ message: "Password is required." });
    }
    if (password.length < 8) {
      return res.status(400).send({ message: "Password must be at least 8 characters." });
    }

    const takenUsername = await User.findOne({ where: { username } });
    if (takenUsername) {
      return res.status(400).send({ message: "Username is already taken." });
    }

    const takenEmail = await User.findOne({ where: { email } });
    if (takenEmail) {
      return res.status(400).send({ message: "Email is already registered." });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      fName,
      lName,
      email,
      username,
      password: hash,
      role: "worker",
    });

    const token = await issueSessionToken(user);
    return res.status(201).send(authPayload(user, token));
  } catch (err) {
    logger.error(`register failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to register." });
  }
};

exports.login = async (req, res) => {
  try {
    const username = req.body.username?.trim().toLowerCase();
    const password = req.body.password;

    if (isBlank(username)) {
      return res.status(400).send({ message: "Username is required." });
    }
    if (isBlank(password)) {
      return res.status(400).send({ message: "Password is required." });
    }

    const user = await User.unscoped().findOne({ where: { username } });
    const passwordMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatch) {
      return res.status(401).send({ message: "Invalid username or password." });
    }

    const token = await issueSessionToken(user);
    return res.status(200).send(authPayload(user, token));
  } catch (err) {
    logger.error(`login failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to sign in." });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = getBearerToken(req);

    if (token) {
      await Session.update({ token: "" }, { where: { token } });
    }

    return res.status(200).send({ message: "Signed out successfully." });
  } catch (err) {
    logger.error(`logout failed: ${err.message}`);
    return res.status(500).send({ message: "Unable to sign out." });
  }
};

export default exports;
