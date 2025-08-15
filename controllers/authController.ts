// controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import User from '../models/userModel';
import catchAsync from '../utils/catchAsync';
import AppError from '../utils/appError';

const signToken = (id: string) => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtExpiresIn = process.env.JWT_EXPIRES_IN;

  if (!jwtSecret || !jwtExpiresIn) {
    throw new Error('JWT_SECRET or JWT_EXPIRES_IN is not defined in .env');
  }

  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpiresIn, 
  });
};


export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError("Please provide email and password!", 400,""));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next(new AppError("Incorrect email or password", 401,""));
    }

    const token = signToken(user._id.toString());
    const userWithoutPassword = await User.findById(user._id);

    res.status(200).json({
      status: "success",
      token,
      data: {
        userWithoutPassword,
      },
    });
  }
);

export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, password, role, vehicleType, photo,online,location } = req.body;
 const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError("Email already in use", 400, "EMAIL_IN_USE"));
  }


  if (!name || !email || !password || !role) {
    return next(new AppError('Please provide name, email, password, and role',400,"" ));
  }

  if (role === 'captain' && !vehicleType) {
    return next(new AppError('Captain must have a vehicleType', 400,""));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    vehicleType: role === 'captain' ? vehicleType : undefined,
    photo,
    online,
    location
  });

const token = signToken(newUser._id.toString());
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  });
});
