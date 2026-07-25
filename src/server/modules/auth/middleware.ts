import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "../../common/config/db/index.js";
import { userTable } from "../../common/config/db/schema.js";
import { eq } from "drizzle-orm";

const MAX_REQUESTS_PER_DAY = 10;
const MAX_SOURCES = 5;

// ── Ensure user row exists in DB ──────────────────────────────────────────────

export async function ensureUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId } = getAuth(req);

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Upsert: create user row if first time
  const existing = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(userTable).values({
      id: userId,
      requestCount: 0,
      sourceCount: 0,
      requestResetAt: new Date(),
    });
  }

  next();
}

// ── Rate limit: 10 queries/day ────────────────────────────────────────────────

export async function checkRateLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const now = new Date();
  const resetAt = new Date(user.requestResetAt);
  const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

  // Reset count if 24h have passed
  if (hoursSinceReset >= 24) {
    await db
      .update(userTable)
      .set({ requestCount: 0, requestResetAt: now })
      .where(eq(userTable.id, userId));
    next();
    return;
  }

  if (user.requestCount >= MAX_REQUESTS_PER_DAY) {
    res.status(429).json({
      error: "Daily limit reached. You can send 10 queries per day.",
    });
    return;
  }

  next();
}

// ── Source limit: max 5 sources ───────────────────────────────────────────────

export async function checkSourceLimit(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const { userId } = getAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [user] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  if (user.sourceCount >= MAX_SOURCES) {
    res.status(403).json({
      error: "Source limit reached. You can add up to 5 sources.",
    });
    return;
  }

  next();
}
