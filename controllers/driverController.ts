import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catchAsync";
import AppError from "../utils/appError";
import jwt from "jsonwebtoken";
import User from "../models/userModel";

export const setDriverOnline = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("You are not logged in!", 401, "NO_TOKEN"));
    }

    const token = authHeader.split(" ")[1];

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
      iat: number;
      exp: number;
    };

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError("User not found!", 401, "NO_USER"));
    }
    (req as any).user = user;

    if (user.role !== "driver") {
      return next(
        new AppError("you havn`t permision to use this route!", 401, "NO_USER")
      );
    }
    user.online = true;
    await user.save();

    res.status(200).json({
        status:'success',
        message: `${user.name} is online now`,
        user,
    })
  }
);