import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import { sourcesRouter } from "./modules/RAG-pipeline/sources.router.js";
import { queryRouter } from "./modules/RAG-pipeline/query.router.js";

const app = express();
const PORT = process.env.PORT ?? 8000;

// ── Global Middleware ─────────────────────────────────────────────────────────

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(clerkMiddleware());

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/sources", sourcesRouter);
app.use("/query", queryRouter);

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ ContextAI server running at http://localhost:${PORT}`);
});
