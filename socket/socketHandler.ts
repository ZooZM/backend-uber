import { Server, Socket } from "socket.io";
import UserModel from "../models/userModel";
import OnlineDriver from "../models/onlineDriver";
import { notifyDriverOffline, registerUserNearbyHandlers } from "./userNearby";
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
    registerUserNearbyHandlers(io, socket);
    socket.on(
      "register",
      async (payload: {
        userId: string;
        role: string;
        vehicleType: string;
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
          socket.emit("register:error", { message: "error" });
        }
      }
    );

    socket.on(
      "captain_online",
      async (payload: {
        userId: string;
        location: {
          type: "Point";
          coordinates: [number, number];
        };
        vehicleType: "car" | "motorbike" | "bicycle";
      }) => {
        const { userId, location, vehicleType } = payload;
        console.log("🚀 captain_online received:", payload);
        socket.join(userId);
        try {
          await OnlineDriver.findOneAndUpdate(
            { userId },
            { location, vehicleType, socketId: socket.id },
            { upsert: true, new: true }
          );
          console.log("captain_online:" + userId);
        } catch (err) {
          console.log("captain_online_error:" + userId);
        }
      }
    );
    socket.on("subscribe_nearby_drivers", async () => {
      try {
        const drivers = await OnlineDriver.find({});
        socket.emit("nearby_drivers_snapshot", drivers);
      } catch (err) {
        socket.emit("error", { message: "failed to load drivers" });
      }
    });

    socket.on(
      "location_update",
      async (payload: {
        userId: string;
        heading: number;
        location: {
          type: "Point";
          coordinates: [number, number];
        };
      }) => {
        const { userId, heading, location } = payload;
        try {
          await OnlineDriver.findOneAndUpdate(
            { userId },
            { $set: { location, socketId: socket.id, heading } }
          );
          console.log("🚀 captain_update received:", payload);
          io.emit("nearby_driver_update", { userId, location });
        } catch (err) {}
      }
    );

    socket.on("captain_offline", async (payload: { userId: string }) => {
      const { userId } = payload;
      try {
        await OnlineDriver.findOneAndDelete({ userId });
        notifyDriverOffline(io, userId);
      } catch (err) {
        console.log("error during offline: " + err);
      }
    });

    socket.on("disconnect", async () => {
      try {
       const user = await UserModel.findOneAndUpdate(
          { socketId: socket.id },
          { online: false, socketId: null }
        ).lean();

        if (user && user._id) {
          const driver = await OnlineDriver.findOneAndDelete({ userId: String(user._id) }).lean();
          if (driver) notifyDriverOffline(io, String(user._id));
        }
      } catch (err) {}
    });
  });
}
