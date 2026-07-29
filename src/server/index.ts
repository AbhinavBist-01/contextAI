import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import { sourcesRouter } from "./modules/RAG-pipeline/sources.router.js";
import { queryRouter } from "./modules/RAG-pipeline/query.router.js";
import { notebooksRouter } from "./modules/notebooks/notebooks.router.js";

const app = express();
const PORT = process.env.PORT ?? 8000;

// ── Global Middleware ─────────────────────────────────────────────────────────

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(clerkMiddleware());

// ── Routes ───────────────────────────────────────────────────────────────────

app.use("/notebooks", notebooksRouter);
app.use("/api/notebooks", notebooksRouter);

app.use("/sources", sourcesRouter);
app.use("/api/rag/sources", sourcesRouter);

app.use("/query", queryRouter);
app.use("/api/rag/query", queryRouter);

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Serve Static Assets in Production ─────────────────────────────────────────

const distPath = path.resolve(process.cwd(), "dist");
app.use(express.static(distPath));

app.use((req: Request, res: Response, next: NextFunction) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api") &&
    !req.path.startsWith("/notebooks") &&
    !req.path.startsWith("/sources") &&
    !req.path.startsWith("/query") &&
    !req.path.startsWith("/health")
  ) {
    return res.sendFile(path.join(distPath, "index.html"), (err) => {
      if (err) next();
    });
  }
  next();
});

// ── Global Error Handler ──────────────────────────────────────────────────────

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("❌ Unhandled Backend Error:", err);
  res.status(500).json({
    error: err.message || "Internal Server Error",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ ContextAI server running at http://localhost:${PORT}`);
});
