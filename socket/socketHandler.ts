import { Server, Socket } from "socket.io";
import UserModel from "../models/userModel";

let io: Server;

export const initIO = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

export function initSocket(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on(
      "register",
      async (payload: {
        userId: string;
        role: string;
        vehicleType:string;
        coords?: [number, number];
      }) => {
        const { userId, role, coords } = payload;
        console.log("Register payload:", payload);
        socket.join(userId);
        try {
          await UserModel.findByIdAndUpdate(userId, {
            socketId: socket.id,
            online: true,
            ...(coords
              ? { location: { type: "Point", coordinates: coords } }
              : {}),
          });
           socket.emit("register:success", {
            message: "register:success",
            socketId: socket.id,
          });
        } catch (err) {
            socket.emit("register:error", { message: "حصل خطأ أثناء التسجيل" });
        }
      }
    );

    socket.on(
      "location:update",
      async (payload: { userId: string; coords: [number, number] }) => {
        const { userId, coords } = payload;
        try {
          await UserModel.findByIdAndUpdate(userId, {
            location: { type: "Point", coordinates: coords },
          });
        } catch (err) {}
      }
    );

    socket.on("disconnect", async () => {
      try {
        await UserModel.findOneAndUpdate(
          { socketId: socket.id },
          { online: false, socketId: null }
        );
      } catch (err) {}
    });
  });
}
