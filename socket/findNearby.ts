import { Server, Socket } from "socket.io";
import { metersToRadians, userSubs, UserSubscription } from "./nearbyStore";
import OnlineDriver from "../models/onlineDriver";
type SubscribePayload = {
  userId: string;
  coords: [number, number];
  radius: number;
};
export function registerFindNearbyDriver(io: Server, socket: Socket) {
  socket.on("find_nearby_driver", async (payload: SubscribePayload) => {
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
    } catch (e) {}
  });
}
/*

*/
