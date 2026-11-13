import { Router } from "express";
import authRoutes from "./auth.routes.js";
import { authenticate } from "../authorization/authorization.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/", authRoutes);

// Feature 1: protected stub so authenticate scenarios can run.
// Feature 2 replaces this with list CRUD scoped to req.user.id.
router.get("/lists", [authenticate], (_req, res) => {
  res.send([]);
});

export default router;
