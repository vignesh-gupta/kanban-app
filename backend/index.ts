import cors from "cors";
import dotenv from "dotenv";
import type { Express } from "express";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import morgan from "morgan";
import { Server } from "socket.io";
import { connectDB } from "./src/config/database";
import { connectRedis } from "./src/config/redis";
import { errorHandler } from "./src/middleware/errorHandler";
import { rateLimiter } from "./src/middleware/rateLimiter";
import { authRoutes } from "./src/routes/auth";
import { boardRoutes } from "./src/routes/boards";
import { setupSocket } from "./src/socket";

dotenv.config({
  path: ".env",
});

const app: Express = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Socket setup
setupSocket(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

export { app, io };
