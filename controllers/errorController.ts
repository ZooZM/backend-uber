import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';

export const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.error_code = err.error_code || 'error';

  res.status(err.statusCode).json({
    status: err.error_code,
    message: err.message
  });
};
