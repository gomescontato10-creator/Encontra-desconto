import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import searchAlternativesHandler from "./api/search-alternatives";

const app = express();
const PORT = 3000;

// Increase payload limit for base64 images
app.use(express.json({ limit: "10mb" }));

// Route API requests to our new handler
app.post("/api/search-alternatives", searchAlternativesHandler);

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
