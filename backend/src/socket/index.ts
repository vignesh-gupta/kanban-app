import { Server } from "socket.io";
import { socketAuth } from "../middleware/auth";
import { boardSocketHandlers } from "./boardHandlers";

// Extend the Socket type to include 'user'
declare module "socket.io" {
  interface Socket {
    user?: {
      name: string;
      [key: string]: any;
    };
  }
}

export const setupSocket = (io: Server) => {
  // Apply authentication middleware
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(`User ${socket?.user?.name} connected (${socket.id})`);

    // Set up board-related socket handlers
    boardSocketHandlers(io, socket);

    socket.on("disconnect", (reason) => {
      console.log(`User ${socket?.user?.name} disconnected: ${reason}`);
    });
  });
};
