import express from "express";
import { clerkMiddleware, clerkClient, getAuth } from "@clerk/express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(clerkMiddleware());

app.get("/protected", async (req, res) => {
  // Use `getAuth()` to get the user's `userId`
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Use the `getUser()` method to get the user's User object
  const user = await clerkClient.users.getUser(userId);

  res.json({ user });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
