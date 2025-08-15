import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import User from "../models/userModel";
import AppError from "../utils/appError";
import FindTripe from "../models/findTripeModel";
import { getIO, initIO } from "../socket/socketHandler";
import { newTripRequest } from "../utils/ioPortConstant";

async function findNearbyDrivers(
  lng: number,
  lat: number,
  maxDistanceMeters = 50000000,
  vehicleType: string,
  limit = 20
) {
  const lngNum = Number(lng);
  const latNum = Number(lat);
  return User.find({
    role: "driver",
    online: true,
    // vehicleType: vehicleType,
    location: {
      $nearSphere: {
        $geometry: { type: "Point", coordinates: [lngNum, latNum] },
        $maxDistance: maxDistanceMeters,
      },
    },
  }).select("_id socketId location");
}
async function getDistanceAndTime(
  pLng: number,
  pLat: number,
  dLng: number,
  dLat: number
) {
  const googleMapsKey = process.env.GOOGLE_MAPS_KEY;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${pLat},${pLng}&destinations=${dLat},${dLng}&key=${googleMapsKey}`
  );
  const data = await response.json();

  if (data.status === "OK") {
    const element = data.rows[0].elements[0];
    return {
      distance: element.distance.value / 1000,
      duration: element.duration.value / 60,
    };
  }
}

export const createTrip = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { pLng, pLat, dLng, dLat } = req.body;
    if (!pLng || !pLat || !dLng || !dLat) {
      return next(new AppError("please provide all data", 400, ""));
    }
    const distanceAndTime = await getDistanceAndTime(pLng, pLat, dLng, dLat);
    const pricePerKm = 7;
    const pricePerMin = 5;
    if (!distanceAndTime) {
      return next(
        new AppError("Could not retrieve distance and time", 400, "")
      );
    }
    const { distance, duration } = distanceAndTime;
    const now = new Date();
    const currentTime = now.getHours();
    let rate = 1;
    if (currentTime >= 7 && currentTime < 12) {
      rate *= 3;
    }
    let price;
    if (distance < 10) {
      price = distance * pricePerKm;
    } else {
      price = duration * pricePerMin;
    }
    if (price <= 35) {
      price = 35;
    }
    res.status(201).json({
      status: "success",
      data: {
        distance: distance,
        duration: duration,
        car: price,
        scoter: (price * 3) / 4,
      },
    });
  }
);

export const createFindTrip = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      lng,
      lat,
      distance,
      time,
      pickUpAddress,
      dropOffAddress,
      dropOffCoords,
      price,
      vehicleType,
    } = req.body;
    console.log("📥 Request body:", req.body);
    if (
      !lng ||
      !lat ||
      !distance ||
      !time ||
      !pickUpAddress ||
      !dropOffAddress ||
      !price ||
      !vehicleType ||
      !dropOffCoords
    ) {
      return next(new AppError("please provide all data. ", 400, ""));
    }
    const trip = await FindTripe.create({
      price,
      tripe: {
        distance,
        time,
        pickUpPoint: {
          point: {
            type: "Point",
            coordinates: [lng, lat],
          },
          address: pickUpAddress,
        },
        dropOff: {
          point: {
            type: "Point",
            coordinates: req.body.dropOffCoords,
          },
          address: dropOffAddress,
        },
      },
    });
    console.log("✅ Trip created:", trip);

    const nearbyDrivers = await findNearbyDrivers(
      lng,
      lat,
      10 * 1000,
      vehicleType
    );
    console.log("✅ Nearby drivers found:", nearbyDrivers.length);

    const io = getIO();
    nearbyDrivers.forEach((driver) => {
      console.log("id:" + driver.socketId);

      if (driver.socketId) {
        io.to(driver.socketId).emit(newTripRequest, {
          tripId: trip._id,
          pickUp: trip.tripe.pickUpPoint,
          dropOff: trip.tripe.dropOff,
          price: trip.price,
          distance: trip.tripe.distance,
          time: trip.tripe.time,
        });
        console.log("✅ Event emitted to drivers");
      }
    });

    res.status(201).json({
      status: "success",
      data: {
        trip: trip,
        ldrivder: nearbyDrivers.length,
      },
    });
  }
);
