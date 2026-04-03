import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";
import { handleGetStats, handleStartWatch, handleStopWatch, handleUpload, handleManualBroadcast } from "./routes/automation";
import { handleTrackingPixel, handleTrackingClick } from "./routes/tracking";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.get("/api/ping", (_req, res) => {
  const ping = process.env.PING_MESSAGE ?? "pong";
  res.json({ message: ping });
});

app.get("/api/demo", handleDemo);

// Automation routes
app.get("/api/stats", handleGetStats);
app.post("/api/watch", handleStartWatch);
app.post("/api/stop-watch", handleStopWatch);
app.post("/api/upload", handleUpload);
app.post("/api/broadcast", handleManualBroadcast);

// Tracking routes
app.get("/api/track/:id/pixel", handleTrackingPixel);
app.get("/api/track/:id/click", handleTrackingClick);

// In production, serve the frontend build
const __dirname = import.meta.dirname;
const frontendDist = path.join(__dirname, "../../EX-frontend/dist");

app.use(express.static(frontendDist));

// Handle React Router — serve index.html for all non-API routes
app.get("/{*path}", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    res.status(404).json({ error: "API endpoint not found" });
    return;
  }
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(port, () => {
  console.log(`🚀 ExcelAI server running on port ${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
