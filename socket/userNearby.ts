// sockets/userNearby.ts
import { Server, Socket } from "socket.io";
import OnlineDriver from "../models/onlineDriver";
import { userSubs, metersToRadians, UserSubscription, distanceM } from "./nearbyStore";

type SubscribePayload = {
  userId: string;
  coords: [number, number];
  radius: number; 
};

export function registerUserNearbyHandlers(io: Server, socket: Socket) {
  socket.on("user_subscribe_nearby", async (payload: SubscribePayload) => {
    try {
      const { userId, coords, radius } = payload;

      const sub: UserSubscription = {
        socketId: socket.id,
        userId,
        center: coords,
        radiusM: radius,
        seenDriverIds: new Set<string>(),
      };
      userSubs.set(socket.id, sub);

      const query: any = {
        location: {
          $geoWithin: {
            $centerSphere: [coords, metersToRadians(radius)],
          },
        },
      };

      const drivers = await OnlineDriver.find(query, {
        _id: 0,
        userId: 1,
        location: 1,
        heading: 1,
        updatedAt: 1,
      }).lean();

      socket.emit("nearby_snapshot", { drivers });
    } catch (err) {
      socket.emit("error", {
        scope: "user_subscribe_nearby",
        message: String(err),
      });
    }
  });

  socket.on(
    "user_update_subscription",
    async (payload: Omit<SubscribePayload, "userId">) => {
      try {
        const current = userSubs.get(socket.id);
        if (!current) return;

        current.center = payload.coords;
        current.radiusM = payload.radius;
        userSubs.set(socket.id, current);

        const query: any = {
          location: {
            $geoWithin: {
              $centerSphere: [payload.coords, metersToRadians(payload.radius)],
            },
          },
        };

        const drivers = await OnlineDriver.find(query, {
          _id: 0,
          userId: 1,
          vehicleType: 1,
          location: 1,
          heading: 1,
          updatedAt: 1,
        }).lean();

        socket.emit("nearby_snapshot", { drivers });
      } catch (err) {
        socket.emit("error", {
          scope: "user_update_subscription",
          message: String(err),
        });
      }
    }
  );

  socket.on("user_unsubscribe_nearby", () => {
    userSubs.delete(socket.id);
  });

  socket.on("disconnect", () => {
    userSubs.delete(socket.id);
  });
}
export function notifySubscribersOfDriver(
  io: Server,
  driver: { userId: string; location: { type: "Point"; coordinates: [number, number] }; heading?: number; updatedAt?: Date }
) {
  for (const sub of userSubs.values()) {
    const dist = distanceM(sub.center, driver.location.coordinates);
    const isInside = dist <= sub.radiusM;
    const wasSeen = sub.seenDriverIds.has(driver.userId);

    if (isInside) {
      if (!wasSeen) {
        io.to(sub.socketId).emit("nearby_driver_enter", driver);
        sub.seenDriverIds.add(driver.userId);
      }
      io.to(sub.socketId).emit("nearby_driver_update", driver);
    } else {
      if (wasSeen) {
        io.to(sub.socketId).emit("nearby_driver_leave", { userId: driver.userId });
        sub.seenDriverIds.delete(driver.userId);
      }
    }
  }
}

export function notifyDriverOffline(io: Server, driverId: string) {
  for (const sub of userSubs.values()) {
    if (sub.seenDriverIds.delete(driverId)) {
      io.to(sub.socketId).emit("nearby_driver_leave", { userId: driverId });
    }
  }
}