import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Lỗi hệ thống';

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    logger.error('Unhandled Error:', err);
    // Include the original error message in development environment
    if (process.env.NODE_ENV !== 'production') {
      message = err.message || message;
    }
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
  });
};
